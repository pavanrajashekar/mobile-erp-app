import { View, FlatList, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchProducts, Product } from '@/services/productService';
import { ProductListItem } from '@/components/ProductListItem';
import { FAB } from '@/components/FAB';

export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadProducts = async () => {
        try {
            const data = await fetchProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to load products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={({ item }) => <ProductListItem product={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={products.length === 0 && styles.centered}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No products found. Add your first one!</Text>
                    }
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <FAB onPress={() => router.push('/products/add')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
