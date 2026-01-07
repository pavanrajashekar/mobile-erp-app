import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createProduct, getProduct, updateProduct } from '@/services/productService';
import ThemedText from '@/components/ThemedText';

export default function AddProductScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!params.id;

    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('SF');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [currentStock, setCurrentStock] = useState('');

    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        if (isEditing && params.id) {
            loadProduct(params.id);
        }
    }, [params.id]);

    const loadProduct = async (id: string) => {
        try {
            const data = await getProduct(id);
            if (data) {
                setName(data.name);
                setCategory(data.category || '');
                setUnit(data.unit || 'SF');
                setPrice(data.price?.toString() || '');
                setCostPrice(data.cost_price?.toString() || '');
                setCurrentStock(data.current_stock?.toString() || '');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            Alert.alert('Error', 'Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Product Name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const productData = {
                name: name.trim(),
                category: category.trim() || undefined,
                unit: unit.trim() || 'SF',
                price: parseFloat(price) || 0,
                cost_price: parseFloat(costPrice) || 0,
                current_stock: parseInt(currentStock) || 0,
            };

            if (isEditing && params.id) {
                await updateProduct(params.id, productData);
                Alert.alert('Success', 'Product updated', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                await createProduct(productData);
                Alert.alert('Success', 'Product created', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <ThemedText type="subtitle">{isEditing ? 'Edit Product' : 'New Product'}</ThemedText>
                <View style={{ width: 40 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.form, { backgroundColor: surface, borderColor: border, borderWidth: 1, borderRadius: 16, padding: 20 }]}>
                    <Input
                        label="Product Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. White Marble Slab"
                    />

                    <Input
                        label="Category"
                        value={category}
                        onChangeText={setCategory}
                        placeholder="e.g. Stone, Tile"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Input
                                label="Unit"
                                value={unit}
                                onChangeText={setUnit}
                                placeholder="SF"
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <Input
                                label="Stock Quantity"
                                value={currentStock}
                                onChangeText={setCurrentStock}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Input
                                label="Cost Price"
                                value={costPrice}
                                onChangeText={setCostPrice}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <Input
                                label="Selling Price"
                                value={price}
                                onChangeText={setPrice}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <ThemedText style={{ fontSize: 12, color: textSecondary, marginTop: -4, marginBottom: 12 }}>
                        * For stone slabs, standard unit is usually 'SF'.
                    </ThemedText>

                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
                <Button
                    title={isEditing ? "Update Product" : "Create Product"}
                    onPress={handleSave}
                    loading={isSubmitting}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBtn: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    form: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
});
