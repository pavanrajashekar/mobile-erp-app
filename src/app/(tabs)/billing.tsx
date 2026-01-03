import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { useRouter, useFocusEffect } from 'expo-router';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { getCurrentShopId } from '@/services/shopService';
import { supabase } from '@/services/supabase';
import SlabMeasurementModal from '@/components/SlabMeasurementModal';
import Card from '@/components/Card';
import ProductSelectionModal from '@/components/ProductSelectionModal';
import ThemedText from '@/components/ThemedText';
// Import New Components
import EmptyState from '@/components/EmptyState';

export default function BillingScreen() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isProductModalVisible, setProductModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [shopType, setShopType] = useState<string>('');

    // Slab Measurement State
    const [slabModalVisible, setSlabModalVisible] = useState(false);
    const [currentSlabItem, setCurrentSlabItem] = useState<(CartItem & { name: string }) | null>(null);
    const [slabDetails, setSlabDetails] = useState<Record<string, { slabs: any[], target: number }>>({});

    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            loadShopData();
        }, [])
    );

    const loadShopData = async () => {
        try {
            const shopId = await getCurrentShopId();
            if (shopId) {
                const { data: shop } = await supabase.from('shops').select('business_type').eq('id', shopId).single();
                setShopType(shop?.business_type || 'retail');
            }
        } catch (error) {
            console.error(error);
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

    const openSlabModal = (item: CartItem) => {
        setCurrentSlabItem({ ...item, name: item.product.name });
        setSlabModalVisible(true);
    };

    const handleSlabSave = (totalQty: number, slabs: any[]) => {
        if (currentSlabItem) {
            setCart(prev => prev.map(i =>
                i.product.id === currentSlabItem.product.id
                    ? { ...i, quantity: totalQty }
                    : i
            ));

            setSlabDetails(prev => ({
                ...prev,
                [currentSlabItem.product.id]: {
                    slabs,
                    target: 0
                }
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
                [{ text: 'OK', onPress: () => setCart([]) }]
            );
        } catch (error: any) {
            Alert.alert(status === 'quote' ? 'Quote Failed' : 'Checkout Failed', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Billing</ThemedText>
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
                            <View style={styles.priceContainer}>
                                <ThemedText style={styles.currencySymbol}>₹</ThemedText>
                                <TextInput
                                    style={styles.priceInput}
                                    value={item.price.toString()}
                                    onChangeText={(text) => updatePrice(item.product.id, text)}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                />
                                <ThemedText style={styles.unitText}>x {item.quantity}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.quantityControls}>
                            {shopType === 'stone' ? (
                                <TouchableOpacity
                                    style={styles.measureBtn}
                                    onPress={() => openSlabModal(item)}
                                >
                                    <Ionicons name="grid-outline" size={20} color={Colors.primary} />
                                    <View>
                                        <ThemedText style={styles.measureText}>Measurement Sheet</ThemedText>
                                        <ThemedText type="caption" style={{ fontSize: 10 }}>
                                            {(slabDetails[item.product.id]?.slabs?.length || 0)} slabs • {item.quantity.toFixed(2)} Sq.Ft
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                                        <Ionicons name="remove" size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                                        <Ionicons name="add" size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}>
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    </Card>
                )}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <View>
                    <ThemedText style={styles.headerLabel}>Total Amount</ThemedText>
                    <ThemedText style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.footerActions}>
                    <Button
                        title="Quote"
                        onPress={() => handleCheckout('quote')}
                        loading={isProcessing}
                        disabled={cart.length === 0}
                        variant="outline"
                        style={{ minWidth: 80, borderRadius: 20, marginRight: 8 }}
                    />
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
                style={styles.fab}
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

            {/* Stone Measurement Modal */}
            <SlabMeasurementModal
                visible={slabModalVisible}
                onClose={() => setSlabModalVisible(false)}
                onSave={handleSlabSave}
                productName={currentSlabItem?.name || 'Product'}
                existingSlabs={currentSlabItem ? slabDetails[currentSlabItem.product.id]?.slabs : []}
                initialTarget={0}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingVertical: 10,
        paddingHorizontal: 20,
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
        paddingBottom: 24,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
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
    fab: {
        position: 'absolute',
        bottom: 110,
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
    measureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    measureText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
});
