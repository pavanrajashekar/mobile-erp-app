import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth'; // Assuming we have this hook
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getCurrentShopId } from '@/services/shopService';
import { supabase } from '@/services/supabase';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditingType, setIsEditingType] = useState(false);

    useEffect(() => {
        fetchShopDetails();
    }, []);

    const fetchShopDetails = async () => {
        try {
            const shopId = await getCurrentShopId();
            if (shopId) {
                const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
                setShop(data);
            }
        } catch (error) {
            console.log('Error fetching shop:', error);
        }
    };

    const updateShopType = async (type: string) => {
        try {
            const { error } = await supabase
                .from('shops')
                .update({ business_type: type })
                .eq('id', shop.id);

            if (error) throw error;

            setShop({ ...shop, business_type: type });
            setIsEditingType(false);
            Alert.alert('Success', `Business type updated to ${type}`);
        } catch (error: any) {
            Alert.alert('Update Failed', error.message);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut();
            // Auth hook or listener will handle redirect, but we can force it
            // router.replace('/(auth)/login'); 
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={40} color={Colors.primary} />
                    </View>
                    <ThemedText type="title" style={{ fontSize: 24 }}>{user?.email}</ThemedText>
                    <ThemedText type="caption">Owner</ThemedText>
                </View>

                <Card style={styles.card}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Shop Information</ThemedText>

                    <View style={styles.infoRow}>
                        <ThemedText style={styles.label}>Shop Name</ThemedText>
                        <ThemedText type="defaultSemiBold">{shop?.name || 'Loading...'}</ThemedText>
                    </View>

                    <View style={styles.infoRow}>
                        <ThemedText style={styles.label}>Business Type</ThemedText>
                        {!isEditingType ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ThemedText type="defaultSemiBold">
                                    {shop?.business_type ? shop.business_type.charAt(0).toUpperCase() + shop.business_type.slice(1) : 'Retail'}
                                </ThemedText>
                                <TouchableOpacity onPress={() => setIsEditingType(true)}>
                                    <Ionicons name="pencil" size={16} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={styles.typeContainer}>
                                    {['retail', 'stone', 'wine'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.typeBtn,
                                                shop?.business_type === type && styles.typeBtnActive
                                            ]}
                                            onPress={() => updateShopType(type)}
                                        >
                                            <Text style={[
                                                styles.typeText,
                                                shop?.business_type === type && styles.typeTextActive
                                            ]}>
                                                {type === 'stone' ? '🪨' : type === 'wine' ? '🍷' : '🛒'} {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    style={{ alignSelf: 'flex-end', marginTop: 4 }}
                                    onPress={() => setIsEditingType(false)}
                                >
                                    <Text style={{ color: Colors.error, fontSize: 12 }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <ThemedText style={styles.label}>Shop ID</ThemedText>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            onPress={() => {
                                Alert.alert('Shop ID', shop?.id || '', [{ text: 'OK' }]);
                            }}
                        >
                            <Text style={styles.valueID}>{shop?.id?.substring(0, 12)}...</Text>
                            <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.actions}>
                    <Button
                        title="Logout"
                        onPress={handleLogout}
                        loading={loading}
                        variant="outline"
                        style={{ borderColor: Colors.error }}
                        textStyle={{ color: Colors.error }}
                    />
                </View>

                <View style={styles.footer}>
                    <ThemedText type="caption">Version 1.0.0</ThemedText>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    card: {
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    label: {
        color: Colors.textSecondary,
    },
    actions: {
        marginTop: 20,
        marginBottom: 20,
    },
    footer: {
        alignItems: 'center',
    },
    valueID: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: Colors.textSecondary,
        backgroundColor: Colors.inputBackground,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    typeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    typeBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: '#e3f2fd',
    },
    typeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        textTransform: 'capitalize',
    },
    typeTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
});
