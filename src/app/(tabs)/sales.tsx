import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import { fetchExpenses, Expense } from '@/services/expenseService';
import { fetchPurchases, Purchase } from '@/services/purchaseService';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';

interface Transaction {
    id: string;
    product_id: string;
    quantity: number;
    movement_type: string;
    created_at: string;
    status: 'completed' | 'quote' | null;
    total_amount: number;
}

type FilterType = 'all' | 'completed' | 'quote' | 'expenses' | 'purchases';
type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';

const FILTERS: Record<FilterType, { label: string; icon: string }> = {
    all: { label: 'All', icon: 'grid-outline' },
    completed: { label: 'Invoices', icon: 'checkmark-circle-outline' },
    quote: { label: 'Quotes', icon: 'document-text-outline' },
    expenses: { label: 'Expenses', icon: 'cash-outline' },
    purchases: { label: 'Purchases', icon: 'cart-outline' }
};

export default function SalesScreen() {
    const [sales, setSales] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [filter, setFilter] = useState<FilterType>('all');
    const [timeRange, setTimeRange] = useState<TimeRange>('Month');
    const [showTimeFilter, setShowTimeFilter] = useState(false);



    const router = useRouter();

    const { theme } = useTheme();
    const activeColors = Colors[theme];

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

    const groupedData = useMemo(() => {
        let data: any[] = [];

        // 1. Filter by Type
        if (filter === 'expenses') data = expenses;
        else if (filter === 'purchases') data = purchases;
        else if (filter === 'completed') data = sales.filter(s => s.status === 'completed');
        else if (filter === 'quote') data = sales.filter(s => s.status === 'quote');
        else data = [...sales, ...expenses, ...purchases];

        // 2. Filter by Time Range
        const startDate = getStartDate(timeRange);
        data = data.filter(item => {
            const dateStr = 'created_at' in item ? item.created_at : item.date;
            const itemDate = new Date(dateStr);
            return itemDate >= startDate;
        });

        // 3. Sort by Date Descending
        data.sort((a, b) => {
            const dateA = new Date('created_at' in a ? a.created_at : a.date);
            const dateB = new Date('created_at' in b ? b.created_at : b.date);
            return dateB.getTime() - dateA.getTime();
        });

        // 4. Group by Date
        const groups: { title: string; data: any[] }[] = [];
        data.forEach(item => {
            const date = new Date('created_at' in item ? item.created_at : item.date);
            // Properly format date to be group specific
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });

            const today = new Date();
            const yesterday = new Date();
            yesterday.setHours(0, 0, 0, 0);
            yesterday.setDate(today.getDate() - 1);

            // Normalize date for comparison
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);

            let displayTitle = dateStr;
            if (checkDate.getTime() === new Date().setHours(0, 0, 0, 0)) displayTitle = 'Today';
            else if (checkDate.getTime() === yesterday.getTime()) displayTitle = 'Yesterday';

            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.title === displayTitle) {
                lastGroup.data.push(item);
            } else {
                groups.push({ title: displayTitle, data: [item] });
            }
        });

        return groups;

    }, [sales, expenses, purchases, filter, timeRange]);

    const renderTransactionItem = (item: any, index: number, total: number) => {
        const isExpense = 'category' in item;
        const isPurchase = 'unit_cost' in item;
        const isSale = !isExpense && !isPurchase;
        const isLast = index === total - 1;

        let iconName: any = 'document-text-outline';
        let iconColor = activeColors.primary;
        let iconBg = activeColors.primaryLight;
        let title = '';
        let subtitle = '';
        let amount = '';
        let amountColor = activeColors.text;

        const isQuote = isSale && item.status === 'quote';

        if (isExpense) {
            iconName = 'cash-outline';
            iconColor = '#EF4444'; // Red for Expense Icon
            iconBg = 'rgba(239, 68, 68, 0.15)';
            title = item.category;
            subtitle = item.description || 'Expense';
            amount = `-₹${Number(item.amount).toFixed(2)}`;
            amountColor = activeColors.text; // Black number
        } else if (isPurchase) {
            iconName = 'cube-outline';
            iconColor = '#F59E0B'; // Amber for Purchase Icon
            iconBg = 'rgba(245, 158, 11, 0.15)';
            title = 'Stock Purchase';
            subtitle = item.products?.name || 'Items';
            amount = `-₹${Number(item.total_cost).toFixed(2)}`;
            amountColor = activeColors.text; // Black number
        } else {
            // Sale
            if (isQuote) {
                iconName = 'document-text-outline';
                iconColor = '#6366F1'; // Indigo for Quote Icon
                iconBg = 'rgba(99, 102, 241, 0.15)';
                title = `Quote #${item.id.slice(0, 4).toUpperCase()}`;
                amount = `₹${item.total_amount?.toFixed(2)}`;
                amountColor = activeColors.text; // Black number
            } else {
                // Completed Sale: Green
                iconName = 'checkmark-circle-outline';
                iconColor = activeColors.success;
                iconBg = 'rgba(16, 185, 129, 0.1)';
                title = `Invoice #${item.id.slice(0, 4).toUpperCase()}`;
                amount = `+₹${item.total_amount?.toFixed(2)}`;
                amountColor = activeColors.success; // Green number
            }
            subtitle = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const Content = (
            <View style={[styles.itemContent, !isLast && { borderBottomWidth: 1, borderBottomColor: activeColors.border }]}>
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.info}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>{title}</ThemedText>
                    <ThemedText type="default" style={{ fontSize: 12, color: activeColors.textSecondary }}>{subtitle}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={{ color: amountColor, fontSize: 15 }}>
                    {amount}
                </ThemedText>
            </View>
        );

        if (isSale) {
            return (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: item.id } })}
                    activeOpacity={0.6}
                >
                    {Content}
                </TouchableOpacity>
            );
        }

        return <View key={item.id}>{Content}</View>;
    };

    const renderGroup = ({ item }: { item: { title: string, data: any[] } }) => {
        return (
            <View style={styles.groupContainer}>
                <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: activeColors.textSecondary }]}>
                    {item.title}
                </ThemedText>
                <Card style={styles.card} variant="flat">
                    {item.data.map((transaction, index) => renderTransactionItem(transaction, index, item.data.length))}
                </Card>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <ThemedText type="title">Transactions</ThemedText>
                    <ThemedText type="caption" style={{ color: activeColors.textSecondary, marginTop: 2 }}>{timeRange}</ThemedText>
                </View>
                <TouchableOpacity
                    onPress={() => setShowTimeFilter(true)}
                    style={[styles.filterBtn, { backgroundColor: activeColors.surface }]}
                >
                    <Ionicons name="filter" size={20} color={activeColors.primary} />
                </TouchableOpacity>
            </View>

            {/* Compact Filter Row */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                >
                    {(Object.entries(FILTERS) as [FilterType, { label: string, icon: string }][]).map(([key, { label, icon }]) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => setFilter(key)}
                            style={[
                                styles.pill,
                                filter === key ? { backgroundColor: activeColors.primary, borderColor: activeColors.primary } : { backgroundColor: activeColors.surface, borderColor: activeColors.border }
                            ]}
                        >
                            <Ionicons
                                name={icon as any}
                                size={16}
                                color={filter === key ? '#fff' : activeColors.textSecondary}
                                style={{ marginRight: 6 }}
                            />
                            <ThemedText
                                style={{
                                    color: filter === key ? '#fff' : activeColors.textSecondary,
                                    fontSize: 13,
                                    fontWeight: '600'
                                }}
                            >
                                {label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <LoadingState message="Loading activity..." />
            ) : (
                <FlatList
                    data={groupedData}
                    keyExtractor={(item) => item.title}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.list}
                    renderItem={renderGroup}
                    ListEmptyComponent={
                        <EmptyState
                            variant="transactions"
                            title="No transactions"
                            description={`No ${filter} found for this period.`}
                            style={{ marginTop: 40 }}
                        />
                    }
                />
            )}

            {/* Expense Modal removed - accessible via Global Action */}

            {/* Time Filter Modal */}
            <Modal
                transparent
                visible={showTimeFilter}
                animationType="fade"
                onRequestClose={() => setShowTimeFilter(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowTimeFilter(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
                                <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>Filter Period</ThemedText>
                                <View style={styles.timeGrid}>
                                    {(['Day', 'Week', 'Month', 'Year'] as TimeRange[]).map((range) => (
                                        <TouchableOpacity
                                            key={range}
                                            onPress={() => { setTimeRange(range); setShowTimeFilter(false); }}
                                            style={[
                                                styles.timeOption,
                                                { borderColor: activeColors.border },
                                                timeRange === range && { backgroundColor: activeColors.primary, borderColor: activeColors.primary }
                                            ]}
                                        >
                                            <ThemedText style={{ color: timeRange === range ? '#fff' : activeColors.text, fontWeight: '600' }}>
                                                {range}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterContainer: {
        height: 40,
        marginBottom: 8,
    },
    pill: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    list: {
        paddingBottom: 100,
    },
    groupContainer: {
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    groupTitle: {
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        padding: 0,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#ffffff', // Force white for contrast
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.6)', // Subtle border
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '80%',
        padding: 24,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    timeOption: {
        minWidth: '40%',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
    }
});
