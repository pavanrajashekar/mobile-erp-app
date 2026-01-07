import { supabase } from './supabase';
import { getCurrentShopId } from './shopService';

export type UOM = 'inch' | 'cm' | 'feet' | 'mm';

export interface MeasurementItem {
    id?: string;
    product_id: string | null; // Can be null if it's a generic item? Better to link to product if possible
    product_name?: string; // For display if not linked or cache
    length: number;
    width: number;
    quantity: number;
    area: number; // In SqFt
    total_price: number;
    remarks?: string;
}

export interface MeasurementSheet {
    id: string;
    shop_id: string;
    sale_id?: string | null;
    customer_name?: string;
    customer_phone?: string;
    status: 'draft' | 'confirmed' | 'converted_to_sale';
    uom: UOM;
    total_area: number;
    total_amount: number;
    items?: MeasurementItem[];
    created_at?: string;
}

export const calculateAreaInSqFt = (length: number, width: number, quantity: number, uom: UOM): number => {
    const rawArea = length * width * quantity;
    switch (uom) {
        case 'feet': return rawArea;
        case 'inch': return rawArea / 144;
        case 'cm': return rawArea / 929.03;
        case 'mm': return rawArea / 92903.04;
        default: return rawArea;
    }
};

export const createMeasurementSheet = async (
    data: Omit<MeasurementSheet, 'id' | 'shop_id' | 'created_at' | 'total_area' | 'total_amount'> & { items: MeasurementItem[] }
) => {
    const shopId = await getCurrentShopId();
    if (!shopId) throw new Error('Shop not found');

    // 1. Calculate totals
    const totalArea = data.items.reduce((sum, item) => sum + item.area, 0);
    const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);

    // 2. Create Sheet
    const { data: sheet, error: sheetError } = await supabase
        .from('measurements')
        .insert([{
            shop_id: shopId,
            sale_id: data.sale_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            status: data.status || 'draft',
            uom: data.uom,
            total_area: totalArea,
            total_amount: totalAmount
        }])
        .select()
        .single();

    if (sheetError) throw sheetError;

    // 3. Create Items
    if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
            measurement_id: sheet.id,
            product_id: item.product_id,
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            area: item.area,
            total_price: item.total_price,
            remarks: item.remarks
        }));

        const { error: itemsError } = await supabase
            .from('measurement_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;
    }

    return sheet;
};

export const getMeasurements = async () => {
    const shopId = await getCurrentShopId();
    if (!shopId) return [];

    const { data, error } = await supabase
        .from('measurements')
        .select(`
            *,
            sales:sale_id (
                id,
                customer_name
            )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MeasurementSheet[];
};

export const getMeasurementById = async (id: string) => {
    const { data, error } = await supabase
        .from('measurements')
        .select(`
            *,
            items:measurement_items (*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as MeasurementSheet;
};

export const getMeasurementsBySaleId = async (saleId: string) => {
    const { data, error } = await supabase
        .from('measurements')
        .select(`
            *,
            items:measurement_items (*)
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MeasurementSheet[];
};
