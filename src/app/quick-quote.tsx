import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProductSelectionModal from '@/components/ProductSelectionModal';
import { Product } from '@/services/productService';
import { processSale, CartItem } from '@/services/billingService';
import { createAndSharePDF } from '@/services/InvoiceGenerator';
import { getCurrentShopId, getShopDetails } from '@/services/shopService';

export default function QuickQuoteScreen() {
    const router = useRouter();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [items, setItems] = useState<CartItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSelectProduct = (product: Product) => {
        setItems(current => {
            const existing = current.find(i => i.product.id === product.id);
            if (existing) {
                return current.map(i =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...current, { product, quantity: 1, price: product.price || 0 }];
        });
        setModalVisible(false);
    };

    const updateQuantity = (id: string, delta: number) => {
        setItems(current => current.map(item => {
            if (item.product.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const updatePrice = (id: string, price: string) => {
        const val = parseFloat(price);
        if (isNaN(val)) return;
        setItems(current => current.map(item =>
            item.product.id === id ? { ...item, price: val } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(current => current.filter(i => i.product.id !== id));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSaveAndShare = async () => {
        if (items.length === 0) {
            Alert.alert('Error', 'Please add at least one item');
            return;
        }

        setLoading(true);
        try {
            // 1. Save Quote to DB
            // Passing 'quote' status so stock is NOT deducted
            const sale = await processSale(items, totalAmount, 'cash', 'quote');

            // 2. Generate PDF
            const shopId = await getCurrentShopId();
            const shop = shopId ? await getShopDetails(shopId) : null;

            const invoiceData = {
                shopName: shop?.name || 'My Shop',
                shopAddress: shop?.address || '',
                customerName: customerName || 'Valued Customer',
                customerPhone: customerPhone || '',
                invoiceNumber: sale.id.slice(0, 8).toUpperCase(),
                date: new Date().toLocaleDateString(),
                type: 'Quote',
                items: items.map(item => ({
                    description: item.product.name,
                    quantity: item.quantity,
                    unit: item.product.unit,
                    price: item.price,
                    total: item.quantity * item.price
                })),
                totalAmount: totalAmount
            };

            await createAndSharePDF(invoiceData as any);

            // 3. Navigate Back or to history
            Alert.alert(
                'Quote Saved',
                'Quote has been saved and PDF generated.',
                [
                    { text: 'Done', onPress: () => router.back() },
                    { text: 'View Details', onPress: () => router.replace(`/invoice/${sale.id}`) }
                ]
            );

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save quote');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <ThemedText type="title">New Quote</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Customer Details */}
                <Card style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>Customer Details (Optional)</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Customer Name"
                        value={customerName}
                        onChangeText={setCustomerName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                    />
                </Card>

                {/* Items */}
                <View style={styles.itemsHeader}>
                    <ThemedText type="defaultSemiBold">Items</ThemedText>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <ThemedText type="link">+ Add Item</ThemedText>
                    </TouchableOpacity>
                </View>

                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <ThemedText style={{ color: Colors.textSecondary }}>No items added yet</ThemedText>
                    </View>
                ) : (
                    items.map(item => (
                        <Card key={item.product.id} style={styles.itemCard}>
                            <View style={styles.itemRow}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="defaultSemiBold">{item.product.name}</ThemedText>
                                    <View style={styles.priceRow}>
                                        <Text style={{ color: Colors.textSecondary }}>$</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            value={item.price.toString()}
                                            onChangeText={(t) => updatePrice(item.product.id, t)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.qtyControl}>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, -1)}>
                                        <Ionicons name="remove-circle-outline" size={24} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, 1)}>
                                        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={() => removeItem(item.product.id)} style={{ marginLeft: 10 }}>
                                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <ThemedText>Total Amount</ThemedText>
                    <ThemedText type="title">${totalAmount.toFixed(2)}</ThemedText>
                </View>
                <Button
                    title="Save & Share PDF"
                    onPress={handleSaveAndShare}
                    loading={loading}
                    icon={<Ionicons name="share-social-outline" size={20} color="white" />}
                />
            </View>

            <ProductSelectionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelectProduct={handleSelectProduct}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        padding: 16,
        marginBottom: 20,
    },
    input: {
        backgroundColor: Colors.inputBackground,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 10,
        fontSize: 16,
    },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyState: {
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    itemCard: {
        padding: 12,
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    priceInput: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        padding: 0,
        minWidth: 50,
        marginLeft: 4,
        fontSize: 14,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyText: {
        fontWeight: 'bold',
        fontSize: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 30,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
});
