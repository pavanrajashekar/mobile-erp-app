import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import { FAB } from '@/components/FAB';
import { fetchExpenses, Expense } from '@/services/expenseService';
import { fetchPurchases, Purchase } from '@/services/purchaseService';
import AddExpenseModal from '@/components/AddExpenseModal';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

interface Transaction {
    id: string;
    product_id: string;
    quantity: number;
    movement_type: string;
    created_at: string;
    status: 'completed' | 'quote' | null;
    total_amount: number;
}

type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';
type FilterType = 'all' | 'completed' | 'quote' | 'expenses' | 'purchases';

const FILTER_LABELS: Record<FilterType, string> = {
    all: 'All',
    completed: 'Invoices',
    quote: 'Quotes',
    expenses: 'Expenses',
    purchases: 'Purchases'
};

export default function SalesScreen() {
    const [sales, setSales] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [timeRange, setTimeRange] = useState<TimeRange>('Month');
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const router = useRouter();

    const fetchTransactions = async () => {
        try {
            const [salesResponse, expensesData, purchasesData] = await Promise.all([
                supabase.from('sales').select('*').order('created_at', { ascending: false }),
                fetchExpenses(),
                fetchPurchases()
            ]);

            if (salesResponse.error) throw salesResponse.error;
            setSales(salesResponse.data || []);
            setExpenses(expensesData || []);
            setPurchases(purchasesData || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const getStatusColor = (status: 'quote' | 'completed' | null) => {
        switch (status) {
            case 'completed': return Colors.success;
            case 'quote': return Colors.warning;
            default: return Colors.text;
        }
    };

    const getStartDate = (range: TimeRange) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (range === 'Day') return now;

        const date = new Date(now);
        if (range === 'Week') date.setDate(date.getDate() - 7);
        if (range === 'Month') date.setDate(date.getDate() - 30);
        if (range === 'Year') date.setDate(date.getDate() - 365);

        return date;
    };

    const filteredData = useMemo(() => {
        let data: any[] = [];

        // 1. Filter by Type
        if (filter === 'expenses') {
            data = expenses;
        } else if (filter === 'purchases') {
            data = purchases;
        } else if (filter === 'completed') {
            data = sales.filter(s => s.status === 'completed');
        } else if (filter === 'quote') {
            data = sales.filter(s => s.status === 'quote');
        } else {
            // All: Merge
            data = ([...sales, ...expenses, ...purchases] as any[]);
        }

        // 2. Filter by Time Range
        const startDate = getStartDate(timeRange);

        data = data.filter(item => {
            const dateStr = 'created_at' in item ? item.created_at : item.date;
            const itemDate = new Date(dateStr);
            return itemDate >= startDate;
        });

        // 3. Sort by Date Descending
        return data.sort((a, b) => {
            const dateA = new Date('created_at' in a ? a.created_at : a.date);
            const dateB = new Date('created_at' in b ? b.created_at : b.date);
            return dateB.getTime() - dateA.getTime();
        });

    }, [sales, expenses, purchases, filter, timeRange]);

    const renderItem = ({ item }: { item: any }) => {
        const isExpense = 'category' in item;
        const isPurchase = 'unit_cost' in item;

        if (isExpense) {
            return (
                <Card style={[styles.cardContent, { borderLeftWidth: 4, borderLeftColor: Colors.error }]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconBox, { backgroundColor: '#ffebee' }]}>
                            <Ionicons name="cash-outline" size={24} color={Colors.error} />
                        </View>
                    </View>
                    <View style={styles.info}>
                        <ThemedText type="defaultSemiBold">{item.category}</ThemedText>
                        <ThemedText type="caption">
                            {new Date(item.date).toLocaleDateString()} • {item.description || 'No notes'}
                        </ThemedText>
                    </View>
                    <View style={styles.amount}>
                        <ThemedText type="defaultSemiBold" style={{ color: Colors.error }}>
                            -₹{Number(item.amount).toFixed(2)}
                        </ThemedText>
                    </View>
                </Card>
            );
        }

        if (isPurchase) {
            return (
                <Card style={[styles.cardContent, { borderLeftWidth: 4, borderLeftColor: Colors.warning }]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                            <Ionicons name="cube-outline" size={24} color={Colors.warning} />
                        </View>
                    </View>
                    <View style={styles.info}>
                        <ThemedText type="defaultSemiBold">Stock Purchase</ThemedText>
                        <ThemedText type="caption">
                            {new Date(item.created_at).toLocaleDateString()} • {item.products?.name || 'Item'}
                        </ThemedText>
                    </View>
                    <View style={styles.amount}>
                        <ThemedText type="defaultSemiBold" style={{ color: Colors.error }}>
                            -₹{Number(item.total_cost).toFixed(2)}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: Colors.textSecondary }}>
                            {item.quantity} x ₹{item.unit_cost}
                        </ThemedText>
                    </View>
                </Card>
            );
        }

        // Transaction (Sale)
        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: item.id } })}
                activeOpacity={0.7}
            >
                <Card style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={item.status === 'quote' ? 'document-text-outline' : 'checkmark-circle'}
                            size={28}
                            color={getStatusColor(item.status || 'completed')}
                        />
                    </View>
                    <View style={styles.info}>
                        <ThemedText type="defaultSemiBold">
                            {item.status === 'quote' ? 'Quote' : 'Invoice'} #{item.id.slice(0, 4).toUpperCase()}
                        </ThemedText>
                        <ThemedText type="caption">
                            {new Date(item.created_at).toLocaleDateString()}
                        </ThemedText>
                    </View>
                    <View style={styles.amount}>
                        <Text style={styles.quantity}>
                            ₹{item.total_amount?.toFixed(2)}
                        </Text>
                        <ThemedText type="caption" style={{ color: getStatusColor(item.status || 'completed') }}>
                            {(item.status || 'completed').toUpperCase()}
                        </ThemedText>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Transactions</ThemedText>
            </View>

            {/* Time Range Pills */}
            <View style={styles.pillContainer}>
                {(['Day', 'Week', 'Month', 'Year'] as TimeRange[]).map((range) => (
                    <TouchableOpacity
                        key={range}
                        onPress={() => setTimeRange(range)}
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

            {/* Type Filter (Scrollable Pills) */}
            <View style={{ marginBottom: 16 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollFilterContent}
                >
                    {(Object.keys(FILTER_LABELS) as FilterType[]).map((key) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => setFilter(key)}
                            style={[styles.scrollPill, filter === key && styles.scrollPillActive]}
                        >
                            <ThemedText
                                type="defaultSemiBold"
                                style={[styles.filterText, filter === key && styles.filterTextActive]}
                            >
                                {FILTER_LABELS[key]}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            import LoadingState from '@/components/LoadingState';
            import EmptyState from '@/components/EmptyState';

            // ... inside component

            {loading ? (
                <LoadingState message="Fetching transactions..." />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={item => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <EmptyState
                            variant="transactions"
                            title="No transactions found"
                            description={`There are no ${filter === 'all' ? 'records' : filter} for this period.`}
                        />
                    }
                    renderItem={renderItem}
                />
            )}

            {filter === 'expenses' && (
                <FAB onPress={() => setExpenseModalVisible(true)} />
            )}

            <AddExpenseModal
                visible={expenseModalVisible}
                onClose={() => setExpenseModalVisible(false)}
                onSave={fetchTransactions}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 20,
        backgroundColor: Colors.background,
        paddingBottom: 10,
    },
    pillContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceSubtle,
        padding: 4,
        borderRadius: 40,
        marginHorizontal: 16,
        marginBottom: 12,
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
    scrollFilterContent: {
        paddingHorizontal: 16,
        gap: 8, // Space between scroll pills
    },
    scrollPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    scrollPillActive: {
        backgroundColor: Colors.white,
        borderColor: Colors.border,
        ...Colors.shadow,
        shadowOpacity: 0.05,
        elevation: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    list: {
        padding: 16,
        gap: 12,
        paddingTop: 0,
        paddingBottom: 20,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    iconContainer: {
        marginRight: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    amount: {
        alignItems: 'flex-end',
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text
    },
});
