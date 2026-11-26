import { db } from '../src/prisma/db';
import { v4 as UUID } from 'uuid';

async function main() {
    const productsToAdd = [
        { id: UUID(), barcode: '6420256013625', name: 'Original | Sitruuna Hunaja', brand: 'Mynthon' },
        { id: UUID(), barcode: '6437005058516', name: '100 Kaura', brand: 'Vaasan' },
        { id: UUID(), barcode: '6420256015605', name: 'Professional | classic spearmint', brand: 'Jenkki' },
        { id: UUID(), barcode: '6409770080603', name: 'Siemen Rapeat | Kurpitsan-siemen & Pellava', brand: 'Rosten' },
        { id: UUID(), barcode: '6410405093134', name: 'Arrabbiata Pesto', brand: 'Pirkka' },
        { id: UUID(), barcode: '6418795100302', name: 'Sinappi | Väkevä', brand: 'Salosen Pimeäpullo' },
        { id: UUID(), barcode: '7311310031015', name: 'Taco Original', brand: 'Santa Maria' },
        { id: UUID(), barcode: '7310240650082', name: 'Tomaattiketchup | Vähemmän Suolaa ja Sokeria', brand: 'Felix' }
    ]

    const numberOfCreatedProducts = await db.orm.public.Product.createAndCount(productsToAdd, { onConflict: 'skip', conflictOn: ['barcode'] });

    console.log("Number of created products:", numberOfCreatedProducts);

    const products = await db.orm.public.Product.all();
    console.log("All products:", products);

    const cittariStoreId = '0bbabb01-5953-4190-b907-1f15defa52c0'; // ID of citymarket kupittaa

    const storeProductsToAdd = [
        { storeId: cittariStoreId, productId: products[0].id, priceInCents: 299 },
        { storeId: cittariStoreId, productId: products[1].id, priceInCents: 349 },
        { storeId: cittariStoreId, productId: products[2].id, priceInCents: 249 },
        { storeId: cittariStoreId, productId: products[3].id, priceInCents: 449 },
        { storeId: cittariStoreId, productId: products[4].id, priceInCents: 279 },
        { storeId: cittariStoreId, productId: products[5].id, priceInCents: 149 },
        { storeId: cittariStoreId, productId: products[6].id, priceInCents: 399 },
        { storeId: cittariStoreId, productId: products[7].id, priceInCents: 219 }
    ]

    const numberOfCreatedStoreProducts = await db.orm.public.StoreProduct.createAndCount(storeProductsToAdd, { onConflict: 'skip', conflictOn: ['storeId', 'productId'] });

    console.log("Number of created store products:", numberOfCreatedStoreProducts);

    const storeProducts = await db.orm.public.StoreProduct.all();
    console.log("All store products:", storeProducts);

    await db.close();
}

main().catch((error) => {
  	console.error(error);
  	process.exit(1);
});