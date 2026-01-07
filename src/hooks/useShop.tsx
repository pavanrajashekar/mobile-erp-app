import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from './useAuth';

interface ShopContextType {
    shopId: string | null;
    businessType: 'stone';
    loading: boolean;
    refreshShop: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({
    shopId: null,
    businessType: 'stone',
    loading: true,
    refreshShop: async () => { },
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [shopId, setShopId] = useState<string | null>(null);
    const [businessType, setBusinessType] = useState<'stone'>('stone');
    const [loading, setLoading] = useState(true);

    const loadShop = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // 1. Get Shop ID from Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('shop_id')
                .eq('id', user.id)
                .single();

            if (profile?.shop_id) {
                setShopId(profile.shop_id);
                // We enforce stone business type for the app logic
                setBusinessType('stone');
            } else {
                setShopId(null);
                setBusinessType('stone');
            }
        } catch (error) {
            console.error('Error loading shop context:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShop();
    }, [user]);

    return (
        <ShopContext.Provider value={{ shopId, businessType, loading, refreshShop: loadShop }}>
            {children}
        </ShopContext.Provider>
    );
}

export const useShop = () => useContext(ShopContext);
