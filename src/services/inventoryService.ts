import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export type MovementType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage';

export interface StockMovement {
    id: string;
    product_id: string;
    shop_id: string;
    quantity: number;
    movement_type: MovementType;
    created_at: string;
}

export const addStockMovement = async (
    productId: string,
    quantity: number,
    type: MovementType,
    referenceId?: string // e.g., sale_id
) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
            product_id: productId,
            shop_id: shopId,
            quantity: quantity, // Can be negative for sales/damage
            movement_type: type,
            reference_id: referenceId
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getProductStock = async (productId: string) => {
    const { data, error } = await supabase
        .from('stock_movements')
        .select('quantity')
        .eq('product_id', productId);

    if (error) throw error;

    // Summing up all movements
    const currentStock = data.reduce((sum, move) => sum + Number(move.quantity), 0);
    return currentStock;
};
