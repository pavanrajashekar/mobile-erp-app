import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Product, getProduct } from '@/services/productService';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.centered}>
                <Text>Product not found</Text>
            </View>
        );
    }

    const renderMovement = (item: any) => {
        const isPositive = item.quantity > 0;
        const color = isPositive ? Colors.success : Colors.error;
        const icon = isPositive ? 'arrow-down-circle' : 'arrow-up-circle'; // In vs Out
        const typeStr = item.type || 'unknown';
        const typeLabel = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);

        return (
            <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                    <Ionicons name={icon} size={24} color={color} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.historyType}>{typeLabel}</Text>
                        <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text style={[styles.historyQty, { color }]}>
                    {isPositive ? '+' : ''}{item.quantity}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Product Details', // Clean title
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.background },
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Main Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardRow}>
                        {/* Left: Image */}
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
                            <Text style={styles.imagePlaceholderText}>No Image</Text>
                        </View>

                        {/* Right: Details */}
                        <View style={styles.detailsColumn}>
                            <Text style={styles.productName}>{product.name}</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Stock:</Text>
                                <Text style={[styles.stockCount, { color: (product.current_stock || 0) > 0 ? Colors.primary : Colors.error }]}>
                                    {product.current_stock || 0} <Text style={styles.unit}>{product.unit}</Text>
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Price:</Text>
                                <Text style={styles.value}>${product.price ? product.price.toFixed(2) : '0.00'}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Category:</Text>
                                <Text style={styles.value}>{product.category || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

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
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.historyList}>
                    {product.stock_movements && product.stock_movements.length > 0 ? (
                        product.stock_movements.slice(0, 10).map(renderMovement)
                    ) : (
                        <Text style={styles.emptyHistory}>No recent transactions</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        backgroundColor: Colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    imagePlaceholderText: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
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
        color: Colors.text,
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
        color: Colors.textSecondary,
        width: 70, // Fixed width for alignment
    },
    stockCount: {
        fontSize: 16,
        fontWeight: '700',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
        opacity: 0.5,
    },
    value: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    actions: {
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    historyList: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
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
        borderBottomColor: Colors.border,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyType: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    historyQty: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyHistory: {
        textAlign: 'center',
        color: Colors.textSecondary,
        padding: 32,
        fontStyle: 'italic',
    },
});
