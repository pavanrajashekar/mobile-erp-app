import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useThemeColor } from '@/hooks/useThemeColor';

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

    const background = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const text = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const success = useThemeColor({}, 'success');
    const inputBackground = useThemeColor({}, 'surfaceSubtle'); // Assuming surfaceSubtle for inputs
    const error = useThemeColor({}, 'error');

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
                style={[styles.container, { backgroundColor: background }]}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: text }]}>Measurement Sheet</Text>
                        <Text style={[styles.headerSubtitle, { color: textSecondary }]}>{productName}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={text} />
                    </TouchableOpacity>
                </View>

                {/* Target & Progress */}
                <View style={[styles.targetContainer, { backgroundColor: surface, borderBottomColor: border }]}>
                    <View style={styles.targetRow}>
                        <Text style={[styles.targetLabel, { color: text }]}>Target (SF):</Text>
                        <TextInput
                            style={[styles.targetInput, { borderColor: border, color: text, backgroundColor: inputBackground }]}
                            value={targetArea}
                            onChangeText={setTargetArea}
                            placeholder="0"
                            placeholderTextColor={textSecondary}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.progressBarBg, { backgroundColor: border }]}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: primary }, progress >= 100 && { backgroundColor: success }]} />
                    </View>
                    <Text style={[styles.progressText, { color: textSecondary }]}>
                        Total: {totalArea.toFixed(2)} Sq.Ft / {targetArea || '0'}
                    </Text>
                </View>

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: surface }]}>
                    {/* Unit Selector inside Input Area */}
                    <View style={styles.unitSelector}>
                        <Text style={[styles.unitLabel, { color: textSecondary }]}>Input Unit:</Text>
                        <View style={[styles.unitButtons, { backgroundColor: inputBackground }]}>
                            {(['ft', 'in', 'cm'] as Unit[]).map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitOption, unit === u && [styles.unitOptionSelected, { backgroundColor: surface }]]}
                                    onPress={() => handleUnitChange(u)}
                                >
                                    <Text style={[styles.unitText, { color: textSecondary }, unit === u && [styles.unitTextSelected, { color: primary }]]}>
                                        {u.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.validLabel, { color: textSecondary }]}>Length</Text>
                            <TextInput
                                style={[styles.mainInput, { borderColor: border, color: text, backgroundColor: inputBackground }]}
                                value={length}
                                onChangeText={setLength}
                                placeholder="0.0"
                                placeholderTextColor={textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.validLabel, { color: textSecondary }]}>Width</Text>
                            <TextInput
                                style={[styles.mainInput, { borderColor: border, color: text, backgroundColor: inputBackground }]}
                                value={width}
                                onChangeText={setWidth}
                                placeholder="0.0"
                                placeholderTextColor={textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: primary }]} onPress={addSlab}>
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List Header */}
                <View style={[styles.listHeader, { backgroundColor: inputBackground, borderBottomColor: border }]}>
                    <Text style={[styles.headerCol, { width: 40, color: textSecondary }]}>#</Text>
                    <Text style={[styles.headerCol, { flex: 1, color: textSecondary }]}>Dimensions</Text>
                    <Text style={[styles.headerCol, { width: 80, textAlign: 'right', color: textSecondary }]}>Sq.Ft</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Slabs List */}
                <FlatList
                    data={slabs}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item, index }) => (
                        <View style={[styles.row, { borderBottomColor: border }]}>
                            <Text style={[styles.rowIndex, { color: textSecondary }]}>{slabs.length - index}</Text>

                            <Text style={[styles.dimText, { color: text }]}>
                                {item.length} x {item.width}
                                <Text style={[styles.unitBadge, { color: textSecondary }]}> {item.unit}</Text>
                            </Text>

                            <Text style={[styles.areaText, { color: text }]}>
                                {item.area.toFixed(2)}
                            </Text>

                            <TouchableOpacity onPress={() => removeSlab(item.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color={error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: textSecondary }]}>No items added.</Text>
                    }
                />

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }]}>
                    <Button title={`Save Total: ${totalArea.toFixed(2)} Sq.Ft`} onPress={handleSave} />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
    },
    closeBtn: {
        padding: 4,
    },
    targetContainer: {
        padding: 16,
        borderBottomWidth: 1,
    },
    targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'space-between'
    },
    targetLabel: {
        fontSize: 16,
        marginRight: 10,
    },
    targetInput: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 6,
        minWidth: 80,
        textAlign: 'center',
        fontSize: 16,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500'
    },
    inputContainer: {
        padding: 16,
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
    },
    unitButtons: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    unitOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    unitOptionSelected: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    unitText: {
        fontSize: 12,
        fontWeight: '600',
    },
    unitTextSelected: {
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
        marginBottom: 4
    },
    mainInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
    },
    addBtn: {
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
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    headerCol: {
        fontWeight: '600',
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
    },
    rowIndex: {
        width: 40,
        fontSize: 14,
        fontWeight: '500',
    },
    dimText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500'
    },
    unitBadge: {
        fontSize: 12,
        fontWeight: 'normal'
    },
    areaText: {
        width: 80,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
        paddingRight: 10,
    },
    deleteBtn: {
        width: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
});
