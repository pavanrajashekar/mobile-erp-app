import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { useRouter, useFocusEffect } from 'expo-router';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import SlabMeasurementSheet from '@/components/SlabMeasurementSheet';
import Card from '@/components/Card';
import ProductSelectionModal from '@/components/ProductSelectionModal';
import ThemedText from '@/components/ThemedText';
import EmptyState from '@/components/EmptyState';
import { useShop } from '@/hooks/useShop';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function BillingScreen() {
    const { businessType, loading: shopLoading } = useShop();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProductModalVisible, setProductModalVisible] = useState(false);
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

    // Slab Measurement State
    const [slabSheetVisible, setSlabSheetVisible] = useState(false);
    const [currentSlabItem, setCurrentSlabItem] = useState<(CartItem & { name: string }) | null>(null);
    const [slabDetails, setSlabDetails] = useState<Record<string, string>>({});

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

    const updatePrice = (productId: string, newPrice: string) => {
        const parsedPrice = parseFloat(newPrice);
        if (isNaN(parsedPrice)) return;

        setCart(current => current.map(item => {
            if (item.product.id === productId) {
                return { ...item, price: parsedPrice };
            }
            return item;
        }));
    };

    const openSlabSheet = (item: CartItem) => {
        setCurrentSlabItem({ ...item, name: item.product.name });
        setSlabSheetVisible(true);
    };

    const handleSlabConfirm = (totalQty: number, details: string) => {
        if (currentSlabItem) {
            setCart(prev => prev.map(i =>
                i.product.id === currentSlabItem.product.id
                    ? { ...i, quantity: totalQty }
                    : i
            ));

            setSlabDetails(prev => ({
                ...prev,
                [currentSlabItem.product.id]: details
            }));
        }
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async (status: 'completed' | 'quote' = 'completed') => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await processSale(cart, totalAmount, 'cash', status);
            Alert.alert(
                'Success',
                status === 'quote' ? 'Quote saved successfully!' : 'Sale completed!',
                [{ text: 'OK', onPress: () => { setCart([]); setSlabDetails({}); } }]
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
                <ThemedText type="title">Billing</ThemedText>
                {businessType && <ThemedText type="caption" style={{ textTransform: 'capitalize' }}>{businessType} Mode</ThemedText>}
            </View>

            {/* Cart List */}
            <FlatList
                data={cart}
                keyExtractor={item => item.product.id}
                contentContainerStyle={styles.cartList}
                ListEmptyComponent={
                    <EmptyState
                        variant="cart"
                        onAction={() => setProductModalVisible(true)}
                        actionLabel="Add Products"
                        style={{ marginTop: 60 }}
                    />
                }
                renderItem={({ item }) => (
                    <Card style={styles.cartItemContent}>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold">{item.product.name}</ThemedText>
                            <View style={[styles.priceContainer, { backgroundColor: surfaceSubtle }]}>
                                <ThemedText style={[styles.currencySymbol, { color: textSecondary }]}>₹</ThemedText>
                                <TextInput
                                    style={[styles.priceInput, { color: text }]}
                                    value={item.price.toString()}
                                    onChangeText={(text) => updatePrice(item.product.id, text)}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                    placeholderTextColor={textSecondary}
                                />
                                <ThemedText style={[styles.unitText, { color: textSecondary }]}>x {item.quantity}</ThemedText>
                            </View>
                            {slabDetails[item.product.id] && (
                                <ThemedText type="caption" style={{ color: textSecondary, marginTop: 4 }}>
                                    {slabDetails[item.product.id]}
                                </ThemedText>
                            )}
                        </View>

                        <View style={[styles.quantityControls, { backgroundColor: surfaceSubtle }]}>
                            {businessType === 'stone' ? (
                                <TouchableOpacity
                                    style={[styles.measureBtn, { backgroundColor: primaryLight }]}
                                    onPress={() => openSlabSheet(item)}
                                >
                                    <Ionicons name="scan-outline" size={20} color={primary} />
                                    <View>
                                        <ThemedText style={[styles.measureText, { color: primary }]}>Measure</ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={[styles.qtyBtn, { backgroundColor: surface }]}>
                                        <Ionicons name="remove" size={20} color={primary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.qtyText, { color: text }]}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={[styles.qtyBtn, { backgroundColor: surface }]}>
                                        <Ionicons name="add" size={20} color={primary} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={[styles.removeBtn, { backgroundColor: error + '20' }]}>
                            <Ionicons name="trash-outline" size={20} color={error} />
                        </TouchableOpacity>
                    </Card>
                )}
            />

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

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: primary, shadowColor: primary }]}
                onPress={() => setProductModalVisible(true)}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Product Selection Modal (Reusable) */}
            <ProductSelectionModal
                visible={isProductModalVisible}
                onClose={() => setProductModalVisible(false)}
                onSelectProduct={addToCart}
            />

            {/* Stone Measurement Sheet */}
            <SlabMeasurementSheet
                visible={slabSheetVisible}
                onClose={() => setSlabSheetVisible(false)}
                onConfirm={handleSlabConfirm}
                initialQuantity={currentSlabItem?.quantity}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    headerLabel: {
        fontSize: 14,
    },
    footer: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingBottom: 24,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartList: {
        padding: 16,
        gap: 12,
        paddingBottom: 100,
    },
    cartItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    currencySymbol: {
        fontSize: 14,
        marginRight: 2,
    },
    priceInput: {
        fontSize: 14,
        fontWeight: '600',
        minWidth: 40,
        paddingVertical: 0,
    },
    unitText: {
        marginLeft: 8,
        fontSize: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        padding: 2,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        elevation: 2,
    },
    qtyText: {
        minWidth: 30,
        textAlign: 'center',
        fontWeight: '600',
    },
    removeBtn: {
        padding: 8,
        borderRadius: 12,
        marginLeft: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 120, // Adjusted for footer
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    measureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    measureText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
