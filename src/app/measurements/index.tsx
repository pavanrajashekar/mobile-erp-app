import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMeasurements, MeasurementSheet } from '@/services/measurementService';
import EmptyState from '@/components/EmptyState';

export default function MeasurementsScreen() {
    const [sheets, setSheets] = useState<MeasurementSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const text = useThemeColor({}, 'text');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMeasurements();
            setSheets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <ThemedText type="title">Measurements</ThemedText>
            </View>

            <FlatList
                data={sheets}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            variant="generic"
                            title="No measurement sheets found"
                            description="Create a new sheet to get started."
                            actionLabel="Create Sheet"
                            onAction={() => router.push('/measurements/create')}
                            style={{ marginTop: 100 }}
                        />
                    ) : null
                }
                renderItem={({ item }) => {
                    const linkedSaleId = item.sale_id || (item as any).sales?.id;
                    const linkedSaleCustomer = (item as any).sales?.customer_name;

                    return (
                        <TouchableOpacity onPress={() => {
                            if (linkedSaleId) {
                                router.push(`/invoice/${linkedSaleId}`);
                            } else {
                                router.push(`/measurements/${item.id}`);
                            }
                        }}>
                            <Card style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                                            {item.customer_name || linkedSaleCustomer || 'Unnamed Customer'}
                                        </ThemedText>
                                        <ThemedText style={{ color: textSecondary, fontSize: 12 }}>
                                            {formatDate(item.created_at)}
                                        </ThemedText>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={[styles.badge, { backgroundColor: item.status === 'confirmed' ? '#e8f5e9' : '#fff3e0' }]}>
                                            <ThemedText style={{ color: item.status === 'confirmed' ? 'green' : 'orange', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                                {item.status === 'converted_to_sale' ? 'Sold' : item.status}
                                            </ThemedText>
                                        </View>
                                        {linkedSaleId && (
                                            <ThemedText style={{ fontSize: 10, color: primary, marginTop: 4 }}>
                                                Linked to Inv #{linkedSaleId.slice(0, 6).toUpperCase()}
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: textSecondary + '20' }]} />

                                <View style={styles.statsRow}>
                                    <View>
                                        <ThemedText style={{ color: textSecondary, fontSize: 12 }}>Total Area</ThemedText>
                                        <ThemedText type="defaultSemiBold">{item.total_area?.toFixed(2) || '0'} sq.ft</ThemedText>
                                    </View>
                                    <View>
                                        <ThemedText style={{ color: textSecondary, fontSize: 12 }}>Items</ThemedText>
                                        <ThemedText type="defaultSemiBold">{item.items?.length || '-'}</ThemedText>
                                    </View>
                                    <View>
                                        <ThemedText style={{ color: textSecondary, fontSize: 12 }}>Est. Amount</ThemedText>
                                        <ThemedText type="defaultSemiBold">₹{item.total_amount?.toFixed(0) || '0'}</ThemedText>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    );
                }}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: primary, shadowColor: primary }]}
                onPress={() => router.push('/measurements/create')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    list: {
        padding: 16,
        gap: 12,
        paddingBottom: 100,
    },
    card: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
