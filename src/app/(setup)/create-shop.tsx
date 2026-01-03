import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
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

export default function CreateShopScreen() {
    const [name, setName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [shopId, setShopId] = useState('');
    const [accessCode, setAccessCode] = useState('');

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

            Alert.alert('Success', `Shop ${mode === 'create' ? 'created' : 'joined'} !Redirecting...`, [
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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="storefront" size={40} color={Colors.primary} />
                        </View>
                        <ThemedText type="title" style={styles.title}>Setup Your Shop</ThemedText>
                        <ThemedText style={styles.subtitle}>Create a new shop or join an existing one</ThemedText>
                    </View>

                    {/* Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, mode === 'create' && styles.toggleBtnActive]}
                            onPress={() => setMode('create')}
                        >
                            <ThemedText style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>Create New</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, mode === 'join' && styles.toggleBtnActive]}
                            onPress={() => setMode('join')}
                        >
                            <ThemedText style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>Join Existing</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <Card style={styles.formCard}>
                        {mode === 'create' ? (
                            <>
                                <Input
                                    label="Shop Name *"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. My Granite Store"
                                />

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Business Type</ThemedText>
                                    <View style={styles.typeContainer}>
                                        {['retail', 'stone', 'wine'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.typeBtn,
                                                    businessType === type && styles.typeBtnActive
                                                ]}
                                                onPress={() => setBusinessType(type)}
                                            >
                                                <ThemedText style={[
                                                    styles.typeText,
                                                    businessType === type && styles.typeTextActive
                                                ]}>
                                                    {type === 'stone' ? '🪨 Stone' : type === 'wine' ? '🍷 Wine' : '🛒 Retail'}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Input
                                        label="Admin Access Code *"
                                        value={accessCode}
                                        onChangeText={setAccessCode}
                                        placeholder="Enter Admin PIN"
                                        secureTextEntry
                                        keyboardType="numeric"
                                    />
                                    <ThemedText type="caption" style={styles.hint}>Required to create a new organization.</ThemedText>
                                </View>
                            </>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Input
                                    label="Shop ID *"
                                    value={shopId}
                                    onChangeText={setShopId}
                                    placeholder="Paste the Shop ID here"
                                    autoCapitalize="none"
                                />
                                <ThemedText type="caption" style={styles.hint}>Ask the shop owner for their ID</ThemedText>
                            </View>
                        )}

                        <Button
                            title={mode === 'create' ? 'Create Shop' : 'Join Shop'}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            style={{ marginTop: 20 }}
                        />
                    </Card>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: Colors.primaryLight,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        padding: 24,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: Colors.text,
        fontWeight: '500',
        marginBottom: 8,
    },
    logoutButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logoutText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '500',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.inputBackground,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    toggleTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    hint: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
    },
    typeBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    typeText: {
        fontWeight: '500',
        color: Colors.textSecondary,
        textTransform: 'capitalize',
        fontSize: 14,
    },
    typeTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
});
