import { View, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getCurrentShopId } from '@/services/shopService';
import { supabase } from '@/services/supabase';
import ThemedText from '@/components/ThemedText';
import Card from '@/components/Card';
import Avatar from '@/components/Avatar';

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await signOut();
                    } catch (error: any) {
                        Alert.alert('Error', error.message);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const SettingsItem = ({ icon, label, value, onPress, isDestructive = false }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={[styles.itemIcon, { backgroundColor: isDestructive ? Colors.errorLight : Colors.surfaceSubtle }]}>
                <Ionicons name={icon} size={20} color={isDestructive ? Colors.error : Colors.primary} />
            </View>
            <View style={styles.itemContent}>
                <ThemedText type="default" style={{ color: isDestructive ? Colors.error : Colors.textSecondary, fontSize: 13 }}>{label}</ThemedText>
                {value && <ThemedText type="defaultSemiBold" style={{ color: Colors.text }}>{value}</ThemedText>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.disabled} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>

                {/* Header with Close Button */}
                <View style={styles.header}>
                    <ThemedText type="subtitle">Profile</ThemedText>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Profile Hero */}
                    <View style={styles.hero}>
                        <Avatar name={user?.user_metadata?.full_name || user?.email} size={52} />
                        <View style={{ flex: 1 }}>
                            <ThemedText type="title" style={{ fontSize: 22 }}>{user?.user_metadata?.full_name || 'Admin User'}</ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <ThemedText type="default" style={{ color: Colors.textSecondary }}>{user?.email}</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Shop Info Section */}
                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>Workspace</ThemedText>
                        <Card style={styles.card}>
                            <SettingsItem
                                icon="business"
                                label="Shop Name"
                                value={shop?.name || 'Loading...'}
                                onPress={() => { }}
                            />
                            <View style={styles.divider} />
                            <SettingsItem
                                icon="pricetags"
                                label="Business Type"
                                value={shop?.business_type ? shop.business_type.charAt(0).toUpperCase() + shop.business_type.slice(1) : 'Retail'}
                                onPress={() => { }}
                            />
                        </Card>
                    </View>

                    {/* App Settings */}
                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>App Settings</ThemedText>
                        <Card style={styles.card}>
                            <SettingsItem icon="notifications-outline" label="Notifications" onPress={() => { }} />
                            <View style={styles.divider} />
                            <SettingsItem icon="lock-closed-outline" label="Privacy & Security" onPress={() => { }} />
                            <View style={styles.divider} />
                            <SettingsItem icon="help-circle-outline" label="Help & Support" onPress={() => { }} />
                        </Card>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.section}>
                        <Card style={styles.card}>
                            <SettingsItem
                                icon="log-out-outline"
                                label="Log Out"
                                isDestructive
                                onPress={handleLogout}
                            />
                        </Card>
                    </View>

                    <ThemedText type="caption" style={{ textAlign: 'center', marginTop: 20, marginBottom: 40 }}>
                        Version 1.0.0 • MyShop Pro
                    </ThemedText>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        padding: 4,
        backgroundColor: Colors.surfaceSubtle,
        borderRadius: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 8,
        marginLeft: 4,
        color: Colors.textSecondary,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        padding: 0,
        borderRadius: 16,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
        gap: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginLeft: 68,
    }
});
