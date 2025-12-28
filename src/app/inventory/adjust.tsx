import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { addStockMovement, MovementType } from '@/services/inventoryService';

export default function AdjustStockScreen() {
    const { productId, productName } = useLocalSearchParams<{ productId: string, productName: string }>();
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState<MovementType>('purchase');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!quantity || isNaN(Number(quantity))) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }

        setIsSubmitting(true);
        try {
            // Purchases/Returns add stock (positive)
            // Sales/Damage/Adjustment(if negative) remove stock. 
            // For this UI, we treat the input as absolute magnitude and sign it based on type?
            // Actually, let's keep it simple: Purchases are +, Damages are -.

            let finalQty = Number(quantity);
            if (type === 'damage' || type === 'sale') {
                finalQty = -Math.abs(finalQty);
            }

            await addStockMovement(productId, finalQty, type);
            Alert.alert('Success', 'Stock updated');
            router.back();
        } catch (error: any) {
            console.error('Stock Update Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Stock: ${productName}` }} />

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Movement Type</Text>
                    <View style={styles.typeContainer}>
                        {(['purchase', 'damage', 'adjustment'] as const).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeButton, type === t && styles.typeButtonActive]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Quantity {type === 'damage' ? '(will subtract)' : '(will add)'}</Text>
                    <TextInput
                        style={styles.input}
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="0"
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Update Stock</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    form: {
        gap: 24,
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
        fontSize: 18,
        backgroundColor: '#f9f9f9',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#eee',
    },
    typeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    typeText: {
        color: '#666',
        fontWeight: '500',
    },
    typeTextActive: {
        color: 'white',
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
