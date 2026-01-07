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
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMeasurementsBySaleId, MeasurementSheet } from '@/services/measurementService';
import { useRouter } from 'expo-router';

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [sale, setSale] = useState<any>(null);
    const [measurementSheets, setMeasurementSheets] = useState<MeasurementSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());

    const toggleSheet = (sheetId: string) => {
        const newSet = new Set(expandedSheets);
        if (newSet.has(sheetId)) {
            newSet.delete(sheetId);
        } else {
            newSet.add(sheetId);
        }
        setExpandedSheets(newSet);
    };

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const success = useThemeColor({}, 'success');
    const warning = useThemeColor({}, 'warning');
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');

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

            // 4. Fetch Linked Measurements
            const sheets = await getMeasurementsBySaleId(id as string);
            setMeasurementSheets(sheets || []);

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
                <ActivityIndicator size="large" color={primary} />
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
    const statusColor = isQuote ? warning : success;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
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

                    <View style={[styles.divider, { backgroundColor: border }]} />

                    <View style={styles.totalSection}>
                        <ThemedText style={{ color: textSecondary }}>Total Amount</ThemedText>
                        <ThemedText type="title">₹{sale.total_amount?.toFixed(2)}</ThemedText>
                    </View>
                </Card>

                {/* Items List */}
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Items</ThemedText>
                <View style={[styles.itemsContainer, { backgroundColor: surface }]}>
                    {sale.sale_items?.map((item: any) => (
                        <View key={item.id} style={[styles.itemRow, { borderBottomColor: border }]}>
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



                {/* Measurement Sheets Section */}
                <View style={{ marginTop: 24, marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <ThemedText type="defaultSemiBold" style={{ marginLeft: 4 }}>Measurement Sheets</ThemedText>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/measurements/create', params: { saleId: id, customerName: sale.customer_name || 'Cash Customer' } })}
                        >
                            <ThemedText style={{ color: primary, fontWeight: '600' }}>+ Add Sheet</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {measurementSheets.length === 0 ? (
                        <View style={[styles.emptyBox, { backgroundColor: surface, borderColor: border }]}>
                            <ThemedText style={{ color: textSecondary, fontSize: 12 }}>No measurement sheets linked</ThemedText>
                        </View>
                    ) : (
                        <View style={[styles.itemsContainer, { backgroundColor: surface }]}>
                            {measurementSheets.map((sheet, index) => {
                                const isExpanded = expandedSheets.has(sheet.id);
                                return (
                                    <View key={sheet.id} style={{ borderBottomColor: border, borderBottomWidth: index === measurementSheets.length - 1 ? 0 : 1 }}>
                                        <TouchableOpacity
                                            style={styles.itemRow}
                                            onPress={() => toggleSheet(sheet.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View>
                                                <ThemedText type="defaultSemiBold">Sheet #{sheet.id.slice(0, 4).toUpperCase()}</ThemedText>
                                                <ThemedText type="caption">{new Date(sheet.created_at || '').toLocaleDateString()} • {sheet.status}</ThemedText>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                                                <ThemedText type="defaultSemiBold">{sheet.total_area?.toFixed(2) || 0} sq.ft</ThemedText>
                                                <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={16} color={textSecondary} />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Detailed Items List */}
                                        {isExpanded && sheet.items && sheet.items.length > 0 && (
                                            <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: surfaceSubtle }}>
                                                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 4, marginBottom: 4 }}>
                                                    <ThemedText type="caption" style={{ flex: 1 }}>Length</ThemedText>
                                                    <ThemedText type="caption" style={{ flex: 1 }}>Width</ThemedText>
                                                    <ThemedText type="caption" style={{ flex: 1 }}>Count</ThemedText>
                                                    <ThemedText type="caption" style={{ flex: 1, textAlign: 'right' }}>Area</ThemedText>
                                                </View>
                                                {sheet.items.map((item, idx) => (
                                                    <View key={idx} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                                                        <ThemedText style={{ flex: 1, fontSize: 12 }}>{item.length}</ThemedText>
                                                        <ThemedText style={{ flex: 1, fontSize: 12 }}>{item.width}</ThemedText>
                                                        <ThemedText style={{ flex: 1, fontSize: 12 }}>{item.quantity}</ThemedText>
                                                        <ThemedText style={{ flex: 1, fontSize: 12, textAlign: 'right' }}>{item.area.toFixed(2)}</ThemedText>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Footer Action */}
            <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
                <Button
                    title={sharing ? "Generating PDF..." : "Share PDF"}
                    onPress={handleSharePDF}
                    loading={sharing}
                    icon={<Ionicons name="share-outline" size={20} color="white" />}
                    style={{ borderRadius: 12 }}
                />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        paddingBottom: 30,
    },
    emptyBox: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    }
});
