import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="cart" size={40} color={Colors.primary} />
                        </View>
                        <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
                        <ThemedText style={styles.subtitle}>Sign in to manage your shop</ThemedText>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon="mail-outline"
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="********"
                            secureTextEntry
                            icon="lock-closed-outline"
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.marginTop}
                        />

                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <ThemedText type="defaultSemiBold" style={styles.link}>Sign Up</ThemedText>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>

                    {/* Diagnostic Section */}
                    <View style={styles.diagnostic}>
                        <TouchableOpacity onPress={checkConnection} style={styles.diagnosticBtn}>
                            <ThemedText style={styles.diagnosticLink}>
                                Test Connection
                            </ThemedText>
                        </TouchableOpacity>
                        {connectionStatus ? (
                            <Text style={{ color: connectionStatus.includes('Error') ? Colors.error : 'green', marginTop: 5, textAlign: 'center', fontSize: 12 }}>
                                {connectionStatus}
                            </Text>
                        ) : null}
                    </View>
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
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: Colors.primaryLight, // Ensure this exists or use rgba
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
    form: {
        gap: 16,
    },
    marginTop: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Colors.textSecondary,
    },
    link: {
        color: Colors.primary,
    },
    diagnostic: {
        marginTop: 40,
        alignItems: 'center',
    },
    diagnosticBtn: {
        padding: 8,
    },
    diagnosticLink: {
        color: Colors.textSecondary,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
});
