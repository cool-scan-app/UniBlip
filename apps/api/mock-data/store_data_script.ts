import { db } from '../src/prisma/db';
import { v4 as UUID } from 'uuid';

async function main() {
    const storeAddressesToAdd = [
        { id: UUID(), street: 'Uudenmaantie', streetNr: '17', city: 'Turku', postalCode: '20700' }, // Citymarket Kupittaa
        { id: UUID(), street: 'Itäniityntie', streetNr: '15', city: 'Raisio', postalCode: '21280' }, // IKEA Raisio
        { id: UUID(), street: 'Tehtaankatu', streetNr: '2', city: 'Turku', postalCode: '20500' } // Café Arken
    ];

    for (const address of storeAddressesToAdd) {
        const created = await db.orm.public.StoreAddress.create(address);
        console.log("Created store address:", created);
    }

    const storeAddresses = await db.orm.public.StoreAddress.all();
    console.log("All store addresses:", storeAddresses);

    const cittariAddressId = storeAddressesToAdd[0].id;
    const ikeaAddressId = storeAddressesToAdd[1].id;
    const arkenAddressId = storeAddressesToAdd[2].id;

    const storesToAdd = [
        { id: UUID(), name: 'Citymarket Kupittaa', addressId: cittariAddressId, latitude: 60.4417566, longitude: 22.2862651 },
        { id: UUID(), name: 'IKEA Raisio', addressId: ikeaAddressId, latitude: 60.494487898100616, longitude: 22.2290341894674 },
        { id: UUID(), name: 'Café Arken', addressId: arkenAddressId, latitude: 60.45676867595919, longitude: 22.2790709899629 },
    ];

    for (const store of storesToAdd) {
        const created = await db.orm.public.Store.create(store);
        console.log("Created store:", created);
    }

    const stores = await db.orm.public.Store.all();
    console.log("All stores:", stores);

    await db.close();
}

main().catch((error) => {
  	console.error(error);
  	process.exit(1);
});