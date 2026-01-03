import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { createProduct } from '@/services/productService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { useShop } from '@/hooks/useShop';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddProductScreen() {
    const { businessType } = useShop();
    const router = useRouter();
    const backgroundColor = useThemeColor({}, 'background');
    const textSecondary = useThemeColor({}, 'textSecondary');

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');

    // Wine Specific Info
    const [vintage, setVintage] = useState('');
    const [region, setRegion] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('Product name is required');
            return;
        }

        let finalCategory = category;
        // Merge wine info into category for display purpose if no metadata support yet
        if (businessType === 'wine') {
            if (region) finalCategory = region + (finalCategory ? ` • ${finalCategory}` : '');
            if (vintage) finalCategory = vintage + (finalCategory ? ` • ${finalCategory}` : '');
        }

        setIsSubmitting(true);
        try {
            await createProduct({
                name: name.trim(),
                price: price ? parseFloat(price) : 0,
                cost_price: costPrice ? parseFloat(costPrice) : 0,
                category: finalCategory.trim() || undefined,
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
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Stack.Screen options={{ title: 'Add Product' }} />

                <View style={styles.form}>
                    <Input
                        label="Product Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder={businessType === 'wine' ? "e.g. Cabernet Sauvignon" : "e.g. Granite Slab A1"}
                    />

                    {/* Wine Specific Fields */}
                    {businessType === 'wine' && (
                        <View style={styles.row}>
                            <Input
                                label="Vintage (Year)"
                                value={vintage}
                                onChangeText={setVintage}
                                placeholder="2020"
                                keyboardType="numeric"
                                containerStyle={styles.halfInput}
                            />
                            <Input
                                label="Region"
                                value={region}
                                onChangeText={setRegion}
                                placeholder="Napa Valley"
                                containerStyle={styles.halfInput}
                            />
                        </View>
                    )}

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
                            placeholder={businessType === 'wine' ? "Type (Red/White)" : "e.g. Granite"}
                            containerStyle={styles.halfInput}
                        />

                        <Input
                            label="Unit"
                            value={unit}
                            onChangeText={setUnit}
                            placeholder={businessType === 'stone' ? "sqft" : "pcs"}
                            containerStyle={styles.halfInput}
                            defaultValue={businessType === 'stone' ? 'sqft' : ''}
                        />
                    </View>

                    {businessType === 'stone' && (
                        <ThemedText style={{ fontSize: 12, color: textSecondary, marginTop: -10, marginBottom: 10 }}>
                            * For stone slabs, standard unit is usually 'sqft'.
                        </ThemedText>
                    )}

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
    },
    content: {
        padding: 20,
    },
    form: {
        gap: 16,
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
