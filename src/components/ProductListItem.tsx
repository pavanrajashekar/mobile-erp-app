import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../services/productService';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ProductListItemProps {
    product: Product;
}

export const ProductListItem = ({ product }: ProductListItemProps) => {
    return (
        <Link href={{ pathname: "/products/[id]", params: { id: product.id } }} asChild>
            <TouchableOpacity style={styles.container}>
                <View style={styles.info}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.details}>
                        {product.category || 'Uncategorized'} • {product.unit || 'Unit'}
                    </Text>
                    <Text style={[styles.details, { color: (product.current_stock || 0) > 0 ? Colors.textSecondary : Colors.error }]}>
                        Stock: {product.current_stock || 0}
                    </Text>
                </View>
                <View style={styles.action}>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </View>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
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
        color: Colors.text,
    },
    details: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
    },
});
