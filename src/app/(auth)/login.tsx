import { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [connectionStatus, setConnectionStatus] = useState<string>('');

    const checkConnection = async () => {
        setConnectionStatus('Checking...');
        try {
            const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
            if (error) throw error;
            setConnectionStatus('Connected to Supabase ✅');
        } catch (err: any) {
            setConnectionStatus(`Connection Error ❌: ${err.message}`);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Force navigation to ensure we don't depend solely on the listener
            // The root layout will eventually update, but this makes the UI responsive immediately.
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
            setConnectionStatus(`Login Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mobile ERP</Text>
            <Text style={styles.subtitle}>Sign in to your shop</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="********"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Diagnostic Section */}
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <TouchableOpacity onPress={checkConnection} style={{ padding: 10 }}>
                        <Text style={{ color: '#666', textDecorationLine: 'underline' }}>
                            Test Connection
                        </Text>
                    </TouchableOpacity>
                    {connectionStatus ? (
                        <Text style={{ color: connectionStatus.includes('Error') ? 'red' : 'green', marginTop: 5, textAlign: 'center' }}>
                            {connectionStatus}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#007AFF',
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
