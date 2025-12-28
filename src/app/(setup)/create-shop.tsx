import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createShop, joinShop } from '@/services/shopService';
import { supabase } from '@/services/supabase';

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
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Setup Your Shop</Text>

                {/* Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'create' && styles.toggleBtnActive]}
                        onPress={() => setMode('create')}
                    >
                        <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>Create New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'join' && styles.toggleBtnActive]}
                        onPress={() => setMode('join')}
                    >
                        <Text style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>Join Existing</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {mode === 'create' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Shop Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. My Granite Store"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Business Type</Text>
                                <TextInput
                                    style={styles.input}
                                    value={businessType}
                                    onChangeText={setBusinessType}
                                    placeholder="e.g. Retail, Wholesale"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Admin Access Code *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={accessCode}
                                    onChangeText={setAccessCode}
                                    placeholder="Enter Admin PIN"
                                    secureTextEntry
                                    keyboardType="numeric"
                                />
                                <Text style={styles.hint}>Required to create a new organization.</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Shop ID *</Text>
                            <TextInput
                                style={styles.input}
                                value={shopId}
                                onChangeText={setShopId}
                                placeholder="Paste the Shop ID here"
                                autoCapitalize="none"
                            />
                            <Text style={styles.hint}>Ask the shop owner for their ID</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {mode === 'create' ? 'Create Shop' : 'Join Shop'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        justifyContent: 'space-between', // Push logout to bottom
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '500',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontWeight: '500',
        color: '#666',
    },
    toggleTextActive: {
        color: '#007AFF',
        fontWeight: '700',
    },
    hint: {
        fontSize: 12,
        color: '#999',
    },
});
