import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Product, getProduct } from '@/services/productService';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { theme } = useTheme();
    const activeColors = Colors[theme];

    const loadProduct = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await getProduct(id);
            setProduct(data);
        } catch (error) {
            console.error('Error fetching product:', error);
            Alert.alert('Error', 'Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProduct();
        }, [id])
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={activeColors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.centered, { backgroundColor: activeColors.background }]}>
                <ThemedText>Product not found</ThemedText>
            </View>
        );
    }

    const renderMovement = (item: any) => {
        const isPositive = item.quantity > 0;

        // Icon Logic: In (Positive) = Stock In (Amber), Out (Negative) = Sale (Green)
        // Note: Usually In = Purchase, Out = Sale. 
        // Wait, 'isPositive' usually means Stock Added (In). 
        // Logic check: Purchases ADD stock. Sales REMOVE stock.
        // So:
        // Quantity > 0 (Stock In) -> Amber Icon (Purchase)
        // Quantity < 0 (Stock Out) -> Green Icon (Sale)

        const isStockIn = item.quantity > 0;

        const iconColor = isStockIn ? '#F59E0B' : activeColors.success; // Amber for In, Green for Out (Sale)
        const icon = isStockIn ? 'arrow-down-circle' : 'arrow-up-circle';

        const typeStr = item.type || 'unknown';
        const typeLabel = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);

        // Quantity Color: Green for + (Asset growth?), Black for - (Sale/Out?)
        // Wait, app-wide logic:
        // Cash Flow: Income (Sale) is Green. Expense is Black.
        // Inventory Flow: Stock In is Cost (Black?). Stock Out is Sale (Green?).
        // Let's align with Sales Screen:
        // Sales (Money In, Stock Out) -> Green Text.
        // Purchases (Money Out, Stock In) -> Black Text.

        // This list shows STOCK movement.
        // Sale -> -1 qty. App displays this as Sale.
        // Purchase -> +10 qty. App displays this as Purchase.

        // If item.quantity < 0 (Sale) -> Green Text (Revenue event).
        // If item.quantity > 0 (Purchase/Return) -> Black Text (Cost event).

        const qtyColor = !isStockIn ? activeColors.success : activeColors.text;
        const qtyPrefix = isStockIn ? '+' : ''; // Explicitly show + for stock in

        return (
            <View key={item.id} style={[styles.historyItem, { borderBottomColor: activeColors.border }]}>
                <View style={styles.historyLeft}>
                    <Ionicons name={icon} size={24} color={iconColor} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.historyType, { color: activeColors.text }]}>{typeLabel}</Text>
                        <Text style={[styles.historyDate, { color: activeColors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text style={[styles.historyQty, { color: qtyColor }]}>
                    {qtyPrefix}{item.quantity}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Product Details', // Clean title
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={activeColors.text} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: activeColors.background },
                    headerTitleStyle: { color: activeColors.text },
                    headerTintColor: activeColors.text, // ensure back arrow matches
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Main Details Card */}
                <View style={[styles.card, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]}>
                    <View style={styles.cardRow}>
                        {/* Left: Image */}
                        <View style={[styles.imagePlaceholder, { backgroundColor: activeColors.surfaceSubtle, borderColor: activeColors.border }]}>
                            <Ionicons name="image-outline" size={40} color={activeColors.textSecondary} />
                            <Text style={[styles.imagePlaceholderText, { color: activeColors.textSecondary }]}>No Image</Text>
                        </View>

                        {/* Right: Details */}
                        <View style={styles.detailsColumn}>
                            <Text style={[styles.productName, { color: activeColors.text }]}>{product.name}</Text>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: activeColors.textSecondary }]}>Stock:</Text>
                                <Text style={[styles.stockCount, { color: (product.current_stock || 0) > 0 ? activeColors.primary : activeColors.error }]}>
                                    {product.current_stock || 0} <Text style={[styles.unit, { color: activeColors.textSecondary }]}>{product.unit}</Text>
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: activeColors.textSecondary }]}>Price:</Text>
                                <Text style={[styles.value, { color: activeColors.text }]}>₹{product.price ? product.price.toFixed(2) : '0.00'}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: activeColors.textSecondary }]}>Category:</Text>
                                <Text style={[styles.value, { color: activeColors.text }]}>{product.category || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

                    <View style={styles.actions}>
                        <Button
                            title="Adjust Stock"
                            onPress={() => router.push({
                                pathname: "/inventory/adjust",
                                params: { productId: product.id, productName: product.name }
                            })}
                        />
                    </View>
                </View>

                {/* Recent Transactions Section */}
                <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Recent Transactions</Text>
                <View style={[styles.historyList, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]}>
                    {product.stock_movements && product.stock_movements.length > 0 ? (
                        product.stock_movements.slice(0, 10).map(renderMovement)
                    ) : (
                        <Text style={[styles.emptyHistory, { color: activeColors.textSecondary }]}>No recent transactions</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    imagePlaceholderText: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    detailsColumn: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center'
    },
    productName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 14,
        width: 70, // Fixed width for alignment
    },
    stockCount: {
        fontSize: 16,
        fontWeight: '700',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginBottom: 16,
        opacity: 0.5,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        marginLeft: 4,
    },
    historyList: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyType: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
    },
    historyQty: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyHistory: {
        textAlign: 'center',
        padding: 32,
        fontStyle: 'italic',
    },
});
