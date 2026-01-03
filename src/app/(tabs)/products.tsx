import { View, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchProducts, Product } from '@/services/productService';
import { ProductListItem } from '@/components/ProductListItem';
import { FAB } from '@/components/FAB';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Inventory</ThemedText>
                <TouchableOpacity onPress={() => router.push('/products/purchase')}>
                    <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>+ Add Stock</ThemedText>
                </TouchableOpacity>
            </View>

            {loading ? (
                <LoadingState message="Loading inventory..." />
            ) : (
                <FlatList
                    data={products}
                    renderItem={({ item }) => <ProductListItem product={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.list, products.length === 0 && { flex: 1 }]}
                    ListEmptyComponent={
                        <EmptyState
                            variant="products"
                            actionLabel="Add First Product"
                            onAction={() => router.push('/products/add')}
                        />
                    }
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <FAB onPress={() => router.push('/products/add')} />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingTop: 0,
        gap: 8, // Spacing between cards
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
