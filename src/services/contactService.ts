import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export interface Contact {
    id: string;
    shop_id: string;
    name: string;
    type: 'customer' | 'supplier';
    phone?: string;
    email?: string;
    address?: string;
    created_at?: string;
}

export const getContacts = async (type?: 'customer' | 'supplier') => {
    const shopId = await getCurrentShopId();
    if (!shopId) return [];

    let query = supabase
        .from('contacts')
        .select('*')
        .eq('shop_id', shopId)
        .order('name', { ascending: true });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Contact[];
};

export const createContact = async (contact: Omit<Contact, 'id' | 'shop_id' | 'created_at'>) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    const { data, error } = await supabase
        .from('contacts')
        .insert([{ ...contact, shop_id: shopId }])
        .select()
        .single();

    if (error) throw error;
    return data as Contact;
};

export const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Contact;
};

export const deleteContact = async (id: string) => {
    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const getContactById = async (id: string) => {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Contact;
};

export const getContactTransactions = async (contactId: string, type: 'customer' | 'supplier') => {
    const shopId = await getCurrentShopId();
    if (!shopId) return [];

    let data: any[] = [];
    let error = null;

    if (type === 'customer') {
        const result = await supabase
            .from('sales')
            .select('id, created_at, total_amount')
            .eq('contact_id', contactId)
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });
        data = result.data || [];
        error = result.error;
    } else {
        const result = await supabase
            .from('purchases')
            .select('id, created_at, total_cost')
            .eq('contact_id', contactId)
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });
        data = result.data || [];
        error = result.error;
    }

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        date: item.created_at,
        amount: type === 'customer' ? item.total_amount : item.total_cost,
        type: type === 'customer' ? 'sale' : 'purchase',
        status: 'completed'
    }));
};
