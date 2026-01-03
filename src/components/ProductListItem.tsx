import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../services/productService';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import ThemedText from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useShop } from '../hooks/useShop';
import { useTheme } from '@/context/ThemeContext';

interface ProductListItemProps {
    product: Product;
}

export const ProductListItem = ({ product }: ProductListItemProps) => {
    const { businessType } = useShop();
    const primary = useThemeColor({}, 'primary');
    const success = useThemeColor({}, 'success');
    const error = useThemeColor({}, 'error');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');

    // Profit margin calc
    const profitMargin = (product.price && product.cost_price)
        ? ((product.price - product.cost_price) / product.price) * 100
        : 0;
    const isHighMargin = profitMargin > 20;

    return (
        <Link href={{ pathname: "/products/[id]", params: { id: product.id } }} asChild>
            <TouchableOpacity activeOpacity={0.7}>
                <Card style={styles.cardContent}>
                    <View style={styles.info}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <ThemedText type="defaultSemiBold" style={styles.name}>{product.name}</ThemedText>

                                {businessType === 'wine' && product.category && (
                                    <ThemedText type="caption" style={{ color: primary, marginBottom: 2 }}>
                                        🍷 {product.category}
                                    </ThemedText>
                                )}

                                <ThemedText type="caption" style={styles.details}>
                                    {businessType === 'stone' ? 'Slabs' : 'Stock'}: {product.current_stock || 0} {product.unit}
                                </ThemedText>
                            </View>

                            {(product.price && product.cost_price) ? (
                                <View style={[
                                    styles.badge,
                                    {
                                        backgroundColor: isHighMargin
                                            ? 'rgba(58, 197, 98, 0.1)'
                                            : 'rgba(239, 68, 68, 0.1)'
                                    }
                                ]}>
                                    <ThemedText style={{
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        color: isHighMargin ? success : error
                                    }}>
                                        {profitMargin.toFixed(0)}%
                                    </ThemedText>
                                </View>
                            ) : null}
                        </View>
                    </View>
                    <View style={styles.action}>
                        <Ionicons name="chevron-forward" size={16} color={textSecondary} />
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
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
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
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    }
});
