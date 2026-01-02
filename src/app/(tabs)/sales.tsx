import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { FAB } from '@/components/FAB';
import { fetchExpenses, Expense } from '@/services/expenseService';
import AddExpenseModal from '@/components/AddExpenseModal';

interface Transaction {
    id: string;
    product_id: string;
    quantity: number;
    movement_type: string;
    created_at: string;
    status: 'completed' | 'quote' | null;
    total_amount: number;
}

export default function SalesScreen() {
    const [sales, setSales] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'completed' | 'quote' | 'expenses'>('all');
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const router = useRouter();

    const fetchTransactions = async () => {
        try {
            const [salesResponse, expensesData] = await Promise.all([
                supabase.from('sales').select('*').order('created_at', { ascending: false }),
                fetchExpenses()
            ]);

            if (salesResponse.error) throw salesResponse.error;
            setSales(salesResponse.data || []);
            setExpenses(expensesData || []);
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
            default: return Colors.text; // fallback
        }
    };

    const filteredData = useMemo(() => {
        let data: any[] = [];
        if (filter === 'expenses') {
            data = expenses;
        } else if (filter === 'completed') {
            data = sales.filter(s => s.status === 'completed');
        } else if (filter === 'quote') {
            data = sales.filter(s => s.status === 'quote');
        } else {
            // All: Merge and Sort by Date
            data = [...sales, ...expenses].sort((a, b) => {
                const dateA = new Date('created_at' in a ? a.created_at : a.date);
                const dateB = new Date('created_at' in b ? b.created_at : b.date);
                return dateB.getTime() - dateA.getTime();
            });
        }
        return data;
    }, [sales, expenses, filter]);

    const renderItem = ({ item }: { item: any }) => {
        const isExpense = 'category' in item;

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
                            -${Number(item.amount).toFixed(2)}
                        </ThemedText>
                    </View>
                </Card>
            );
        }

        // Transaction
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
                            ${item.total_amount?.toFixed(2)}
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

            <View style={styles.filterContainer}>
                <SegmentedControl
                    values={['All', 'Invoices', 'Quotes', 'Expenses']}
                    selectedIndex={['all', 'completed', 'quote', 'expenses'].indexOf(filter)}
                    onChange={(event) => {
                        setFilter(['all', 'completed', 'quote', 'expenses'][event.nativeEvent.selectedSegmentIndex] as any);
                    }}
                />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={item => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <ThemedText>No records found.</ThemedText>
                        </View>
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
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
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
