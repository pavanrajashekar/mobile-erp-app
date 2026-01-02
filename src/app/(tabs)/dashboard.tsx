import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AddExpenseModal from '@/components/AddExpenseModal';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        sales: 0,
        expenses: 0,
        netProfit: 0,
    });
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

            // 1. Total Products (Always total, not time ranged)
            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // 2. Low Stock (Global)
            const { data: products } = await supabase
                .from('products')
                .select('id, stock_movements(quantity)');

            let lowStockCount = 0;
            if (products) {
                products.forEach(p => {
                    const stock = p.stock_movements?.reduce((sum: number, m: any) => sum + Number(m.quantity), 0) || 0;
                    if (stock < 10) lowStockCount++;
                });
            }

            // 3. Sales (Time Ranged)
            // Query sales
            const { data: sales } = await supabase
                .from('sales')
                .select('total_amount, created_at')
                .gte('created_at', startDate);

            const salesTotal = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

            // 4. Expenses (Time Ranged)
            // Expenses store 'date' which might be just YYYY-MM-DD or ISO.
            // If it's just date, comparison still works if string format matches ISO YYYY-MM-DD.
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount, date')
                .gte('date', startDate);

            const expensesTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
            const netProfit = salesTotal - expensesTotal;

            setStats({
                totalProducts: productCount || 0,
                lowStock: lowStockCount,
                sales: salesTotal,
                expenses: expensesTotal,
                netProfit: netProfit,
            });

        } catch (error) {
            console.error('Dashboard Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload when timeRange changes
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <ThemedText type="title">Dashboard</ThemedText>
                        <ThemedText type="caption">Financial overview</ThemedText>
                    </View>
                    {/* Could place Profile/Settings icon here */}
                </View>

                {/* Time Filter */}
                <View style={styles.filterContainer}>
                    <SegmentedControl
                        values={['Day', 'Week', 'Month', 'Year']}
                        selectedIndex={['Day', 'Week', 'Month', 'Year'].indexOf(timeRange)}
                        onChange={(event) => {
                            setTimeRange(['Day', 'Week', 'Month', 'Year'][event.nativeEvent.selectedSegmentIndex] as any);
                        }}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.statsContainer}>
                        {/* Hero Card: Net Profit */}
                        <Card style={[styles.heroCard, { backgroundColor: stats.netProfit >= 0 ? Colors.primary : Colors.error }]}>
                            <View>
                                <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Net Profit ({timeRange})</ThemedText>
                                <ThemedText type="title" style={{ color: 'white', fontSize: 36, marginTop: 4 }}>
                                    ${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </ThemedText>
                            </View>
                            <Ionicons
                                name={stats.netProfit >= 0 ? "trending-up" : "trending-down"}
                                size={48}
                                color="rgba(255,255,255,0.2)"
                                style={{ position: 'absolute', right: 20, top: 20 }}
                            />
                        </Card>

                        {/* Stats Grid */}
                        <View style={styles.grid}>
                            {/* Income */}
                            <Card style={styles.statCard}>
                                <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
                                    <Ionicons name="arrow-down-circle-outline" size={24} color="#2e7d32" />
                                </View>
                                <ThemedText type="defaultSemiBold" style={{ color: '#2e7d32' }}>+${stats.sales.toFixed(0)}</ThemedText>
                                <ThemedText type="caption">Income</ThemedText>
                            </Card>

                            {/* Expense */}
                            <Card style={styles.statCard}>
                                <View style={[styles.iconBox, { backgroundColor: '#ffebee' }]}>
                                    <Ionicons name="arrow-up-circle-outline" size={24} color="#c62828" />
                                </View>
                                <ThemedText type="defaultSemiBold" style={{ color: '#c62828' }}>-${stats.expenses.toFixed(0)}</ThemedText>
                                <ThemedText type="caption">Expense</ThemedText>
                            </Card>

                            {/* Products */}
                            <Card style={styles.statCard}>
                                <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
                                    <Ionicons name="cube-outline" size={24} color="#1565c0" />
                                </View>
                                <ThemedText type="defaultSemiBold">{stats.totalProducts}</ThemedText>
                                <ThemedText type="caption">Products</ThemedText>
                            </Card>

                            {/* Low Stock */}
                            <Card style={styles.statCard}>
                                <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                                    <Ionicons name="alert-circle-outline" size={24} color="#ef6c00" />
                                </View>
                                <ThemedText type="defaultSemiBold">{stats.lowStock}</ThemedText>
                                <ThemedText type="caption">Low Stock</ThemedText>
                            </Card>
                        </View>
                    </View>
                )}

                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Quick Actions</ThemedText>
                    <View style={styles.actionGrid}>
                        {/* New Quote */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/quick-quote')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#e0f7fa' }]}>
                                <Ionicons name="document-text-outline" size={28} color="#006064" />
                            </View>
                            <ThemedText type="caption" style={styles.actionText}>New Quote</ThemedText>
                        </TouchableOpacity>

                        {/* New Expense */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setExpenseModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#ffebee' }]}>
                                <Ionicons name="wallet-outline" size={28} color="#c62828" />
                            </View>
                            <ThemedText type="caption" style={styles.actionText}>Add Expense</ThemedText>
                        </TouchableOpacity>

                        {/* Add Product */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/(tabs)/products')} // Just nav to products for now, ideally open modal
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="add-circle-outline" size={28} color="#1565c0" />
                            </View>
                            <ThemedText type="caption" style={styles.actionText}>Add Item</ThemedText>
                        </TouchableOpacity>

                        {/* New Invoice (Nav to Billing) */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/(tabs)/billing')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                                <Ionicons name="cart-outline" size={28} color="#2e7d32" />
                            </View>
                            <ThemedText type="caption" style={styles.actionText}>New Sale</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Spacer for navbar */}
                <View style={{ height: 20 }} />
            </ScrollView>

            <AddExpenseModal
                visible={expenseModalVisible}
                onClose={() => setExpenseModalVisible(false)}
                onSave={loadStats}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterContainer: {
        marginBottom: 24,
    },
    statsContainer: {
        gap: 16,
    },
    heroCard: {
        padding: 24,
        borderRadius: 20,
        minHeight: 140,
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 32,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        minWidth: '20%', // 4 per row roughly
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionText: {
        textAlign: 'center',
        fontWeight: '600',
    }
});
