import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createMeasurementSheet, UOM, calculateAreaInSqFt, MeasurementItem } from '@/services/measurementService';

export default function CreateMeasurementScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ saleId?: string, customerName?: string }>();

    // Form State
    const [customerName, setCustomerName] = useState(params.customerName || '');
    const [customerPhone, setCustomerPhone] = useState('');
    const [uom, setUom] = useState<UOM>('feet');

    // Items State
    const [items, setItems] = useState<MeasurementItem[]>([]);

    // New Item Input State
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [price, setPrice] = useState('');
    const [remarks, setRemarks] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const error = useThemeColor({}, 'error');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryLight = useThemeColor({}, 'primaryLight');

    // Helper to calculate current item area
    const currentArea = calculateAreaInSqFt(
        parseFloat(length) || 0,
        parseFloat(width) || 0,
        parseFloat(quantity) || 1,
        uom
    );

    const addItem = () => {
        if (!length || !width) {
            Alert.alert('Error', 'Please enter dimensions');
            return;
        }

        const newItem: MeasurementItem = {
            id: Date.now().toString(), // Temporary ID
            product_id: null, // Can add product selector later
            length: parseFloat(length),
            width: parseFloat(width),
            quantity: parseFloat(quantity) || 1,
            area: calculateAreaInSqFt(parseFloat(length), parseFloat(width), parseFloat(quantity) || 1, uom),
            total_price: parseFloat(price) || 0,
            remarks: remarks
        };

        setItems([...items, newItem]);

        // Reset Inputs
        setLength('');
        setWidth('');
        setQuantity('1');
        setPrice('');
        setRemarks('');
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!customerName) {
            Alert.alert('Error', 'Customer Name is required');
            return;
        }
        if (items.length === 0) {
            Alert.alert('Error', 'Add at least one item');
            return;
        }

        setIsSubmitting(true);
        try {
            await createMeasurementSheet({
                customer_name: customerName,
                customer_phone: customerPhone,
                sale_id: params.saleId ? params.saleId : undefined,
                status: 'draft',
                uom: uom,
                items: items
            });
            Alert.alert('Success', 'Measurement Sheet Saved', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSheetArea = items.reduce((sum, i) => sum + i.area, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Stack.Screen options={{ title: 'New Measurement Sheet' }} />
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Info */}
                <Card style={styles.section}>
                    <Input
                        label="Customer Name *"
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="John Doe"
                    />
                    <Input
                        label="Phone"
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="Optional"
                        keyboardType="phone-pad"
                    />

                    {/* UOM Selector */}
                    <View style={styles.uomContainer}>
                        <ThemedText style={styles.label}>Unit of Measurement</ThemedText>
                        <View style={styles.uomButtons}>
                            {(['feet', 'inch', 'cm', 'mm'] as UOM[]).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.uomBtn,
                                        uom === t && { backgroundColor: primary },
                                        uom !== t && { backgroundColor: surface, borderWidth: 1, borderColor: textSecondary + '40' }
                                    ]}
                                    onPress={() => setUom(t)}
                                >
                                    <ThemedText style={{ color: uom === t ? '#fff' : textSecondary, textTransform: 'capitalize' }}>
                                        {t}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Card>

                {/* Add Item Form */}
                <Card style={styles.section}>
                    <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Add Measurements</ThemedText>

                    <View style={styles.row}>
                        <Input
                            label={`Length (${uom})`}
                            value={length}
                            onChangeText={setLength}
                            keyboardType="numeric"
                            containerStyle={styles.input}
                        />
                        <ThemedText style={styles.x}>×</ThemedText>
                        <Input
                            label={`Width (${uom})`}
                            value={width}
                            onChangeText={setWidth}
                            keyboardType="numeric"
                            containerStyle={styles.input}
                        />
                        <ThemedText style={styles.x}>×</ThemedText>
                        <Input
                            label="Qty"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                            containerStyle={[styles.input, { flex: 0.5 }]}
                            placeholder="1"
                        />
                    </View>

                    <View style={styles.row}>
                        <Input
                            label="Price (Optional)"
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                            containerStyle={styles.input}
                            placeholder="Total Price"
                        />
                        <Input
                            label="Remarks"
                            value={remarks}
                            onChangeText={setRemarks}
                            containerStyle={[styles.input, { flex: 2 }]}
                            placeholder="e.g. Kitchen Top"
                        />
                    </View>

                    <View style={[styles.previewArea, { backgroundColor: primaryLight }]}>
                        <ThemedText style={{ color: primary, textAlign: 'center' }}>
                            = {currentArea.toFixed(2)} sq.ft
                        </ThemedText>
                    </View>

                    <Button title="Add Item" onPress={addItem} variant="secondary" />
                </Card>

                {/* Items List */}
                <View style={styles.itemsList}>
                    <ThemedText type="subtitle" style={{ marginLeft: 4, marginBottom: 8 }}>Items ({items.length})</ThemedText>
                    {items.map((item, index) => (
                        <Card key={index} style={styles.itemCard}>
                            <View style={styles.itemRow}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="defaultSemiBold">
                                        {item.length} x {item.width} {uom} (Qty: {item.quantity})
                                    </ThemedText>
                                    <ThemedText style={{ color: textSecondary, fontSize: 12 }}>
                                        {item.remarks || 'No remarks'}
                                    </ThemedText>
                                </View>
                                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                                    <ThemedText type="defaultSemiBold">{item.area.toFixed(2)} sq.ft</ThemedText>
                                    {item.total_price > 0 && <ThemedText>₹{item.total_price}</ThemedText>}
                                </View>
                                <TouchableOpacity onPress={() => removeItem(index)}>
                                    <Ionicons name="trash-outline" size={20} color={error} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}
                </View>

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: surface }]}>
                <View>
                    <ThemedText style={{ color: textSecondary }}>Total Area</ThemedText>
                    <ThemedText type="title">{totalSheetArea.toFixed(2)} sq.ft</ThemedText>
                </View>
                <Button
                    title="Save Sheet"
                    onPress={handleSave}
                    loading={isSubmitting}
                    style={{ minWidth: 120 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
        gap: 16,
    },
    section: {
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        flex: 1,
    },
    x: {
        fontSize: 20,
        color: '#888',
        marginTop: 10,
    },
    uomContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    uomButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    uomBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    previewArea: {
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
    },
    itemsList: {
        gap: 8,
    },
    itemCard: {
        padding: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});
