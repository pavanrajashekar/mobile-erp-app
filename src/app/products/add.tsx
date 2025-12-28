import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { createProduct } from '@/services/productService';

export default function AddProductScreen() {
    const [name, setName] = useState('');
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
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Add Product' }} />

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Product Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Granite Slab A1"
                    />
                </View>

            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row', gap: 12 }]}>
                <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="e.g. Granite"
                    />
                </View>

                <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                        style={styles.input}
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="e.g. sqft"
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Save Product</Text>
                )}
            </TouchableOpacity>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    form: {
        padding: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        minHeight: 100,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
