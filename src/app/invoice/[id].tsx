import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { createAndSharePDF } from '@/services/InvoiceGenerator';
import { getShopDetails } from '@/services/shopService';

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        if (id) fetchSaleDetails();
    }, [id]);

    const fetchSaleDetails = async () => {
        try {
            // 1. Fetch Sale
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .select('*')
                .eq('id', id)
                .single();

            if (saleError) throw saleError;

            // 2. Fetch Items (No Joins to avoid 400)
            const { data: itemsData, error: itemsError } = await supabase
                .from('sale_items')
                .select('*')
                .eq('sale_id', id);

            if (itemsError) throw itemsError;

            if (itemsData && itemsData.length > 0) {
                // 3. Fetch Products Manually
                const productIds = itemsData
                    .map(item => item.product_id)
                    .filter(id => id && id.length > 0); // Filter out empty IDs

                let productsMap: any = {};

                if (productIds.length > 0) {
                    const { data: productsData, error: productsError } = await supabase
                        .from('products')
                        .select('*') // Select ALL to avoid "column does not exist" 400 errors
                        .in('id', productIds);

                    if (productsError) throw productsError;

                    productsMap = (productsData || []).reduce((acc: any, product: any) => {
                        acc[product.id] = product;
                        return acc;
                    }, {});
                }

                const mergedItems = itemsData.map(item => ({
                    ...item,
                    products: productsMap[item.product_id] // Access safely
                }));

                setSale({ ...saleData, sale_items: mergedItems });
            } else {
                setSale({ ...saleData, sale_items: [] });
            }

        } catch (error) {
            console.error('Error fetching sale details:', error);
            Alert.alert('Error', 'Could not load transaction details');
        } finally {
            setLoading(false);
        }
    };

    const handleSharePDF = async () => {
        if (!sale) return;
        setSharing(true);
        try {
            const shop = await getShopDetails(sale.shop_id);
            const invoiceData = {
                shopName: shop?.name || 'Shop',
                shopAddress: shop?.address || '',
                customerName: 'Cash Customer', // Placeholder
                invoiceNumber: sale.id.slice(0, 8).toUpperCase(),
                date: new Date(sale.created_at).toLocaleDateString(),
                type: sale.status === 'quote' ? 'Quote' : 'Invoice',
                items: sale.sale_items.map((item: any) => ({
                    description: item.products?.name,
                    quantity: item.quantity,
                    unit: item.products?.unit,
                    price: item.price_at_sale,
                    total: item.quantity * item.price_at_sale
                })),
                totalAmount: sale.total_amount
            };

            await createAndSharePDF(invoiceData as any);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to generate PDF');
        } finally {
            setSharing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!sale) {
        return (
            <View style={styles.centered}>
                <ThemedText>Transaction not found.</ThemedText>
            </View>
        );
    }

    const isQuote = sale.status === 'quote';
    const statusColor = isQuote ? Colors.warning : Colors.success;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: isQuote ? 'Quote Details' : 'Invoice Details' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header Card */}
                <Card style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <View>
                            <ThemedText type="subtitle">
                                {isQuote ? 'Quote' : 'Invoice'} #{sale.id.slice(0, 6).toUpperCase()}
                            </ThemedText>
                            <ThemedText type="caption">
                                {new Date(sale.created_at).toLocaleString()}
                            </ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>
                                {sale.status?.toUpperCase() || 'COMPLETED'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalSection}>
                        <ThemedText style={{ color: Colors.textSecondary }}>Total Amount</ThemedText>
                        <ThemedText type="title">₹{sale.total_amount?.toFixed(2)}</ThemedText>
                    </View>
                </Card>

                {/* Items List */}
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Items</ThemedText>
                <View style={styles.itemsContainer}>
                    {sale.sale_items?.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="defaultSemiBold">{item.products?.name}</ThemedText>
                                <ThemedText type="caption">
                                    {item.quantity} {item.products?.unit} x ₹{item.price_at_sale}
                                </ThemedText>
                            </View>
                            <ThemedText type="defaultSemiBold">
                                ₹{(item.quantity * item.price_at_sale).toFixed(2)}
                            </ThemedText>
                        </View>
                    ))}
                </View>

            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
                <Button
                    title={sharing ? "Generating PDF..." : "Share PDF"}
                    onPress={handleSharePDF}
                    loading={sharing}
                    icon={<Ionicons name="share-outline" size={20} color="white" />}
                    style={{ borderRadius: 12 }}
                />
            </View>
        </SafeAreaView>
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
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    headerCard: {
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 16,
    },
    totalSection: {
        alignItems: 'flex-end',
    },
    sectionTitle: {
        marginBottom: 12,
        marginLeft: 4,
    },
    itemsContainer: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 30,
    }
});
