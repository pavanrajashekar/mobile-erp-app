import React, { useState } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Button from '@/components/Button';
import { addExpense } from '@/services/expenseService';

interface AddExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
}

const CATEGORIES = ['Rent', 'Salaries', 'Utilities', 'Inventory', 'Tea/Coffee', 'Maintenance', 'Other'];

export default function AddExpenseModal({ visible, onClose, onSave }: AddExpenseModalProps) {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!amount || !category) {
            Alert.alert('Error', 'Please enter amount and category');
            return;
        }

        setLoading(true);
        try {
            await addExpense(parseFloat(amount), category, description);
            setAmount('');
            setCategory('');
            setDescription('');
            onSave();
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="title">Add Expense</ThemedText>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText style={{ color: Colors.primary }}>Cancel</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold">Amount</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold">Category</ThemedText>
                        <View style={styles.tags}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.tag, category === cat && styles.tagSelected]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <ThemedText style={[styles.tagText, category === cat && styles.tagTextSelected]}>
                                        {cat}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold">Description (Optional)</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Details..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <Button
                        title="Save Expense"
                        onPress={handleSave}
                        loading={loading}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 20,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    input: {
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tagSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tagText: {
        fontSize: 14,
        color: Colors.text,
    },
    tagTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
});
