import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthScreen() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Theme Colors
    const backgroundColor = useThemeColor({}, 'background');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const surface = useThemeColor({}, 'surface');

    const toggleMode = (newMode: 'login' | 'signup') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMode(newMode);
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        if (mode === 'signup') {
            if (!name.trim()) {
                Alert.alert('Error', 'Please enter your name');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.replace('/');
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (error) throw error;

                if (data.session) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: data.user?.id,
                            name: name.trim(),
                            role: 'owner'
                        }]);

                    if (profileError) {
                        console.log('Profile creation note:', profileError.message);
                    }
                    router.replace('/');
                } else {
                    Alert.alert('Success', 'Please check your email to confirm your account.');
                    setMode('login');
                }
            }
        } catch (error: any) {
            Alert.alert(mode === 'login' ? 'Login Failed' : 'Registration Failed', error.message);
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
                        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
                            {mode === 'login' ? 'Welcome Back!' : 'Create your account'}
                        </ThemedText>
                    </View>

                    {/* Dashboard-style Toggle */}
                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
                            onPress={() => toggleMode('login')}
                            activeOpacity={0.9}
                        >
                            <ThemedText style={[styles.segmentText, mode === 'login' && { color: primary, fontWeight: '700' }]}>
                                Sign In
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentButton, mode === 'signup' && styles.segmentButtonActive]}
                            onPress={() => toggleMode('signup')}
                            activeOpacity={0.9}
                        >
                            <ThemedText style={[styles.segmentText, mode === 'signup' && { color: primary, fontWeight: '700' }]}>
                                Sign Up
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Card Form */}
                    <Card style={styles.formCard}>
                        {mode === 'signup' && (
                            <Input
                                label="Full Name"
                                value={name}
                                onChangeText={setName}
                                placeholder="Your Name"
                                icon="person-outline"
                            />
                        )}

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

                        {mode === 'signup' && (
                            <Input
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="********"
                                secureTextEntry
                                icon="lock-closed-outline"
                            />
                        )}

                        <Button
                            title={mode === 'login' ? "Sign In" : "Get Started"}
                            onPress={handleAuth}
                            loading={loading}
                            style={styles.marginTop}
                        />

                        {mode === 'login' && (
                            <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }}>
                                <ThemedText style={{ color: textSecondary, fontSize: 13 }}>Forgot Password?</ThemedText>
                            </TouchableOpacity>
                        )}
                    </Card>
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
        gap: 16,
    },
    marginTop: {
        marginTop: 8,
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
        color: '#64748b', // textSecondary-ish
    },
});
