import { View, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Contact, getContactById, getContactTransactions } from '@/services/contactService';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import Avatar from '@/components/Avatar';

export default function ContactDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [contact, setContact] = useState<Contact | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalAmount: 0, balance: 0 });

    // Filters
    const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'year'>('month');

    const timeOptions: ('all' | 'month' | 'year')[] = ['all', 'month', 'year'];

    const router = useRouter();
    const { theme } = useTheme();
    const activeColors = Colors[theme];

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const contactData = await getContactById(id);
            setContact(contactData);

            const txData = await getContactTransactions(id, contactData.type);
            setTransactions(txData);

            const total = txData.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
            setStats({
                totalAmount: total,
                balance: 0
            });

        } catch (error) {
            console.error('Error fetching contact:', error);
            Alert.alert('Error', 'Failed to load contact details');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const handleOptions = () => {
        Alert.alert(
            'Options',
            'Choose an action',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Edit Contact',
                    onPress: () => router.push({ pathname: '/contacts/create', params: { id: contact?.id, type: contact?.type } })
                },
                {
                    text: 'Delete Contact',
                    onPress: () => Alert.alert('Delete', 'Delete functionality coming soon.', [{ text: 'OK' }]),
                    style: 'destructive'
                }
            ]
        );
    };

    const handleCall = () => {
        if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
    };

    const handleEmail = () => {
        if (contact?.email) Linking.openURL(`mailto:${contact.email}`);
    };

    const handleWhatsApp = () => {
        if (contact?.phone) {
            const phone = contact.phone.replace(/\D/g, '');
            Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() => {
                Linking.openURL(`https://wa.me/${phone}`);
            });
        }
    };

    const cycleTimeFilter = () => {
        const currentIndex = timeOptions.indexOf(timeFilter);
        const nextIndex = (currentIndex + 1) % timeOptions.length;
        setTimeFilter(timeOptions[nextIndex]);
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={activeColors.primary} />
            </View>
        );
    }

    if (!contact) {
        return (
            <View style={[styles.centered, { backgroundColor: activeColors.background }]}>
                <ThemedText>Contact not found</ThemedText>
            </View>
        );
    }

    const filteredTransactions = transactions.filter(tx => {
        const typeMatch = typeFilter === 'all' || tx.type === typeFilter;
        let timeMatch = true;
        if (timeFilter !== 'all') {
            const txDate = new Date(tx.date);
            const now = new Date();
            if (timeFilter === 'month') {
                timeMatch = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (timeFilter === 'year') {
                timeMatch = txDate.getFullYear() === now.getFullYear();
            }
        }
        return typeMatch && timeMatch;
    });

    const isCustomer = contact.type === 'customer';
    const brandColor = isCustomer ? '#F59E0B' : '#9333EA';
    const brandBg = isCustomer ? 'rgba(245, 158, 11, 0.1)' : 'rgba(147, 51, 234, 0.1)';

    const renderTransaction = (item: any) => {
        const isSale = item.type === 'sale';
        const typeLabel = isSale ? 'Sale' : 'Purchase';
        const icon = isSale ? 'arrow-down-circle' : 'arrow-up-circle';

        return (
            <TouchableOpacity key={item.id} style={[styles.historyItem, { borderBottomColor: activeColors.border }]} activeOpacity={0.7}>
                <View style={styles.historyLeft}>
                    <View style={[styles.historyIcon, { backgroundColor: activeColors.surfaceSubtle }]}>
                        <Ionicons name={icon} size={20} color={isSale ? activeColors.success : activeColors.error} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <ThemedText type="defaultSemiBold">{typeLabel}</ThemedText>
                        <ThemedText style={{ fontSize: 12, color: activeColors.textSecondary }}>{new Date(item.date).toLocaleDateString()}</ThemedText>
                    </View>
                </View>
                <ThemedText type="defaultSemiBold" style={{ color: isSale ? activeColors.success : activeColors.text }}>
                    ₹{Number(item.amount).toLocaleString()}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={activeColors.text} />
                </TouchableOpacity>
                <ThemedText type="subtitle">Details</ThemedText>
                {/* Options Menu Button Replacing Edit Button */}
                <TouchableOpacity onPress={handleOptions} style={styles.headerBtn}>
                    <Ionicons name="ellipsis-vertical" size={24} color={activeColors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: brandColor }]}>
                            <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>{contact.name.slice(0, 2).toUpperCase()}</ThemedText>
                        </View>
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <ThemedText type="title" style={{ fontSize: 22 }}>{contact.name}</ThemedText>
                                <View style={[styles.tag, { backgroundColor: brandBg }]}>
                                    <ThemedText style={[styles.tagText, { color: brandColor }]}>{isCustomer ? 'Customer' : 'Supplier'}</ThemedText>
                                </View>
                            </View>
                            {contact.address && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <Ionicons name="location-outline" size={14} color={activeColors.textSecondary} style={{ marginRight: 2 }} />
                                    <ThemedText style={{ fontSize: 13, color: activeColors.textSecondary }} numberOfLines={1}>
                                        {contact.address}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: activeColors.border, marginVertical: 20 }]} />

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <ThemedText style={{ fontSize: 12, color: activeColors.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                                {isCustomer ? 'Receivables' : 'Payables'}
                            </ThemedText>
                            <ThemedText type="title" style={{ fontSize: 24, color: isCustomer ? activeColors.success : activeColors.error }}>
                                ₹{stats.balance.toLocaleString()}
                            </ThemedText>
                        </View>

                        <View style={[styles.verticalDivider, { backgroundColor: activeColors.border }]} />

                        <View style={styles.statItem}>
                            <ThemedText style={{ fontSize: 12, color: activeColors.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                                Total Volume
                            </ThemedText>
                            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
                                ₹{stats.totalAmount.toLocaleString()}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {(contact.phone || contact.email) && (
                    <View style={styles.actionRow}>
                        {contact.phone && (
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]} onPress={handleCall}>
                                <Ionicons name="call" size={24} color={activeColors.primary} />
                            </TouchableOpacity>
                        )}
                        {contact.phone && (
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]} onPress={handleWhatsApp}>
                                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            </TouchableOpacity>
                        )}
                        {contact.email && (
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor }]} onPress={handleEmail}>
                                <Ionicons name="mail" size={24} color={activeColors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.filterRow}>
                    <View style={[styles.segmentContainer, { backgroundColor: '#e2e8f0' }]}>
                        {(['all', 'sale', 'purchase'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setTypeFilter(f)}
                                activeOpacity={0.7}
                                style={[
                                    styles.segmentButton,
                                    typeFilter === f && styles.segmentButtonActive
                                ]}
                            >
                                <ThemedText style={[
                                    styles.segmentText,
                                    typeFilter === f ? { color: activeColors.primary, fontWeight: '700' } : { color: activeColors.textSecondary, fontWeight: '500' }
                                ]}>
                                    {f === 'all' ? 'All' : f === 'sale' ? 'Sales' : 'Payments'}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.timePill, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={cycleTimeFilter}
                    >
                        <ThemedText style={{ fontSize: 13, color: activeColors.text, marginRight: 4, textTransform: 'capitalize' }}>
                            {timeFilter === 'all' ? 'All Time' : timeFilter}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={14} color={activeColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.listContainer, { backgroundColor: activeColors.surface, shadowColor: activeColors.shadowColor, borderColor: activeColors.border }]}>
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(renderTransaction)
                    ) : (
                        <View style={styles.emptyState}>
                            <ThemedText style={{ color: activeColors.textSecondary, fontStyle: 'italic' }}>No transactions found</ThemedText>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerBtn: {
        padding: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16, // Reduced margin
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        width: '100%',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'flex-start',
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        height: 40,
        marginHorizontal: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    segmentContainer: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 24,
        padding: 4,
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
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
    },
    listContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
    },
});
