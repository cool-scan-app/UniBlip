import { db } from '../src/prisma/db';
import { v4 as UUID } from 'uuid';

async function main() {
    const productsToAdd = [
        { id: UUID(), barcode: '6420256013625', name: 'Original | Sitruuna Hunaja', brand: 'Mynthon', externalId: 'K-group' },
        { id: UUID(), barcode: '6437005058516', name: '100 Kaura', brand: 'Vaasan', externalId: 'K-group' },
        { id: UUID(), barcode: '6420256015605', name: 'Professional | classic spearmint', brand: 'Jenkki', externalId: 'K-group' },
        { id: UUID(), barcode: '6409770080603', name: 'Siemen Rapeat | Kurpitsan-siemen & Pellava', brand: 'Rosten', externalId: 'K-group' },
        { id: UUID(), barcode: '6410405093134', name: 'Arrabbiata Pesto', brand: 'Pirkka', externalId: 'K-group' },
        { id: UUID(), barcode: '6418795100302', name: 'Sinappi | Väkevä', brand: 'Salosen Pimeäpullo', externalId: 'K-group' },
        { id: UUID(), barcode: '7311310031015', name: 'Taco Original', brand: 'Santa Maria', externalId: 'K-group' },
        { id: UUID(), barcode: '7310240650082', name: 'Tomaattiketchup | Vähemmän Suolaa ja Sokeria', brand: 'Felix', externalId: 'K-group' }
    ]

    const numberOfCreatedProducts = await db.orm.public.Product.createAndCount(productsToAdd, { onConflict: 'skip', conflictOn: ['barcode'] });

    console.log("Number of created products:", numberOfCreatedProducts);

    const products = await db.orm.public.Product.all();
    console.log("All products:", products);

    const cittariStoreId = '0bbabb01-5953-4190-b907-1f15defa52c0'; // ID of citymarket kupittaa

    const storeProductsToAdd = [
        { storeId: cittariStoreId, productId: products[0].id, price: 2.99 },
        { storeId: cittariStoreId, productId: products[1].id, price: 3.49 },
        { storeId: cittariStoreId, productId: products[2].id, price: 2.49 },
        { storeId: cittariStoreId, productId: products[3].id, price: 4.49 },
        { storeId: cittariStoreId, productId: products[4].id, price: 2.79 },
        { storeId: cittariStoreId, productId: products[5].id, price: 1.49 },
        { storeId: cittariStoreId, productId: products[6].id, price: 3.99 },
        { storeId: cittariStoreId, productId: products[7].id, price: 2.19 }
    ]


    await db.close();
}

main().catch((error) => {
  	console.error(error);
  	process.exit(1);
});