import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: product.name,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.label}>Current Stock</Text>
                    <Text style={[styles.stockCount, { color: (product.current_stock || 0) > 0 ? Colors.primary : Colors.error }]}>
                        {product.current_stock || 0} {product.unit}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={styles.value}>${product.price ? product.price.toFixed(2) : '0.00'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{product.category || 'N/A'}</Text>
                </View>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    stockCount: {
        fontSize: 48,
        fontWeight: 'bold',
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    value: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    actions: {
        marginTop: 24,
    },
});
