import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // Auto-login successful (Email confirmation disabled)

                // Create profile row manually (in case DB trigger is missing)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user?.id,
                        name: email.split('@')[0], // Default name
                        role: 'owner'
                    }]);

                if (profileError) {
                    console.log('Profile creation note:', profileError.message);
                }

                router.replace('/');
            } else {
                // Email confirmation required
                Alert.alert('Success', 'Please check your email to confirm your account.');
                router.replace('/(auth)/login');
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
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
                            <Ionicons name="person-add" size={40} color={primary} />
                        </View>
                        <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
                        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>Get started with MyShop Pro</ThemedText>
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
                            title="Sign Up"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.marginTop}
                        />

                        <View style={styles.footer}>
                            <ThemedText style={{ color: textSecondary }}>Already have an account? </ThemedText>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <ThemedText type="defaultSemiBold" style={{ color: primary }}>Sign In</ThemedText>
                                </TouchableOpacity>
                            </Link>
                        </View>
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
});
