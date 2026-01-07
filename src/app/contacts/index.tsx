import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getContacts, Contact } from '@/services/contactService';
import { useTheme } from '@/context/ThemeContext';
import EmptyState from '@/components/EmptyState';

export default function ContactsScreen() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [type, setType] = useState<'customer' | 'supplier'>('customer');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const { theme } = useTheme();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getContacts(type);
            setContacts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [type]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <ThemedText type="title">Contacts</ThemedText>
            </View>

            {/* Filter Tabs */}
            <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        onPress={() => setType('customer')}
                        activeOpacity={0.7}
                        style={[
                            styles.segmentButton,
                            type === 'customer' && styles.segmentButtonActive
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.segmentText,
                                type === 'customer' ? { color: primary, fontWeight: '700' } : { color: textSecondary, fontWeight: '500' }
                            ]}
                        >
                            Customers
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setType('supplier')}
                        activeOpacity={0.7}
                        style={[
                            styles.segmentButton,
                            type === 'supplier' && styles.segmentButtonActive
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.segmentText,
                                type === 'supplier' ? { color: primary, fontWeight: '700' } : { color: textSecondary, fontWeight: '500' }
                            ]}
                        >
                            Suppliers
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={contacts}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            variant="generic"
                            title={`No ${type}s found`}
                            description={`Add a new ${type} to get started.`}
                            actionLabel={`Add ${type === 'customer' ? 'Customer' : 'Supplier'}`}
                            onAction={() => router.push({ pathname: '/contacts/create', params: { type } })}
                            style={{ marginTop: 60 }}
                        />
                    ) : null
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push(`/contacts/${item.id}`)}>
                        <Card style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatar}>
                                    <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                        {item.name.charAt(0).toUpperCase()}
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                                        {item.name}
                                    </ThemedText>
                                    <ThemedText style={{ color: textSecondary, fontSize: 14 }}>
                                        {item.phone || item.email || 'No contact info'}
                                    </ThemedText>
                                </View>

                                {/* Stub for Balance - To be implemented */}
                                <View style={{ alignItems: 'flex-end' }}>
                                    <ThemedText style={{ fontSize: 12, color: textSecondary }}>Balance</ThemedText>
                                    <ThemedText type="defaultSemiBold" style={{ color: 'green' }}>₹0.00</ThemedText>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: primary, shadowColor: primary }]}
                onPress={() => router.push({ pathname: '/contacts/create', params: { type } })}
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
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0', // Slate 200
        borderRadius: 24,
        padding: 4,
        marginBottom: 20,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
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
        alignItems: 'center', // Center vertically
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc', // Dynamic color?
        justifyContent: 'center',
        alignItems: 'center',
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
