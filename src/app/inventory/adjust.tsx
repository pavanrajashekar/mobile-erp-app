import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { addStockMovement, MovementType } from '@/services/inventoryService';
import { fetchProducts, Product } from '@/services/productService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function AdjustStockScreen() {
    const params = useLocalSearchParams<{ productId: string, productName: string }>();
    const [selectedProduct, setSelectedProduct] = useState<{ id: string, name: string } | null>(
        params.productId ? { id: params.productId, name: params.productName || 'Product' } : null
    );
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState<MovementType>('purchase');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product Selection State
    const [isModalVisible, setModalVisible] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const router = useRouter();

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleSelectProduct = () => {
        if (!selectedProduct && products.length === 0) {
            loadProducts();
        }
        setModalVisible(true);
    };

    const onProductSelect = (product: Product) => {
        setSelectedProduct({ id: product.id, name: product.name });
        setModalVisible(false);
    };

    const handleSubmit = async () => {
        if (!selectedProduct) {
            Alert.alert('Error', 'Please select a product');
            return;
        }

        if (!quantity || isNaN(Number(quantity))) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalQty = Number(quantity);
            if (type === 'damage' || type === 'sale') {
                finalQty = -Math.abs(finalQty);
            }

            await addStockMovement(selectedProduct.id, finalQty, type);
            Alert.alert('Success', 'Stock updated');
            router.back();
        } catch (error: any) {
            console.error('Stock Update Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: selectedProduct ? `Stock: ${selectedProduct.name}` : 'Adjust Stock' }} />

            <View style={styles.form}>

                {/* Product Selector */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Product</Text>
                    <TouchableOpacity style={styles.selectButton} onPress={handleSelectProduct}>
                        <Text style={styles.selectButtonText}>
                            {selectedProduct ? selectedProduct.name : 'Select a Product'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {selectedProduct && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Movement Type</Text>
                            <View style={styles.typeContainer}>
                                {(['purchase', 'sale', 'damage', 'adjustment'] as const).map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeButton, type === t && styles.typeButtonActive]}
                                        onPress={() => setType(t)}
                                    >
                                        <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Input
                            label={`Quantity ${type === 'damage' ? '(will subtract)' : '(will add)'}`}
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        <Button
                            title="Update Stock"
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            style={styles.marginTop}
                        />
                    </>
                )}
            </View>

            {/* Product Selection Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Product</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingProducts ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={products}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.productRow} onPress={() => onProductSelect(item)}>
                                    <Text style={styles.productRowName}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 20,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 12,
        backgroundColor: Colors.inputBackground,
    },
    selectButtonText: {
        fontSize: 16,
        color: Colors.text,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow wrapping for small screens
        gap: 10,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeText: {
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    typeTextActive: {
        color: Colors.white,
    },
    marginTop: {
        marginTop: 20,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        padding: 20,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeText: {
        color: Colors.primary,
        fontSize: 16,
    },
    productRow: {
        padding: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productRowName: {
        fontSize: 16,
        color: Colors.text,
    },
});
