import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { useRouter } from 'expo-router';

export default function BillingScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProductModalVisible, setProductModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(currentCart => {
            const existing = currentCart.find(item => item.product.id === product.id);
            if (existing) {
                return currentCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // Default price 0 if not set, user can edit? For now assume free or standard.
            // In a real app we'd fetch prices. For this MVP, we'll ask/assume.
            // Let's assume a default price of 100 for demo, or 0.
            return [...currentCart, { product, quantity: 1, price: 100 }];
        });
        setProductModalVisible(false);
    };

    const removeFromCart = (productId: string) => {
        setCart(current => current.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(current => current.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await processSale(cart, totalAmount);
            Alert.alert('Success', 'Sale completed!', [
                { text: 'OK', onPress: () => setCart([]) }
            ]);
        } catch (error: any) {
            Alert.alert('Checkout Failed', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header / Total */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.checkoutButton, cart.length === 0 && styles.disabledButton]}
                    onPress={handleCheckout}
                    disabled={cart.length === 0 || isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.checkoutText}>Checkout</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Cart List */}
            <FlatList
                data={cart}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cart-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>Cart is empty</Text>
                        <Text style={styles.emptySubtext}>Tap + to add products</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{item.product.name}</Text>
                            <Text style={styles.itemPrice}>${item.price} x {item.quantity}</Text>
                        </View>

                        <View style={styles.quantityControls}>
                            <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                                <Ionicons name="remove" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                                <Ionicons name="add" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* FAB to Add Product */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setProductModalVisible(true)}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Product Selection Modal */}
            <Modal
                visible={isProductModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Product</Text>
                        <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={products}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.productRow} onPress={() => addToCart(item)}>
                                <Text style={styles.productRowName}>{item.name}</Text>
                                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    checkoutButton: {
        backgroundColor: '#34C759',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
    checkoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cartList: {
        padding: 16,
        gap: 12,
    },
    cartItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemPrice: {
        color: '#666',
        marginTop: 4,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    qtyBtn: {
        padding: 8,
    },
    qtyText: {
        minWidth: 24,
        textAlign: 'center',
        fontWeight: '600',
    },
    removeBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#999',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        padding: 20,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeText: {
        color: '#007AFF',
        fontSize: 16,
    },
    productRow: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productRowName: {
        fontSize: 16,
    },
});
