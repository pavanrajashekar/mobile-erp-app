import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';
import { addStockMovement } from './inventoryService';
import { Product } from './productService';

export interface CartItem {
    product: Product;
    quantity: number;
    price: number;
}

export const processSale = async (items: CartItem[], totalAmount: number, paymentMode: string = 'cash', status: 'completed' | 'quote' = 'completed') => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Create Sale Record
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
            shop_id: shopId,
            total_amount: totalAmount,
            payment_mode: paymentMode,
            status: status,
            created_by: user.id
        }])
        .select()
        .single();

    if (saleError) throw saleError;

    // 2. Create Sale Items (Needed for both Sales and Quotes to track products)
    const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_sale: item.price
    }));

    const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

    if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        throw itemsError;
    }

    // 3. Deduct Stock - ONLY if completed sale
    if (status === 'completed') {
        const stockPromises = items.map(item =>
            addStockMovement(
                item.product.id,
                -Math.abs(item.quantity),
                'sale',
                sale.id
            )
        );
        await Promise.all(stockPromises);
    }

    return sale;
};
