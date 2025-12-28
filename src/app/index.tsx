import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '../services/supabase';

export default function Index() {
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Should theoretically be handled by _layout redirecting to (auth),
                    // but if we are here, just stop loading.
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" which is fine (no shop yet)
                    console.error('Error fetching profile:', error);
                }

                setShopId(data?.shop_id ?? null);
            } catch (e) {
                console.error('Unexpected error in index:', e);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                <ActivityIndicator size="large" />
                <Text style={{ color: '#666' }}>Loading your shop...</Text>
            </View>
        );
    }

    if (!shopId) {
        return <Redirect href="/(setup)/create-shop" />;
    }

    return <Redirect href="/(tabs)/dashboard" />;
}
