import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export interface Expense {
    id: string;
    shop_id: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
    created_at: string;
}

export const addExpense = async (amount: number, category: string, description: string, date?: string) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    const { data, error } = await supabase
        .from('expenses')
        .insert([{
            shop_id: shopId,
            amount,
            category,
            description,
            date: date || new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchExpenses = async () => {
    const shopId = await getCurrentShopId();
    if (!shopId) return [];

    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', shopId)
        .order('date', { ascending: false });

    if (error) throw error;
    return data as Expense[];
};

export const deleteExpense = async (id: string) => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
