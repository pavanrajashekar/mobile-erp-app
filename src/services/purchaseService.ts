import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';
import { addStockMovement } from './inventoryService';

export interface Purchase {
    id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    supplier_name?: string;
    created_at: string;
}

export const createPurchase = async (
    productId: string,
    quantity: number,
    unitCost: number,
    supplierName?: string
) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    const totalCost = quantity * unitCost;

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create Purchase Record
    const { data: purchase, error } = await supabase
        .from('purchases')
        .insert([{
            shop_id: shopId,
            product_id: productId,
            quantity,
            unit_cost: unitCost,
            total_cost: totalCost,
            supplier_name: supplierName,
            created_by: user?.id
        }])
        .select()
        .single();

    if (error) throw error;

    // 2. Add Stock Movement
    await addStockMovement(
        productId,
        quantity,
        'purchase',
        purchase.id
    );

    // 3. Update Product Cost Price (Last Purchase Price Strategy)
    const { error: productError } = await supabase
        .from('products')
        .update({ cost_price: unitCost })
        .eq('id', productId);

    if (productError) {
        console.warn('Failed to update product cost price:', productError);
        // We don't throw here to avoid breaking the purchase flow, checking consistency later might be needed
    }

    return purchase;
};

export const fetchPurchases = async () => {
    const { data, error } = await supabase
        .from('purchases')
        .select(`
            *,
            products (name)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
