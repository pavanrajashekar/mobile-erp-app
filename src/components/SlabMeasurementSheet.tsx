import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SlabMeasurementSheetProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (totalQuantity: number, details: string) => void;
    initialQuantity?: number;
}

export default function SlabMeasurementSheet({ visible, onClose, onConfirm, initialQuantity }: SlabMeasurementSheetProps) {
    const [length, setLength] = useState('');
    const [height, setHeight] = useState('');
    const [count, setCount] = useState('1');
    const [totalArea, setTotalArea] = useState(0);

    const surface = useThemeColor({}, 'surface');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primary = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');

    // Reset when opening
    useEffect(() => {
        if (visible) {
            setLength('');
            setHeight('');
            setCount('1');
            setTotalArea(0);
        }
    }, [visible]);

    // Auto-calculate
    useEffect(() => {
        const l = parseFloat(length) || 0;
        const h = parseFloat(height) || 0;
        const c = parseFloat(count) || 1;

        // Assuming L x H (in feet/inches logic usually, but here just raw multiplication for 'sqft')
        // Standard Stone logic: usually Length * Height = Sqft.
        const area = (l * h * c);
        setTotalArea(parseFloat(area.toFixed(2)));
    }, [length, height, count]);

    const handleConfirm = () => {
        if (totalArea <= 0) {
            alert('Invalid measurements');
            return;
        }
        const detailStr = `${length}x${height} (${count} slabs)`;
        onConfirm(totalArea, detailStr);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.sheet, { backgroundColor: surface }]}>
                            <View style={styles.header}>
                                <ThemedText type="subtitle">Slab Measurement</ThemedText>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color={textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <Input
                                    label="Length"
                                    value={length}
                                    onChangeText={setLength}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    containerStyle={styles.input}
                                />
                                <ThemedText style={[styles.mathSymbol, { color: textSecondary }]}>×</ThemedText>
                                <Input
                                    label="Height"
                                    value={height}
                                    onChangeText={setHeight}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    containerStyle={styles.input}
                                />
                            </View>

                            <View style={styles.row}>
                                <ThemedText style={[styles.mathSymbol, { width: 20, color: textSecondary }]}>×</ThemedText>
                                <Input
                                    label="Count (Slabs)"
                                    value={count}
                                    onChangeText={setCount}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    containerStyle={[styles.input, { flex: 1 }]}
                                />
                            </View>

                            <View style={[styles.resultContainer, { backgroundColor: primaryLight }]}>
                                <ThemedText type="defaultSemiBold" style={{ color: textSecondary }}>Total Area</ThemedText>
                                <ThemedText type="title" style={{ color: primary }}>{totalArea} sq.ft.</ThemedText>
                            </View>

                            <Button title="Add to Invoice" onPress={handleConfirm} style={styles.btn} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 16,
    },
    input: {
        flex: 1,
    },
    mathSymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 30, // Align with input text roughly
        textAlign: 'center',
    },
    resultContainer: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: 10,
    },
    btn: {
        marginTop: 10,
    }
});
