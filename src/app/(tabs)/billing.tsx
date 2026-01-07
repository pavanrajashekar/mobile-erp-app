import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { getContacts, Contact } from '@/services/contactService';
import { useRouter, useFocusEffect } from 'expo-router';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import EmptyState from '@/components/EmptyState';
import { useShop } from '@/hooks/useShop';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function BillingScreen() {
    const [loading, setLoading] = useState(false);

    // Data State
    const [customers, setCustomers] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Search State
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');

    // Selection State
    const [selectedCustomer, setSelectedCustomer] = useState<Contact | null>(null);

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [contactsData, productsData] = await Promise.all([
                getContacts('customer'),
                fetchProducts()
            ]);
            setCustomers(contactsData);
            setProducts(productsData || []);
        } catch (e) {
            console.error('Error loading initial data:', e);
        }
    };

    const { loading: shopLoading } = useShop();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const text = useThemeColor({}, 'text');
    const border = useThemeColor({}, 'border');
    const primary = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const error = useThemeColor({}, 'error');
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');
    const white = useThemeColor({ light: '#fff' }, 'textInverse');

    // Slab Measurement State - Removed as per new requirement
    const [paymentMode, setPaymentMode] = useState<string>('cash');
    const [isQuote, setIsQuote] = useState(false);

    const router = useRouter();

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
        // Clear search is handled in visual component
    };

    const removeFromCart = (productId: string) => {
        setCart(current => current.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, newQty: string) => {
        if (newQty === '') {
            setCart(current => current.map(item =>
                item.product.id === productId ? { ...item, quantity: 0 } : item
            ));
            return;
        }
        const parsedQty = parseFloat(newQty);
        if (isNaN(parsedQty)) return;

        setCart(current => current.map(item => {
            if (item.product.id === productId) {
                return { ...item, quantity: parsedQty };
            }
            return item;
        }));
    };

    const updatePrice = (productId: string, newPrice: string) => {
        if (newPrice === '') {
            setCart(current => current.map(item =>
                item.product.id === productId ? { ...item, price: 0 } : item
            ));
            return;
        }
        const parsedPrice = parseFloat(newPrice);
        if (isNaN(parsedPrice)) return;

        setCart(current => current.map(item => {
            if (item.product.id === productId) {
                return { ...item, price: parsedPrice };
            }
            return item;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculateTotal = () => totalAmount;

    const handleCheckout = async (status: 'completed' | 'quote' = 'completed') => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await processSale(cart, calculateTotal(), {
                paymentMode: paymentMode,
                status: isQuote ? 'quote' : 'completed',
                contactId: selectedCustomer?.id,
                paymentStatus: paymentMode === 'credit' ? 'unpaid' : 'paid',
                paidAmount: paymentMode === 'credit' ? 0 : calculateTotal()
            });
            Alert.alert(
                'Success',
                status === 'quote' ? 'Quote saved successfully!' : 'Sale completed!',
                [{ text: 'OK', onPress: () => { setCart([]); } }]
            );
        } catch (error: any) {
            Alert.alert(status === 'quote' ? 'Quote Failed' : 'Checkout Failed', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { backgroundColor }]}>
                <ThemedText type="title">New Sale</ThemedText>
            </View>

            <View style={{ flex: 1, zIndex: 1 }}>

                {/* Customer Search Section */}
                <View style={{ marginHorizontal: 20, marginBottom: 12, zIndex: 3 }}>
                    <ThemedText style={styles.sectionLabel}>CUSTOMER</ThemedText>
                    <View>
                        {selectedCustomer ? (
                            <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.avatarSmall, { backgroundColor: primary, width: 44, height: 44, borderRadius: 22 }]}>
                                        <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                            {selectedCustomer.name.charAt(0).toUpperCase()}
                                        </ThemedText>
                                    </View>
                                    <View>
                                        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{selectedCustomer.name}</ThemedText>
                                        <ThemedText style={{ fontSize: 13, color: textSecondary }}>
                                            {selectedCustomer.phone || selectedCustomer.email || 'No contact info'}
                                        </ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={{ padding: 8 }}>
                                    <Ionicons name="close-circle" size={24} color={textSecondary} />
                                </TouchableOpacity>
                            </Card>
                        ) : (
                            <View style={[styles.searchContainer, { backgroundColor: surface, borderColor: border }]}>
                                <Ionicons name="search-outline" size={20} color={textSecondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={[styles.input, { color: text }]}
                                    placeholder="Search or Select Customer"
                                    placeholderTextColor={textSecondary}
                                    value={customerSearch}
                                    onChangeText={setCustomerSearch}
                                />
                            </View>
                        )}

                        {/* Customer Dropdown */}
                        {(customerSearch.length > 0 && !selectedCustomer) && (
                            <View style={[styles.dropdown, { backgroundColor: surface, borderColor: border }]}>
                                <FlatList
                                    data={customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))}
                                    keyExtractor={item => item.id}
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.dropdownItem, { borderBottomColor: border + '40' }]}
                                            onPress={() => {
                                                setSelectedCustomer(item);
                                                setCustomerSearch('');
                                            }}
                                        >
                                            <View style={[styles.avatarSmall, { backgroundColor: primary }]}>
                                                <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                                    {item.name.charAt(0).toUpperCase()}
                                                </ThemedText>
                                            </View>
                                            <View>
                                                <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{item.name}</ThemedText>
                                                <ThemedText style={{ fontSize: 12, color: textSecondary }}>{item.phone}</ThemedText>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <TouchableOpacity
                                            style={{ padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                            onPress={() => router.push('/contacts/create')}
                                        >
                                            <Ionicons name="add-circle" size={24} color={primary} style={{ marginRight: 8 }} />
                                            <ThemedText type="defaultSemiBold" style={{ color: primary }}>Create "{customerSearch}"</ThemedText>
                                        </TouchableOpacity>
                                    }
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Product Search Section */}
                <View style={{ marginHorizontal: 20, marginBottom: 20, zIndex: 2 }}>
                    <ThemedText style={styles.sectionLabel}>ADD ITEMS</ThemedText>
                    <View>
                        <View style={[styles.searchContainer, { backgroundColor: surface, borderColor: border }]}>
                            <Ionicons name="search-outline" size={20} color={textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.input, { color: text }]}
                                placeholder="Start typing product name..."
                                placeholderTextColor={textSecondary}
                                value={productSearch}
                                onChangeText={setProductSearch}
                            />
                            {productSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setProductSearch('')}>
                                    <Ionicons name="close-circle" size={20} color={textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Product Dropdown */}
                        {productSearch.length > 0 && (
                            <View style={[styles.dropdown, { backgroundColor: surface, borderColor: border, maxHeight: 250 }]}>
                                <FlatList
                                    data={products
                                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                        .slice(0, 10)
                                    }
                                    keyExtractor={item => item.id}
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.dropdownItem, { borderBottomColor: border + '40' }]}
                                            onPress={() => {
                                                addToCart(item);
                                                setProductSearch('');
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{item.name}</ThemedText>
                                                <ThemedText style={{ fontSize: 12, color: textSecondary }}>
                                                    Stock: {item.current_stock} • {item.unit || 'Units'}
                                                </ThemedText>
                                            </View>
                                            <ThemedText type="defaultSemiBold" style={{ color: primary, fontSize: 16 }}>₹{item.price}</ThemedText>
                                            <Ionicons name="add-circle-outline" size={24} color={primary} style={{ marginLeft: 12 }} />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={{ padding: 16, alignItems: 'center' }}>
                                            <ThemedText style={{ color: textSecondary }}>No products found</ThemedText>
                                        </View>
                                    }
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Cart List */}
                <FlatList
                    data={cart}
                    keyExtractor={item => item.product.id}
                    contentContainerStyle={styles.cartList}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <EmptyState
                            variant="cart"
                            title="Cart is empty"
                            description="Search for products above to add them."
                            style={{ marginTop: 40 }}
                        />
                    }
                    renderItem={({ item }) => (
                        <Card style={styles.cartCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <ThemedText type="defaultSemiBold" style={{ fontSize: 16, flex: 1 }}>{item.product.name}</ThemedText>
                                <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={{ padding: 4 }}>
                                    <Ionicons name="trash-outline" size={18} color={error} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    {/* Price Input */}
                                    <View style={[styles.equationInputContainer, { borderBottomColor: border }]}>
                                        <ThemedText style={{ fontSize: 16, fontWeight: '600', color: textSecondary }}>₹</ThemedText>
                                        <TextInput
                                            style={[styles.equationInput, { color: text }]}
                                            value={item.price.toString()}
                                            onChangeText={(text) => updatePrice(item.product.id, text)}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                        />
                                    </View>

                                    <ThemedText style={{ fontSize: 16, color: textSecondary }}>x</ThemedText>

                                    {/* Quantity Input */}
                                    <View style={[styles.equationInputContainer, { borderBottomColor: border }]}>
                                        <TextInput
                                            style={[styles.equationInput, { color: text, textAlign: 'center' }]}
                                            value={item.quantity.toString()}
                                            onChangeText={(text) => updateQuantity(item.product.id, text)}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                            placeholder="0"
                                        />
                                    </View>

                                    <ThemedText style={{ fontSize: 14, color: textSecondary }}>{item.product.unit || 'Units'}</ThemedText>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ThemedText style={{ fontSize: 16, color: textSecondary, marginRight: 8 }}>=</ThemedText>
                                    <ThemedText type="defaultSemiBold" style={{ fontSize: 20 }}>₹{(item.price * item.quantity).toFixed(0)}</ThemedText>
                                </View>
                            </View>
                        </Card>
                    )}
                />
            </View>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
                <View>
                    <ThemedText style={[styles.headerLabel, { color: textSecondary }]}>Total Amount</ThemedText>
                    <ThemedText style={[styles.totalAmount, { color: text }]}>₹{totalAmount.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.footerActions}>
                    <Button
                        title="Checkout"
                        onPress={() => handleCheckout('completed')}
                        loading={isProcessing}
                        disabled={cart.length === 0}
                        style={{ minWidth: 100, borderRadius: 20 }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52, // Standard touch target
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16, // Standard readable font size
    },
    dropdown: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: 'white', // Ensure opaque background
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
        overflow: 'hidden', // Contain content
    },
    dropdownItem: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        gap: 16,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartList: {
        padding: 16,
        gap: 16,
        paddingBottom: 120,
    },
    cartCard: {
        // Card component handles main styling
    },
    equationInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 2,
    },
    equationInput: {
        fontSize: 18,
        fontWeight: '600',
        padding: 0,
        minWidth: 40,
        textAlign: 'center',
    },
    footer: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        backgroundColor: 'white',
    },
    headerLabel: {
        fontSize: 12,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
