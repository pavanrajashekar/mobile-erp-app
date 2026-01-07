import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createContact, getContactById, updateContact } from '@/services/contactService';

export default function CreateContactScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ type?: 'customer' | 'supplier', id?: string }>();
    const isEditing = !!params.id;

    const [name, setName] = useState('');
    const [type, setType] = useState<'customer' | 'supplier'>(params.type || 'customer');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const [loading, setLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const surface = useThemeColor({}, 'surface');
    const primary = useThemeColor({}, 'primary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        if (isEditing && params.id) {
            loadContact(params.id);
        }
    }, [params.id]);

    const loadContact = async (id: string) => {
        try {
            const data = await getContactById(id);
            if (data) {
                setName(data.name);
                setType(data.type);
                setPhone(data.phone || '');
                setEmail(data.email || '');
                setAddress(data.address || '');
            }
        } catch (error) {
            console.error('Error loading contact:', error);
            Alert.alert('Error', 'Failed to load contact details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const contactData = {
                name,
                type,
                phone,
                email,
                address
            };

            if (isEditing && params.id) {
                await updateContact(params.id, contactData);
                Alert.alert('Success', 'Contact Updated', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                await createContact(contactData);
                Alert.alert('Success', `${type === 'customer' ? 'Customer' : 'Supplier'} Created`, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <ThemedText type="subtitle">{isEditing ? 'Edit Contact' : `New ${type === 'customer' ? 'Customer' : 'Supplier'}`}</ThemedText>
                <View style={{ width: 40 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Type Switcher */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        onPress={() => setType('customer')}
                        activeOpacity={0.7}
                        style={[
                            styles.segmentButton,
                            type === 'customer' && styles.segmentButtonActive
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.segmentText,
                                type === 'customer' ? { color: primary, fontWeight: '700' } : { color: textSecondary, fontWeight: '500' }
                            ]}
                        >
                            Customer
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setType('supplier')}
                        activeOpacity={0.7}
                        style={[
                            styles.segmentButton,
                            type === 'supplier' && styles.segmentButtonActive
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.segmentText,
                                type === 'supplier' ? { color: primary, fontWeight: '700' } : { color: textSecondary, fontWeight: '500' }
                            ]}
                        >
                            Supplier
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={[styles.form, { backgroundColor: surface, borderColor: border, borderWidth: 1 }]}>
                    <Input
                        label="Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                    />

                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+91..."
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Address"
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Address"
                        multiline
                        numberOfLines={3}
                    />

                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
                <Button
                    title={isEditing ? "Update Contact" : "Create Contact"}
                    onPress={handleSave}
                    loading={isSubmitting}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBtn: {
        padding: 8,
    },
    content: {
        padding: 16,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0', // Slate 200
        borderRadius: 24,
        padding: 4,
        marginBottom: 20,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
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
    },
    form: {
        gap: 16,
        padding: 20,
        borderRadius: 20,
    },
    footer: {
        padding: 16,
        paddingBottom: 24, // Extra padding for safety
        borderTopWidth: 1,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
});
