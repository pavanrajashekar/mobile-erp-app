import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../services/productService';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from './Card';
import ThemedText from './ThemedText';

interface ProductListItemProps {
    product: Product;
}

export const ProductListItem = ({ product }: ProductListItemProps) => {
    return (
        <Link href={{ pathname: "/products/[id]", params: { id: product.id } }} asChild>
            <TouchableOpacity activeOpacity={0.7}>
                <Card style={styles.cardContent}>
                    <View style={styles.info}>
                        <ThemedText type="defaultSemiBold" style={styles.name}>{product.name}</ThemedText>
                        <ThemedText type="caption" style={styles.details}>
                            {product.category || 'Uncategorized'} •{' '}
                            <Text style={{ color: (product.current_stock || 0) > 0 ? Colors.textSecondary : Colors.error }}>
                                Stock: {product.current_stock || 0} {product.unit}
                            </Text>
                        </ThemedText>
                    </View>
                    <View style={styles.action}>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </View>
                </Card>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12, // Override default Card padding (16)
    },
    info: {
        flex: 1,
    },
    name: {
        marginBottom: 2,
    },
    details: {
        marginTop: 2,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
