import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { createProduct } from '@/services/productService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';

export default function AddProductScreen() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState(''); // Added
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('Product name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await createProduct({
                name: name.trim(),
                price: price ? parseFloat(price) : 0,
                cost_price: costPrice ? parseFloat(costPrice) : 0, // Added
                category: category.trim() || undefined,
                unit: unit.trim() || undefined,
            });
            router.back();
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Stack.Screen options={{ title: 'Add Product' }} />

                <View style={styles.form}>
                    <Input
                        label="Product Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Granite Slab A1"
                    />

                    <View style={styles.row}>
                        <Input
                            label="Selling Price"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                            keyboardType="numeric"
                            containerStyle={styles.halfInput}
                        />

                        <Input
                            label="Cost Price"
                            value={costPrice}
                            onChangeText={setCostPrice}
                            placeholder="0.00"
                            keyboardType="numeric"
                            containerStyle={styles.halfInput}
                        />
                    </View>

                    <View style={styles.row}>
                        <Input
                            label="Category"
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g. Granite"
                            containerStyle={styles.halfInput}
                        />

                        <Input
                            label="Unit"
                            value={unit}
                            onChangeText={setUnit}
                            placeholder="e.g. sqft"
                            containerStyle={styles.halfInput}
                        />
                    </View>

                    <Button
                        title="Save Product"
                        onPress={handleSubmit}
                        loading={isSubmitting}
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
        gap: 0,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    marginTop: {
        marginTop: 20,
    },
});
