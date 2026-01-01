import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
    id: string;
    product_id: string;
    quantity: number;
    movement_type: string;
    created_at: string;
    product: {
        name: string;
    };
}

export default function SalesScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('stock_movements')
                .select('*, product:products(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'purchase': return 'arrow-down-circle';
            case 'return': return 'arrow-down-circle';
            case 'sale': return 'arrow-up-circle';
            case 'damage': return 'alert-circle';
            default: return 'swap-horizontal';
        }
    };

    const getColorForType = (type: string) => {
        switch (type) {
            case 'purchase': return '#34C759'; // Green
            case 'return': return '#34C759';
            case 'sale': return '#007AFF'; // Blue
            case 'damage': return '#FF3B30'; // Red
            default: return '#666';
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>No transactions found.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={getIconForType(item.movement_type) as any}
                                    size={24}
                                    color={getColorForType(item.movement_type)}
                                />
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.productName}>{item.product?.name || 'Unknown Product'}</Text>
                                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                            </View>
                            <View style={styles.amount}>
                                <Text style={[
                                    styles.quantity,
                                    { color: item.quantity > 0 ? '#34C759' : '#333' }
                                ]}>
                                    {item.quantity > 0 ? '+' : ''}{item.quantity}
                                </Text>
                                <Text style={styles.type}>
                                    {item.movement_type.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    card: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconContainer: {
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    amount: {
        alignItems: 'flex-end',
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    type: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
