import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Get started with Mobile ERP</Text>

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
                    title="Sign Up"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.marginTop}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
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
        gap: 0, // Inputs have their own margin bottom
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
});
