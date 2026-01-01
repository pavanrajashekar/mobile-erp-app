import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        salesToday: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            // 1. Total Products
            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // 2. Low Stock (Client side filtering for MVP as simple 'quantity' on products table might not exist if using movement sum)
            // Wait, we need to know how we track quantity. 
            // Currently quantity is dynamic SUM of stock_movements.
            // For MVP dashboard, querying ALL products and summing movements is heavy.
            // Let's rely on a simpler metric or just fetch products.
            // Actually, we can fetch all products and their stock_movements to calc locally for now (small scale).

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

            // 3. Sales Today
            const today = new Date().toISOString().split('T')[0];
            const { data: sales } = await supabase
                .from('sales')
                .select('total_amount')
                .gte('created_at', today);

            const salesTotal = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

            setStats({
                totalProducts: productCount || 0,
                lowStock: lowStockCount,
                salesToday: salesTotal,
            });

        } catch (error) {
            console.error('Dashboard Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

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
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <ThemedText type="title">Dashboard</ThemedText>
                <ThemedText type="caption">Overview of your shop</ThemedText>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
                            <Ionicons name="cube-outline" size={24} color="#1e88e5" />
                        </View>
                        <ThemedText type="title" style={styles.statValue}>{stats.totalProducts}</ThemedText>
                        <ThemedText type="caption">Total Products</ThemedText>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#ffebee' }]}>
                            <Ionicons name="alert-circle-outline" size={24} color="#e53935" />
                        </View>
                        <ThemedText type="title" style={styles.statValue}>{stats.lowStock}</ThemedText>
                        <ThemedText type="caption">Low Stock</ThemedText>
                    </Card>

                    <Card style={[styles.statCard, styles.fullWidth]}>
                        <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="cash-outline" size={24} color="#43a047" />
                        </View>
                        <ThemedText type="title" style={styles.statValue}>${stats.salesToday.toFixed(2)}</ThemedText>
                        <ThemedText type="caption">Sales Today</ThemedText>
                    </Card>
                </View>
            )}

            <View style={styles.section}>
                <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Quick Actions</ThemedText>
                <View style={styles.actions}>
                    {/* Placeholder for future quick actions if needed, for now just static info */}
                    <Card style={{ padding: 20 }}>
                        <ThemedText>Welcome to Mobile ERP! Use the tabs below to manage your inventory and sales.</ThemedText>
                    </Card>
                </View>
            </View>
        </ScrollView>
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
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statCard: {
        flex: 1,
        minWidth: '45%', // 2 columns
        alignItems: 'center',
        paddingVertical: 24,
    },
    fullWidth: {
        minWidth: '100%',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        marginBottom: 4,
    },
    section: {
        marginTop: 32,
    },
    actions: {
        marginTop: 8,
    },
});
