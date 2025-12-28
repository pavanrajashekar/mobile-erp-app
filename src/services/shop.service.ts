import { supabase } from './supabase';

export const createShop = async (name: string, businessType: string) => {
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) throw new Error('Not authenticated');

    const { data: shop, error } = await supabase
        .from('shops')
        .insert({
            name,
            business_type: businessType,
            owner_id: user.id
        })
        .select()
        .single();

    if (error) throw error;

    // update profile with shop_id
    await supabase
        .from('profiles')
        .update({ shop_id: shop.id })
        .eq('id', user.id);

    return shop;
};
