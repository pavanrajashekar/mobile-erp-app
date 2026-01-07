import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createShop, joinShop } from '@/services/shopService';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function CreateShopScreen() {
    const [name, setName] = useState('');
    const [businessType] = useState('stone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [shopId, setShopId] = useState('');
    const [accessCode, setAccessCode] = useState('');

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');

    const toggleMode = (newMode: 'create' | 'join') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMode(newMode);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                if (!name.trim()) {
                    Alert.alert('Error', 'Shop name is required');
                    setIsSubmitting(false);
                    return;
                }
                // Security Check
                if (accessCode !== '123456') {
                    Alert.alert('Access Denied', 'Incorrect Admin Access Code. Only authorized admins can create new shops.');
                    setIsSubmitting(false);
                    return;
                }

                console.log('Creating shop...');
                await createShop(name.trim(), businessType.trim());
            } else {
                if (!shopId.trim()) {
                    Alert.alert('Error', 'Shop ID is required');
                    setIsSubmitting(false);
                    return;
                }
                console.log('Joining shop...');
                await joinShop(shopId.trim());
            }

            Alert.alert('Success', `Shop ${mode === 'create' ? 'created' : 'joined'}! Redirecting...`, [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error: any) {
            console.error('Shop Setup Error:', error);
            Alert.alert('Failed', error.message || 'Unknown error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: primaryLight }]}>
                            <Ionicons name="storefront" size={40} color={primary} />
                        </View>
                        <ThemedText type="title" style={styles.title}>Setup Business</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
                            {mode === 'create' ? 'Launch your new digital store' : 'Join your team workspace'}
                        </ThemedText>
                    </View>

                    {/* Dashboard-style Toggle */}
                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            style={[styles.segmentButton, mode === 'create' && styles.segmentButtonActive]}
                            onPress={() => toggleMode('create')}
                            activeOpacity={0.9}
                        >
                            <ThemedText style={[styles.segmentText, mode === 'create' && { color: primary, fontWeight: '700' }]}>
                                Create Shop
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentButton, mode === 'join' && styles.segmentButtonActive]}
                            onPress={() => toggleMode('join')}
                            activeOpacity={0.9}
                        >
                            <ThemedText style={[styles.segmentText, mode === 'join' && { color: primary, fontWeight: '700' }]}>
                                Join Shop
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Card Form - Matching Login Style */}
                    <Card style={styles.formCard}>
                        {mode === 'create' ? (
                            <>
                                <Input
                                    label="Shop Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. My Granite Store"
                                    icon="business"
                                />

                                <View>
                                    <Input
                                        label="Admin Access Code"
                                        value={accessCode}
                                        onChangeText={setAccessCode}
                                        placeholder="Enter Admin PIN"
                                        secureTextEntry
                                        keyboardType="numeric"
                                        icon="shield-checkmark"
                                    />
                                    <ThemedText type="caption" style={styles.hint}>Required to create a new organization.</ThemedText>
                                </View>
                            </>
                        ) : (
                            <View>
                                <Input
                                    label="Shop ID"
                                    value={shopId}
                                    onChangeText={setShopId}
                                    placeholder="Paste the Shop ID here"
                                    autoCapitalize="none"
                                    icon="key"
                                />
                                <ThemedText type="caption" style={styles.hint}>Ask the shop owner for their ID</ThemedText>
                            </View>
                        )}

                        <Button
                            title={mode === 'create' ? 'Create Shop' : 'Join Shop'}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            style={{ marginTop: 8 }}
                        />
                    </Card>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <ThemedText style={[styles.logoutText, { color: textSecondary }]}>Sign Out</ThemedText>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    formCard: {
        padding: 24,
        gap: 20,
    },

    // Dashboard Toggle Style
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0', // Slate 200
        borderRadius: 24,
        padding: 4,
        marginBottom: 24,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
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
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },

    hint: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 6,
        marginLeft: 4,
    },
    logoutButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});
