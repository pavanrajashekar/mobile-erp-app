import { supabase } from './supabase';

export const getCurrentShopId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching shop ID:', error);
        return null;
    }

    return data?.shop_id || null;
};

export const createShop = async (name: string, businessType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // 1. Create Shop
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert([{
            name,
            business_type: businessType,
            owner_id: user.id
        }])
        .select()
        .single();

    if (shopError) throw shopError;

    // 2. Link Shop to Profile
    // We use upsert to ensure the profile exists even if the trigger failed/didn't run.
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            shop_id: shop.id,
            name: user.email?.split('@')[0] || 'Shop Owner', // Fallback for new rows
            role: 'owner'
        }, { onConflict: 'id' }); // Upsert based on pointing to the Primary Key 'id'

    if (profileError) throw profileError;

    return shop;
};

export const joinShop = async (shopId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // 1. Verify Shop Exists
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .single();

    if (shopError || !shop) throw new Error('Invalid Shop ID. Please check and try again.');

    // 2. Link Profile to Shop (as Employee)
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            shop_id: shop.id,
            name: user.email?.split('@')[0] || 'Employee',
            role: 'employee' // Default role for joiners
        }, { onConflict: 'id' });

    if (profileError) throw profileError;

    return shop;
};
