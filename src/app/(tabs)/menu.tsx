import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/services/supabase';

interface MenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    route: string;
    category: 'Operations' | 'Management' | 'Account';
}

const MENU_ITEMS: MenuItem[] = [
    // Operations
    {
        id: '1',
        title: 'Transactions',
        subtitle: 'Sales & Purchases History',
        icon: 'list',
        color: '#10B981', // Emerald
        route: '/sales',
        category: 'Operations',
    },
    {
        id: '2',
        title: 'Billing',
        subtitle: 'Create New Invoice',
        icon: 'receipt-outline',
        color: '#3B82F6', // Blue
        route: '/billing',
        category: 'Operations',
    },
    {
        id: '3',
        title: 'Quick Quote',
        subtitle: 'Generate Estimates',
        icon: 'calculator-outline',
        color: '#8B5CF6', // Violet
        route: '/quick-quote',
        category: 'Operations',
    },
    // Management
    {
        id: '4',
        title: 'Products',
        subtitle: 'Manage Inventory',
        icon: 'cube-outline',
        color: '#F59E0B', // Amber
        route: '/products',
        category: 'Management',
    },
    {
        id: '5',
        title: 'Contacts',
        subtitle: 'Customers & Suppliers',
        icon: 'people-outline',
        color: '#EC4899', // Pink
        route: '/contacts',
        category: 'Management',
    },
    // Account
    {
        id: '6',
        title: 'Profile',
        subtitle: 'Shop Settings',
        icon: 'person-outline',
        color: '#64748B', // Slate
        route: '/profile',
        category: 'Account',
    },
];

export default function MenuScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const primary = useThemeColor({}, 'primary');

    const handlePress = (route: string) => {
        router.push(route as any);
    };

    const handleLogout = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/(auth)/login');
                }
            }
        ]);
    };

    const filteredItems = MENU_ITEMS.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedItems = {
        Operations: filteredItems.filter(i => i.category === 'Operations'),
        Management: filteredItems.filter(i => i.category === 'Management'),
        Account: filteredItems.filter(i => i.category === 'Account'),
    };

    const renderMenuCard = (item: MenuItem) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: surface, borderColor: border }]}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{item.title}</ThemedText>
                <ThemedText style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>{item.subtitle}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor }]}>

            {/* Header */}
            <View style={styles.header}>
                <ThemedText type="title" style={{ fontSize: 28 }}>Menu</ThemedText>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: '#e2e8f0' }]}>
                    <Ionicons name="search" size={20} color="#64748b" />
                    <TextInput
                        placeholder="Search actions..."
                        value={searchQuery}
                        onChangeText={(text) => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSearchQuery(text);
                        }}
                        style={styles.input}
                        placeholderTextColor="#94a3b8"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {groupedItems.Operations.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Operations</ThemedText>
                        <View style={styles.grid}>
                            {groupedItems.Operations.map(renderMenuCard)}
                        </View>
                    </View>
                )}

                {groupedItems.Management.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Management</ThemedText>
                        <View style={styles.grid}>
                            {groupedItems.Management.map(renderMenuCard)}
                        </View>
                    </View>
                )}

                {groupedItems.Account.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>
                        <View style={styles.grid}>
                            {groupedItems.Account.map(renderMenuCard)}
                        </View>
                    </View>
                )}

                {filteredItems.length === 0 && (
                    <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                        <Ionicons name="search-outline" size={48} color={textSecondary} />
                        <ThemedText style={{ marginTop: 10, color: textSecondary }}>No results found</ThemedText>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.logoutBtn, { borderColor: border }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <ThemedText style={{ color: '#EF4444', fontWeight: '600' }}>Log Out</ThemedText>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        gap: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 16,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        height: '100%',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#94a3b8', // slate 400
        marginBottom: 12,
        marginLeft: 4,
    },
    grid: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12, // slightly smaller vertical padding for density
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        // mild shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 20,
        borderStyle: 'dashed',
    }
});
