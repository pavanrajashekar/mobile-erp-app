import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export interface Product {
    id: string;
    shop_id: string;
    name: string;
    category?: string;
    unit?: string;
    price?: number;
    cost_price?: number; // Added
    current_stock?: number;
    is_active: boolean;
    created_at: string;
    stock_movements?: any[]; // For history
}

export const fetchProducts = async () => {
    // RLS filters by shop automatically
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            stock_movements (
                quantity
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate current stock from movements
    return data.map((product: any) => ({
        ...product,
        current_stock: product.stock_movements
            ? product.stock_movements.reduce((sum: number, move: { quantity: number }) => sum + move.quantity, 0)
            : 0,
        stock_movements: undefined // Clean up for list view
    })) as Product[];
};

export const getProduct = async (id: string) => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            stock_movements (*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    const product = data as any;

    // Calculate stock but KEEP the movements for history display
    const current_stock = product.stock_movements
        ? product.stock_movements.reduce((sum: number, move: { quantity: number }) => sum + move.quantity, 0)
        : 0;

    // Sort movements by date desc
    const sortedMovements = product.stock_movements
        ? product.stock_movements.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

    return {
        ...product,
        current_stock,
        stock_movements: sortedMovements
    } as Product;
};

export const createProduct = async (product: Pick<Product, 'name' | 'category' | 'unit' | 'price' | 'cost_price' | 'current_stock'>) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('No shop found for current user');

    // Start with 0 stock, add movement later if needed or supported
    // For MVP, created products start with 0 stock unless we add initial stock logic

    // We need to remove current_stock from the insert payload as it is not a column
    const { current_stock, ...productData } = product;


    const { data, error } = await supabase
        .from('products')
        .insert([{
            ...productData,
            shop_id: shopId,
            is_active: true
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

