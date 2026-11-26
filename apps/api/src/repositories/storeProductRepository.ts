import { db } from "../prisma/db";

const getStoreProductByBarcode = async (storeId: string, barcode: string) => {
    const storeProduct = await db.sql.public.store_products
        .innerJoin(db.sql.public.products, (f, fns) => fns.eq(f.store_products.product_id, f.products.id))
        .select((f) => ({
            productId: f.store_products.product_id,
            storeId: f.store_products.store_id,
            barcode: f.products.barcode,
            name: f.products.name,
            brand: f.products.brand,
            price_in_cents: f.store_products.price_in_cents,
        }))
        .where((f, fns) => fns.and(fns.eq(f.store_products.store_id, storeId), fns.eq(f.products.barcode, barcode)))
        .build();

    const result = await db.query(storeProduct);
    return result[0];
}

export { getStoreProductByBarcode };