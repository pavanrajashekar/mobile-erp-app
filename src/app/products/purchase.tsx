import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { fetchProducts, Product } from '@/services/productService';
import { createPurchase } from '@/services/purchaseService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import { Picker } from '@react-native-picker/picker'; // Optional if picker is installed, otherwise simple select

export default function PurchaseScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [supplier, setSupplier] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await fetchProducts();
            setProducts(data || []);
            if (data && data.length > 0) {
                setSelectedProduct(data[0].id);
                // Pre-fill cost if available
                if (data[0].cost_price) setUnitCost(data[0].cost_price.toString());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleProductChange = (productId: string) => {
        setSelectedProduct(productId);
        const product = products.find(p => p.id === productId);
        if (product && product.cost_price) {
            setUnitCost(product.cost_price.toString());
        } else {
            setUnitCost('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct || !quantity || !unitCost) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await createPurchase(
                selectedProduct,
                parseInt(quantity),
                parseFloat(unitCost),
                supplier
            );
            Alert.alert('Success', 'Stock added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Stack.Screen options={{ title: 'Add Stock / Purchase' }} />

                <View style={styles.form}>
                    <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>Select Product</ThemedText>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedProduct}
                            onValueChange={(itemValue: string) => handleProductChange(itemValue)}
                            style={{ width: '100%' }}
                        >
                            {products.map(p => (
                                <Picker.Item key={p.id} label={p.name} value={p.id} />
                            ))}
                        </Picker>
                    </View>

                    <Input
                        label="Quantity *"
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="e.g. 100"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Unit Cost *"
                        value={unitCost}
                        onChangeText={setUnitCost}
                        placeholder="e.g. 50.00"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Supplier Name (Optional)"
                        value={supplier}
                        onChangeText={setSupplier}
                        placeholder="e.g. ABC Suppliers"
                    />

                    <View style={styles.summary}>
                        <ThemedText type="default">Total Cost:</ThemedText>
                        <ThemedText type="subtitle" style={{ color: Colors.primary }}>
                            ₹{((parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)).toFixed(2)}
                        </ThemedText>
                    </View>

                    <Button
                        title="Add Stock"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.marginTop}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        padding: 20,
    },
    form: {
        gap: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: Colors.surface,
    },
    marginTop: {
        marginTop: 20,
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surfaceSubtle,
        borderRadius: 12,
        marginTop: 8,
    }
});
