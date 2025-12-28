import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export interface Product {
    id: string;
    shop_id: string;
    name: string;
    category?: string;
    unit?: string;
    is_active: boolean;
    created_at: string;
}

export const fetchProducts = async () => {
    // RLS filters by shop automatically
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Product[];
};

export const createProduct = async (product: Pick<Product, 'name' | 'category' | 'unit'>) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('No shop found for current user');

    const { data, error } = await supabase
        .from('products')
        .insert([{
            ...product,
            shop_id: shopId,
            is_active: true
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

