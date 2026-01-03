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
import { useThemeColor } from '@/hooks/useThemeColor';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [connectionStatus, setConnectionStatus] = useState<string>('');

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const errorColor = useThemeColor({}, 'error');
    const successColor = useThemeColor({}, 'success');

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
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: primaryLight }]}>
                            <Image
                                source={require('../../../assets/images/revenew-logo.svg')}
                                style={{ width: 48, height: 48, resizeMode: 'contain' }}
                            />
                        </View>
                        <ThemedText type="title" style={styles.title}>revenew</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>Boost your revenue easily & in time</ThemedText>
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
                            <ThemedText style={{ color: textSecondary }}>Don't have an account? </ThemedText>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <ThemedText type="defaultSemiBold" style={{ color: primary }}>Sign Up</ThemedText>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>

                    {/* Diagnostic Section */}
                    <View style={styles.diagnostic}>
                        <TouchableOpacity onPress={checkConnection} style={styles.diagnosticBtn}>
                            <ThemedText style={{ color: textSecondary, fontSize: 12, textDecorationLine: 'underline' }}>
                                Test Connection
                            </ThemedText>
                        </TouchableOpacity>
                        {connectionStatus ? (
                            <Text style={{ color: connectionStatus.includes('Error') ? errorColor : successColor, marginTop: 5, textAlign: 'center', fontSize: 12 }}>
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
    diagnostic: {
        marginTop: 40,
        alignItems: 'center',
    },
    diagnosticBtn: {
        padding: 8,
    },
});
