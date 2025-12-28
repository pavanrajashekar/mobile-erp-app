import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../services/productService';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ProductListItemProps {
    product: Product;
}

export const ProductListItem = ({ product }: ProductListItemProps) => {
    return (
        <Link href={{
            pathname: "/inventory/adjust",
            params: { productId: product.id, productName: product.name }
        }} asChild>
            <TouchableOpacity style={styles.container}>
                <View style={styles.info}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.details}>
                        {product.category || 'Uncategorized'} • {product.unit || 'Unit'}
                    </Text>
                </View>
                <View style={styles.action}>
                    <Text style={styles.actionText}>Add Stock</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    details: {
        fontSize: 14,
        color: '#666',
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
});
