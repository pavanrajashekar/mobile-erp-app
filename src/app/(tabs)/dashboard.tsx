import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AddExpenseModal from '@/components/AddExpenseModal';
import Avatar from '@/components/Avatar';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import LoadingState from '@/components/LoadingState';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        sales: 0,
        expenses: 0,
        purchases: 0,
        netProfit: 0,
        stockValue: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');
    const router = useRouter();

    const getStartDate = (range: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        if (range === 'Day') return now.toISOString();

        const date = new Date(now);
        if (range === 'Week') date.setDate(date.getDate() - 7);
        if (range === 'Month') date.setDate(date.getDate() - 30);
        if (range === 'Year') date.setDate(date.getDate() - 365);

        return date.toISOString();
    };

    const loadStats = async () => {
        try {
            const startDate = getStartDate(timeRange);

            // 1. Total Products, Low Stock & Stock Value
            const { data: products } = await supabase
                .from('products')
                .select('id, cost_price, stock_movements(quantity)', { count: 'exact' });

            const productCount = products?.length || 0;
            let lowStockCount = 0;
            let totalStockValue = 0;

            if (products) {
                products.forEach(p => {
                    const stock = p.stock_movements?.reduce((sum: number, m: any) => sum + Number(m.quantity), 0) || 0;
                    if (stock < 10) lowStockCount++;
                    if (stock > 0) {
                        totalStockValue += (stock * (Number(p.cost_price) || 0));
                    }
                });
            }

            // 2. Sales
            const { data: sales } = await supabase
                .from('sales')
                .select('id, total_amount, created_at, sale_items(quantity, cost_at_sale)')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false });

            // 3. Expenses
            const { data: expenses } = await supabase
                .from('expenses')
                .select('id, amount, date, description')
                .gte('date', startDate)
                .order('date', { ascending: false });

            // 4. Purchases
            const { data: purchases } = await supabase
                .from('purchases')
                .select('id, total_cost, created_at, products(name)')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false });

            // Calculate Totals
            let salesTotal = 0;
            let cogsTotal = 0;
            if (sales) {
                sales.forEach(sale => {
                    salesTotal += Number(sale.total_amount);
                    if (sale.sale_items) {
                        sale.sale_items.forEach((item: any) => {
                            cogsTotal += (Number(item.quantity) * Number(item.cost_at_sale || 0));
                        });
                    }
                });
            }

            const expensesTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
            const purchasesTotal = purchases?.reduce((sum, pur) => sum + Number(pur.total_cost), 0) || 0;

            const grossProfit = salesTotal - cogsTotal;
            const netProfit = grossProfit - expensesTotal;

            setStats({
                totalProducts: productCount,
                lowStock: lowStockCount,
                sales: salesTotal,
                expenses: expensesTotal,
                purchases: purchasesTotal,
                netProfit: netProfit,
                stockValue: totalStockValue,
            });

            // 5. Recent Activity (Top 5 Mixed)
            const recentSales = (sales || []).slice(0, 5).map(s => ({ ...s, type: 'sale', date: s.created_at, amount: s.total_amount }));
            const recentExpenses = (expenses || []).slice(0, 5).map(e => ({ ...e, type: 'expense', date: e.date, amount: e.amount }));
            const recentPurchases = (purchases || []).slice(0, 5).map(p => ({ ...p, type: 'purchase', date: p.created_at, amount: p.total_cost }));

            const combined = [...recentSales, ...recentExpenses, ...recentPurchases]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5);

            setRecentActivity(combined);

        } catch (error) {
            console.error('Dashboard Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadStats();
    }, [timeRange]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const handleSwipe = (direction: 'left' | 'right') => {
        const ranges: ('Day' | 'Week' | 'Month' | 'Year')[] = ['Day', 'Week', 'Month', 'Year'];
        const currentIndex = ranges.indexOf(timeRange);
        let newIndex = currentIndex;

        if (direction === 'left') {
            if (currentIndex < ranges.length - 1) newIndex++;
        } else {
            if (currentIndex > 0) newIndex--;
        }

        if (newIndex !== currentIndex) {
            setTimeRange(ranges[newIndex]);
        }
    };

    const swipeLeft = Gesture.Fling().direction(1).onEnd(() => runOnJS(handleSwipe)('right'));
    const swipeRight = Gesture.Fling().direction(2).onEnd(() => runOnJS(handleSwipe)('left'));

    const composedGestures = Gesture.Simultaneous(swipeLeft, swipeRight);

    const renderActivityItem = (item: any) => {
        let iconName: any = 'help';
        let iconColor = Colors.textSecondary;
        let bgColor = Colors.surfaceSubtle;
        let title = '';
        let subtitle = '';
        let amount = 0;
        let isNegative = false;

        if (item.type === 'sale') {
            iconName = 'receipt-outline';
            iconColor = Colors.success;
            bgColor = Colors.successLight;
            title = 'New Sale';
            subtitle = new Date(item.date).toLocaleDateString();
            amount = item.amount;
        } else if (item.type === 'expense') {
            iconName = 'wallet-outline';
            iconColor = Colors.error;
            bgColor = Colors.errorLight;
            title = item.description || 'Expense';
            subtitle = new Date(item.date).toLocaleDateString();
            amount = item.amount;
            isNegative = true;
        } else if (item.type === 'purchase') {
            iconName = 'cube-outline';
            iconColor = Colors.warning;
            bgColor = '#fff3e0';
            title = `Stock In: ${item.products?.name || 'Unknown'}`;
            subtitle = new Date(item.date).toLocaleDateString();
            amount = item.amount;
            isNegative = true;
        }

        return (
            <View key={`${item.type}-${item.id}`} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: bgColor }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.activityContent}>
                    <ThemedText type="defaultSemiBold">{title}</ThemedText>
                    <ThemedText type="default" style={styles.activityDate}>{subtitle}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={{ color: isNegative ? Colors.text : Colors.success }}>
                    {isNegative ? '-' : '+'}₹{Number(amount).toFixed(2)}
                </ThemedText>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={composedGestures}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    <SafeAreaView edges={['top']}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <ThemedText type="title" style={{ fontSize: 28, color: Colors.text }}>Overview</ThemedText>
                                <ThemedText type="default" style={{ color: Colors.textSecondary }}>{user?.user_metadata?.full_name || 'Admin'}</ThemedText>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/profile')}>
                                <Avatar name={user?.user_metadata?.full_name || user?.email} size={42} />
                            </TouchableOpacity>
                        </View>

                        {/* Pill Bar Filters */}
                        <View style={styles.filterContainer}>
                            {['Day', 'Week', 'Month', 'Year'].map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    onPress={() => setTimeRange(range as any)}
                                    style={[styles.filterPill, timeRange === range && styles.filterPillActive]}
                                >
                                    <ThemedText
                                        type="defaultSemiBold"
                                        style={[styles.filterText, timeRange === range && styles.filterTextActive]}
                                    >
                                        {range}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        import LoadingState from '@/components/LoadingState';

                        // ... inside component

                        {loading ? (
                            <LoadingState message="Analyzing data..." transparent />
                        ) : (
                            <View style={styles.statsContainer}>
                                {/* Hero Card: Net Profit */}
                                <Card style={[styles.heroCard, { backgroundColor: stats.netProfit >= 0 ? Colors.primary : Colors.error }]}>
                                    <View style={styles.heroContent}>
                                        <View>
                                            <ThemedText type="default" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Net Profit</ThemedText>
                                            <ThemedText type="title" style={{ color: 'white', fontSize: 42, lineHeight: 48 }}>
                                                ₹{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.heroIcon}>
                                            <Ionicons name={stats.netProfit >= 0 ? "trending-up" : "trending-down"} size={32} color="white" />
                                        </View>
                                    </View>
                                </Card>

                                {/* Grid 1: Sales & Expenses */}
                                <View style={styles.grid}>
                                    <Card style={styles.statCard}>
                                        <View style={[styles.iconBox, { backgroundColor: Colors.successLight }]}>
                                            <Ionicons name="arrow-down" size={20} color={Colors.success} />
                                        </View>
                                        <View>
                                            <ThemedText type="default" style={styles.statLabel}>Income</ThemedText>
                                            <ThemedText type="defaultSemiBold" style={{ color: Colors.success, fontSize: 16 }}>
                                                +₹{stats.sales.toLocaleString()}
                                            </ThemedText>
                                        </View>
                                    </Card>

                                    <Card style={styles.statCard}>
                                        <View style={[styles.iconBox, { backgroundColor: Colors.errorLight }]}>
                                            <Ionicons name="arrow-up" size={20} color={Colors.error} />
                                        </View>
                                        <View>
                                            <ThemedText type="default" style={styles.statLabel}>Expense</ThemedText>
                                            <ThemedText type="defaultSemiBold" style={{ color: Colors.error, fontSize: 16 }}>
                                                -₹{stats.expenses.toLocaleString()}
                                            </ThemedText>
                                        </View>
                                    </Card>
                                </View>

                                {/* Grid 2: Purchases & Stock Value */}
                                <View style={styles.grid}>
                                    <Card style={styles.statCard}>
                                        <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                                            <Ionicons name="cube" size={20} color={Colors.warning} />
                                        </View>
                                        <View>
                                            <ThemedText type="default" style={styles.statLabel}>Purchases</ThemedText>
                                            <ThemedText type="defaultSemiBold" style={{ color: Colors.warning, fontSize: 16 }}>
                                                ₹{stats.purchases.toLocaleString()}
                                            </ThemedText>
                                        </View>
                                    </Card>

                                    <Card style={styles.statCard}>
                                        <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
                                            <Ionicons name="pricetag" size={20} color={Colors.primary} />
                                        </View>
                                        <View>
                                            <ThemedText type="default" style={styles.statLabel}>Stock Value</ThemedText>
                                            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary, fontSize: 16 }}>
                                                ₹{stats.stockValue.toLocaleString()}
                                            </ThemedText>
                                        </View>
                                    </Card>
                                </View>

                                {/* Alert Row: Low Stock */}
                                {stats.lowStock > 0 && (
                                    <Card style={styles.alertCard} variant="flat">
                                        <Ionicons name="alert-circle" size={20} color={Colors.error} />
                                        <ThemedText type="defaultSemiBold" style={{ color: Colors.error }}>{stats.lowStock} Items Low Stock</ThemedText>
                                    </Card>
                                )}

                                {/* Recent Activity */}
                                <View style={styles.sectionHeader}>
                                    <ThemedText type="subtitle" style={{ fontSize: 18 }}>Recent Activity</ThemedText>
                                </View>
                                <Card style={styles.activityCard} variant="flat">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map(renderActivityItem)
                                    ) : (
                                        <ThemedText style={{ textAlign: 'center', color: Colors.textSecondary, padding: 20 }}>No recent activity</ThemedText>
                                    )}
                                </Card>
                            </View>
                        )}
                    </SafeAreaView>
                    <View style={{ height: 120 }} />
                </ScrollView>
            </GestureDetector>

            <AddExpenseModal
                visible={expenseModalVisible}
                onClose={() => setExpenseModalVisible(false)}
                onSave={loadStats}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    header: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterContainer: {
        marginBottom: 20,
        flexDirection: 'row',
        backgroundColor: Colors.surfaceSubtle,
        padding: 4,
        borderRadius: 40,
    },
    filterPill: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
    },
    filterPillActive: {
        backgroundColor: Colors.white,
        ...Colors.shadow,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    filterText: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    filterTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    statsContainer: {
        gap: 12,
    },
    heroCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 4,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        gap: 12,
        borderRadius: 20,
    },
    statLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginBottom: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.errorLight,
        padding: 12,
        borderRadius: 16,
        justifyContent: 'center',
    },
    sectionHeader: {
        marginTop: 12,
        marginBottom: 4,
    },
    activityCard: {
        padding: 0,
        borderRadius: 20,
        backgroundColor: Colors.surface, // Used to be white, but surface matches card style
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceSubtle,
        gap: 12,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityDate: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
});
