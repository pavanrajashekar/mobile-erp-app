import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

interface Slab {
    id: string;
    length: number;
    width: number;
    area: number;
    unit: 'ft' | 'in' | 'cm';
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (totalQuantity: number, slabs: Slab[]) => void;
    productName: string;
    existingSlabs?: Slab[];
    initialTarget?: number;
}

type Unit = 'ft' | 'in' | 'cm';

export default function SlabMeasurementModal({ visible, onClose, onSave, productName, existingSlabs = [], initialTarget = 0 }: Props) {
    const [unit, setUnit] = useState<Unit>('ft');
    const [slabs, setSlabs] = useState<Slab[]>([]);
    const [targetArea, setTargetArea] = useState(initialTarget.toString());

    // Input State
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');

    useEffect(() => {
        if (visible) {
            if (existingSlabs && existingSlabs.length > 0) {
                setSlabs(existingSlabs);
                setUnit(existingSlabs[0].unit || 'ft');
            } else {
                setSlabs([]);
            }
            if (initialTarget) setTargetArea(initialTarget.toString());

            // Clear inputs
            setLength('');
            setWidth('');
        }
    }, [visible, existingSlabs, initialTarget]);

    const calculateArea = (l: number, w: number, u: Unit): number => {
        let areaSqFt = 0;
        if (u === 'ft') {
            areaSqFt = l * w;
        } else if (u === 'in') {
            areaSqFt = (l * w) / 144;
        } else if (u === 'cm') {
            areaSqFt = (l * w) / 929.0304;
        }
        return Number(areaSqFt.toFixed(3));
    };

    const addSlab = () => {
        const l = parseFloat(length);
        const w = parseFloat(width);

        if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
            Alert.alert('Invalid Input', 'Please enter valid length and width');
            return;
        }

        const newSlab: Slab = {
            id: Date.now().toString(),
            length: l,
            width: w,
            area: calculateArea(l, w, unit), // Always calculated in SF
            unit: unit
        };

        setSlabs([newSlab, ...slabs]); // Add to top

        setLength('');
        setWidth('');
    };

    const removeSlab = (id: string) => {
        setSlabs(prev => prev.filter(s => s.id !== id));
    };

    const handleUnitChange = (newUnit: Unit) => {
        setUnit(newUnit);
        // We do NOT recalculate existing items. They are fixedhistory.
        // Changing unit only affects NEW inputs.
    };

    // Calculate total from stored areas
    const totalArea = slabs.reduce((sum, slab) => sum + slab.area, 0);
    const progress = parseFloat(targetArea) > 0 ? (totalArea / parseFloat(targetArea)) * 100 : 0;

    const handleSave = () => {
        onSave(totalArea, slabs);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Measurement Sheet</Text>
                        <Text style={styles.headerSubtitle}>{productName}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Target & Progress */}
                <View style={styles.targetContainer}>
                    <View style={styles.targetRow}>
                        <Text style={styles.targetLabel}>Target (SF):</Text>
                        <TextInput
                            style={styles.targetInput}
                            value={targetArea}
                            onChangeText={setTargetArea}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }, progress >= 100 && { backgroundColor: Colors.success }]} />
                    </View>
                    <Text style={styles.progressText}>
                        Total: {totalArea.toFixed(2)} Sq.Ft / {targetArea || '0'}
                    </Text>
                </View>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    {/* Unit Selector inside Input Area */}
                    <View style={styles.unitSelector}>
                        <Text style={styles.unitLabel}>Input Unit:</Text>
                        <View style={styles.unitButtons}>
                            {(['ft', 'in', 'cm'] as Unit[]).map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitOption, unit === u && styles.unitOptionSelected]}
                                    onPress={() => handleUnitChange(u)}
                                >
                                    <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>
                                        {u.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.validLabel}>Length</Text>
                            <TextInput
                                style={styles.mainInput}
                                value={length}
                                onChangeText={setLength}
                                placeholder="0.0"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.validLabel}>Width</Text>
                            <TextInput
                                style={styles.mainInput}
                                value={width}
                                onChangeText={setWidth}
                                placeholder="0.0"
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={addSlab}>
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List Header */}
                <View style={styles.listHeader}>
                    <Text style={[styles.headerCol, { width: 40 }]}>#</Text>
                    <Text style={[styles.headerCol, { flex: 1 }]}>Dimensions</Text>
                    <Text style={[styles.headerCol, { width: 80, textAlign: 'right' }]}>Sq.Ft</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Slabs List */}
                <FlatList
                    data={slabs}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item, index }) => (
                        <View style={styles.row}>
                            <Text style={styles.rowIndex}>{slabs.length - index}</Text>

                            <Text style={styles.dimText}>
                                {item.length} x {item.width}
                                <Text style={styles.unitBadge}> {item.unit}</Text>
                            </Text>

                            <Text style={styles.areaText}>
                                {item.area.toFixed(2)}
                            </Text>

                            <TouchableOpacity onPress={() => removeSlab(item.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No items added.</Text>
                    }
                />

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 34 : 20 }]}>
                    <Button title={`Save Total: ${totalArea.toFixed(2)} Sq.Ft`} onPress={handleSave} />
                </View>
            </KeyboardAvoidingView>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    closeBtn: {
        padding: 4,
    },
    targetContainer: {
        padding: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'space-between'
    },
    targetLabel: {
        fontSize: 16,
        color: Colors.text,
        marginRight: 10,
    },
    targetInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 4,
        padding: 6,
        minWidth: 80,
        textAlign: 'center',
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    progressText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500'
    },
    inputContainer: {
        padding: 16,
        backgroundColor: Colors.white,
        marginBottom: 10,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    unitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4
    },
    unitLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    unitButtons: {
        flexDirection: 'row',
        backgroundColor: Colors.inputBackground,
        borderRadius: 8,
        padding: 2,
    },
    unitOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    unitOptionSelected: {
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    unitText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    unitTextSelected: {
        color: Colors.primary,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12
    },
    inputWrapper: {
        flex: 1,
    },
    validLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4
    },
    mainInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        backgroundColor: '#f9f9f9',
    },
    addBtn: {
        backgroundColor: Colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0
    },
    listHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    headerCol: {
        fontWeight: '600',
        color: Colors.textSecondary,
        fontSize: 13,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    rowIndex: {
        width: 40,
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    dimText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500'
    },
    unitBadge: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: 'normal'
    },
    areaText: {
        width: 80,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        paddingRight: 10,
    },
    deleteBtn: {
        width: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        marginTop: 40
    },
    footer: {
        padding: 20,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
});
