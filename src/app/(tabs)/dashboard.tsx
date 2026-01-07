import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
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
import { ThemedView } from '@/components/ThemedView';

export default function Dashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const activeColors = Colors[theme];

    // ---------------- State ----------------
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        sales: 0,
        cogs: 0,
        expenses: 0,
        purchases: 0,
        netProfit: 0,
        stockValue: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [deadStockItems, setDeadStockItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters & Modals
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');

    // ---------------- Helpers ----------------
    const getStartDate = (range: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (range === 'Day') return now.toISOString();

        const date = new Date(now);
        if (range === 'Week') date.setDate(date.getDate() - 7);
        if (range === 'Month') date.setDate(date.getDate() - 30);
        if (range === 'Year') date.setDate(date.getDate() - 365);

        return date.toISOString();
    };

    // ---------------- Data Loading ----------------
    const loadStats = async () => {
        try {
            const startDate = getStartDate(timeRange);

            // 1. Products Logic (Low Stock & Dead Stock)
            const { data: products } = await supabase
                .from('products')
                .select('id, name, cost_price, unit, stock_movements(quantity, movement_type, created_at)');

            const productCount = products?.length || 0;
            let totalStockValue = 0;

            const lowStockList: any[] = [];
            const deadStockList: any[] = [];
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            if (products) {
                products.forEach(p => {
                    const stock = p.stock_movements?.reduce((sum: number, m: any) => sum + Number(m.quantity), 0) || 0;

                    if (stock > 0) {
                        totalStockValue += (stock * (Number(p.cost_price) || 0));
                    }

                    if (stock < 10) {
                        lowStockList.push({ ...p, current_stock: stock });
                    }

                    if (stock > 0) {
                        const lastSale = p.stock_movements?.find((m: any) =>
                            m.movement_type === 'sale' && new Date(m.created_at) > ninetyDaysAgo
                        );
                        if (!lastSale) {
                            deadStockList.push({ ...p, current_stock: stock });
                        }
                    }
                });
            }

            setLowStockItems(lowStockList.sort((a, b) => a.current_stock - b.current_stock).slice(0, 10));
            setDeadStockItems(deadStockList.slice(0, 5));

            // 2. Sales
            const { data: sales } = await supabase
                .from('sales')
                .select('id, total_amount, created_at, contacts(name), sale_items(quantity, cost_at_sale)')
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
                .select('id, total_cost, created_at, products(name), contacts(name)')
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
                lowStock: lowStockList.length,
                sales: salesTotal,
                cogs: cogsTotal,
                expenses: expensesTotal,
                purchases: purchasesTotal,
                netProfit: netProfit,
                stockValue: totalStockValue,
            });

            // 5. Recent Activity
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

    // ---------------- Effects ----------------
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

    // ---------------- Gestures ----------------
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

    // ---------------- Render Helpers ----------------
    const renderActivityItem = (item: any) => {
        let iconName: any = 'help';
        let iconColor = activeColors.textSecondary;
        let bgColor = activeColors.surfaceSubtle;
        let title = '';
        let subtitle = '';
        let amount = 0;
        let isNegative = false;

        if (item.type === 'sale') {
            iconName = 'receipt-outline';
            iconColor = activeColors.success;
            bgColor = 'rgba(58, 197, 98, 0.1)'; // successLight
            title = item.contacts?.name ? `Sale to ${item.contacts.name}` : 'New Sale';
            subtitle = new Date(item.date).toLocaleDateString();
            amount = item.amount;
        } else if (item.type === 'expense') {
            iconName = 'wallet-outline';
            iconColor = activeColors.error;
            bgColor = 'rgba(239, 68, 68, 0.1)'; // errorLight
            title = item.description || 'Expense';
            subtitle = new Date(item.date).toLocaleDateString();
            amount = item.amount;
            isNegative = true;
        } else if (item.type === 'purchase') {
            iconName = 'cube-outline';
            iconColor = activeColors.warning;
            bgColor = 'rgba(245, 158, 11, 0.1)'; // warningLight
            const productName = item.products?.name || 'Items';
            title = `Stock In: ${productName}`;
            subtitle = item.contacts?.name ? `From ${item.contacts.name}` : new Date(item.date).toLocaleDateString();
            amount = item.amount;
            isNegative = true;
        }

        return (
            <View key={`${item.type}-${item.id}`} style={[styles.activityItem, { borderBottomColor: activeColors.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: bgColor }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.activityContent}>
                    <ThemedText type="defaultSemiBold">{title}</ThemedText>
                    <ThemedText type="default" style={[styles.activityDate, { color: activeColors.textSecondary }]}>{subtitle}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={{ color: isNegative ? activeColors.text : activeColors.success }}>
                    {isNegative ? '-' : '+'}₹{Number(amount).toFixed(2)}
                </ThemedText>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 10 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../../assets/images/revenew-logo.svg')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
                        <View>
                            <ThemedText type="title" style={{ fontSize: 28 }}>revenew</ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Avatar name={user?.user_metadata?.full_name || user?.email} size={42} />
                    </TouchableOpacity>
                </View>

                <GestureDetector gesture={composedGestures}>
                    <ScrollView
                        contentContainerStyle={styles.content}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.text} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Time Filter Segmented Control */}
                        <View style={styles.segmentContainer}>
                            {(['Day', 'Week', 'Month', 'Year'] as const).map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    onPress={() => setTimeRange(range)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.segmentButton,
                                        timeRange === range && styles.segmentButtonActive
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.segmentText,
                                            timeRange === range ? { color: activeColors.primary, fontWeight: '700' } : { color: activeColors.textSecondary, fontWeight: '500' }
                                        ]}
                                    >
                                        {range}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {loading ? (
                            <LoadingState message="Analyzing data..." transparent />
                        ) : (

                            <View style={styles.statsContainer}>
                                {/* Super Card 1: Financial Health */}
                                <View style={[styles.superCard, { backgroundColor: '#ffffff', borderColor: activeColors.border }]}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <ThemedText style={{ color: activeColors.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>NET PROFIT</ThemedText>
                                            <ThemedText type="title" style={{ fontSize: 32, marginTop: 4, color: stats.netProfit > 0 ? activeColors.success : activeColors.text }}>
                                                {stats.netProfit > 0 ? '+' : ''}₹{stats.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </ThemedText>
                                        </View>
                                        <View style={[styles.trendBadge, { backgroundColor: stats.netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)' }]}>
                                            <Ionicons name={stats.netProfit >= 0 ? "trending-up" : "trending-down"} size={16} color={stats.netProfit >= 0 ? activeColors.success : activeColors.textSecondary} />
                                            <ThemedText style={{ color: stats.netProfit >= 0 ? activeColors.success : activeColors.textSecondary, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                                                {stats.sales > 0 ? ((stats.netProfit / stats.sales) * 100).toFixed(0) : 0}%
                                            </ThemedText>
                                        </View>
                                    </View>

                                    {/* Visual Margin Bar */}
                                    {/* Bar represents 100% of Sales. Red = COGS, Orange = Expenses, Green = Profit */}
                                    <View style={[styles.dividerHorizontal, { backgroundColor: activeColors.surfaceSubtle }]} />

                                    {/* Financial Statement Breakdown */}
                                    <View style={{ gap: 12 }}>
                                        {/* Income Row - Positive (Green) */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={[styles.miniDot, { backgroundColor: activeColors.success }]} />
                                                <ThemedText style={{ fontSize: 14, color: activeColors.textSecondary }}>Income</ThemedText>
                                            </View>
                                            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: activeColors.success }}>
                                                +₹{stats.sales.toLocaleString()}
                                            </ThemedText>
                                        </View>

                                        {/* COGS Row - Cost (Black) */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
                                                <ThemedText style={{ fontSize: 14, color: activeColors.textSecondary }}>(-) Goods Cost</ThemedText>
                                            </View>
                                            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: activeColors.text }}>
                                                ₹{stats.cogs.toLocaleString()}
                                            </ThemedText>
                                        </View>

                                        {/* Expenses Row - Cost (Black) */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={[styles.miniDot, { backgroundColor: '#EF4444' }]} />
                                                <ThemedText style={{ fontSize: 14, color: activeColors.textSecondary }}>(-) Expenses</ThemedText>
                                            </View>
                                            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: activeColors.text }}>
                                                ₹{stats.expenses.toLocaleString()}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>

                                {/* Super Card 2: Inventory Status */}
                                <View style={[styles.superCard, { backgroundColor: '#ffffff', borderColor: activeColors.border }]}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <ThemedText style={{ color: activeColors.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>INVENTORY VALUE</ThemedText>
                                            <ThemedText type="title" style={{ fontSize: 32, marginTop: 4, color: activeColors.success }}>
                                                +₹{stats.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </ThemedText>
                                        </View>
                                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                            <Ionicons name="cube" size={20} color="#F59E0B" />
                                        </View>
                                    </View>

                                    <View style={[styles.dividerHorizontal, { backgroundColor: activeColors.surfaceSubtle }]} />

                                    <View style={styles.cardFooter}>
                                        <View style={styles.footerItem}>
                                            <ThemedText style={{ fontSize: 12, color: activeColors.textSecondary }}>Purchases</ThemedText>
                                            <ThemedText type="defaultSemiBold">₹{stats.purchases.toLocaleString()}</ThemedText>
                                        </View>
                                        <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                                        <View style={styles.footerItem}>
                                            <ThemedText style={{ fontSize: 12, color: activeColors.textSecondary }}>Low Stock</ThemedText>
                                            <ThemedText type="defaultSemiBold" style={{ color: stats.lowStock > 0 ? activeColors.warning : activeColors.text }}>
                                                {stats.lowStock} Items
                                            </ThemedText>
                                        </View>
                                    </View>

                                    {/* Actionable Alert */}
                                    {stats.lowStock > 0 && (
                                        <TouchableOpacity
                                            onPress={() => router.push('/products')}
                                            style={[styles.alertBanner, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                                        >
                                            <Ionicons name="warning" size={16} color={activeColors.warning} />
                                            <ThemedText style={{ fontSize: 12, color: activeColors.warning, fontWeight: '600', marginLeft: 6 }}>
                                                Restock Recommended
                                            </ThemedText>
                                            <Ionicons name="chevron-forward" size={16} color={activeColors.warning} style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Recent Activity */}
                                <View style={styles.sectionHeader}>
                                    <ThemedText type="subtitle" style={{ fontSize: 18 }}>Recent Activity</ThemedText>
                                </View>
                                <Card style={styles.activityCard} variant="flat">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map(renderActivityItem)
                                    ) : (
                                        <ThemedText style={{ textAlign: 'center', color: activeColors.textSecondary, padding: 20 }}>No recent activity</ThemedText>
                                    )}
                                </Card>
                            </View>
                        )}
                        <View style={{ height: 120 }} />
                    </ScrollView>
                </GestureDetector>
            </SafeAreaView>

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
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0', // Slate 200
        borderRadius: 24,
        padding: 4,
        marginBottom: 20,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
    },
    statsContainer: {
        gap: 16,
    },
    superCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginBottom: 20,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressBarOver: {
        height: '100%',
        position: 'absolute',
        left: 0,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerItem: {
        flex: 1,
        gap: 4,
    },
    divider: {
        width: 1,
        height: 32,
        marginHorizontal: 16,
    },
    dividerHorizontal: {
        height: 1,
        width: '100%',
        marginVertical: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    miniDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sectionHeader: {
        marginTop: 12,
        marginBottom: 4,
    },
    activityCard: {
        padding: 0,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#ffffff', // Force white
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.6)',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
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
    },
});
