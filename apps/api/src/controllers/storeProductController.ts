import { Context } from 'hono';
import * as storeProductService from '../services/storeProductService';

/**
 * Get a store product by its barcode.
 */
const getStoreProductByBarcode = async (c: Context) => {
    const storeId = c.req.param('storeId');
    const barcode = c.req.param('barcode');

    if (!storeId || !barcode) {
        return c.json({ error: 'Missing storeId or barcode parameter' }, 400);
    }

    try {
        const storeProduct = await storeProductService.getStoreProductByBarcode(storeId, barcode);
        if (!storeProduct) {
            return c.json({ error: 'Store product not found' }, 404);
        }
        return c.json(storeProduct);
    } catch (error) {
        console.error('Error fetching store product:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
};

export { getStoreProductByBarcode };