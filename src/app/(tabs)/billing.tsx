import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';

export default function BillingScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProductModalVisible, setProductModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
            return [...currentCart, { product, quantity: 1, price: product.price || 0 }];
        });
        setProductModalVisible(false);
        setSearchQuery(''); // Reset search
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

    const updatePrice = (productId: string, newPrice: string) => {
        const parsedPrice = parseFloat(newPrice);
        if (isNaN(parsedPrice)) return; // Or handle empty state better

        setCart(current => current.map(item => {
            if (item.product.id === productId) {
                return { ...item, price: parsedPrice };
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            {/* Cart List */}
            <FlatList
                data={cart}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cart-outline" size={48} color={Colors.disabled} />
                        <Text style={styles.emptyText}>Cart is empty</Text>
                        <Text style={styles.emptySubtext}>Tap + to add products</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{item.product.name}</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    value={item.price.toString()}
                                    onChangeText={(text) => updatePrice(item.product.id, text)}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                />
                                <Text style={styles.unitText}>x {item.quantity}</Text>
                            </View>
                        </View>

                        <View style={styles.quantityControls}>
                            <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                                <Ionicons name="remove" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                                <Ionicons name="add" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Footer / Total (Moved to Bottom) */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.headerLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
                </View>
                <Button
                    title="Checkout"
                    onPress={handleCheckout}
                    loading={isProcessing}
                    disabled={cart.length === 0}
                    style={{ minWidth: 120, borderRadius: 20 }}
                />
            </View>

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

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                    </View>

                    <FlatList
                        data={filteredProducts}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: Colors.textSecondary }}>
                                    {products.length === 0 ? "No products found. Add some first!" : "No matching products."}
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.productRow} onPress={() => addToCart(item)}>
                                <View>
                                    <Text style={styles.productRowName}>{item.name}</Text>
                                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                                        {item.price ? `$${item.price}` : 'No Price'} • {item.unit || 'Unit'}
                                    </Text>
                                </View>
                                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
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
        backgroundColor: Colors.background,
    },
    headerLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    footer: {
        backgroundColor: Colors.white,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 24, // Safety padding for older iPhones
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    cartList: {
        padding: 16,
        gap: 12,
        paddingBottom: 100, // To avoid overlap with FAB
    },
    cartItem: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    currencySymbol: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginRight: 2,
    },
    priceInput: {
        fontSize: 14,
        color: Colors.text,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        minWidth: 40,
        paddingVertical: 0,
    },
    unitText: {
        marginLeft: 8,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
        borderRadius: 8,
    },
    qtyBtn: {
        padding: 8,
    },
    qtyText: {
        minWidth: 24,
        textAlign: 'center',
        fontWeight: '600',
        color: Colors.text,
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
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        color: Colors.textSecondary,
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 110, // Moved up to be above the footer
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        height: 40,
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
