import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';

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
                <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry
                />

                <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.marginTop}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Diagnostic Section */}
                <View style={styles.diagnostic}>
                    <TouchableOpacity onPress={checkConnection} style={{ padding: 10 }}>
                        <Text style={styles.diagnosticLink}>
                            Test Connection
                        </Text>
                    </TouchableOpacity>
                    {connectionStatus ? (
                        <Text style={{ color: connectionStatus.includes('Error') ? Colors.error : 'green', marginTop: 5, textAlign: 'center' }}>
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
        backgroundColor: Colors.background,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        gap: 0,
    },
    marginTop: {
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    link: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    diagnostic: {
        marginTop: 20,
        alignItems: 'center',
    },
    diagnosticLink: {
        color: Colors.textSecondary,
        textDecorationLine: 'underline',
    },
});
