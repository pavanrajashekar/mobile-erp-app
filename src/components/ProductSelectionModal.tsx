import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { fetchProducts, Product } from '@/services/productService';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ProductSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectProduct: (product: Product) => void;
}

export default function ProductSelectionModal({ visible, onClose, onSelectProduct }: ProductSelectionModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Theme Colors
    const background = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const text = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');

    useEffect(() => {
        if (visible) {
            loadProducts();
            setSearchQuery('');
        }
    }, [visible]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await fetchProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.modalContainer, { backgroundColor: background }]}>
                <View style={[styles.modalHeader, { backgroundColor: surface, borderBottomColor: border }]}>
                    <Text style={[styles.modalTitle, { color: text }]}>Select Product</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.closeText, { color: primary }]}>Close</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: surface, borderBottomColor: border }]}>
                    <Ionicons name="search" size={20} color={textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: text }]}
                        placeholder="Search products..."
                        placeholderTextColor={textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={false}
                    />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color={primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={
                            <View style={styles.centered}>
                                <Text style={{ color: textSecondary }}>
                                    {products.length === 0 ? "No products found." : "No matching products."}
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.productRow, { backgroundColor: surface, borderBottomColor: border }]} onPress={() => onSelectProduct(item)}>
                                <View>
                                    <Text style={[styles.productRowName, { color: text }]}>{item.name}</Text>
                                    <Text style={{ fontSize: 12, color: textSecondary }}>
                                        {item.price ? `₹${item.price}` : 'No Price'} • {item.unit || 'Unit'} • Stock: {item.current_stock || 0}
                                    </Text>
                                </View>
                                <Ionicons name="add-circle-outline" size={24} color={primary} />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: 40,
    },
    productRow: {
        padding: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productRowName: {
        fontSize: 16,
        marginBottom: 4,
    },
    centered: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
