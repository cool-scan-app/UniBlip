import { db } from "../prisma/db";

const getAllStores = async () => {
    const stores = await db.orm.public.Store.select("id", "name", "latitude", "longitude").all();
    return stores;
}

const getStoreById = async (storeId: string) => {
    const store = await db.orm.public.Store.select("id", "name", "latitude", "longitude").where({ id: storeId }).first();
    return store;
}

const getStoreByName = async (storeName: string) => {
    const store = await db.orm.public.Store.select("id", "name", "latitude", "longitude").where({ name: storeName }).first();
    return store;
}

const getAllStoresWithAddress = async () => {
    const stores = await db.sql.public.stores
        .innerJoin(db.sql.public.store_addresses, (f, fns) => fns.eq(f.stores.address_id, f.store_addresses.id))
        .select((f) => ({
            id: f.stores.id,
            name: f.stores.name,
            street: f.store_addresses.street,
            streetNr: f.store_addresses.street_nr,
            city: f.store_addresses.city,
            postalCode: f.store_addresses.postal_code,
        }))
        .build();

    return await db.query(stores);
}

const getStoreWithAddressById = async (storeId: string) => {
    const store = await db.sql.public.stores
        .as("s")
        .innerJoin(db.sql.public.store_addresses.as("sa"), (f, fns) => fns.eq(f.s.address_id, f.sa.id))
        .select((f) => ({
            id: f.s.id,
            name: f.s.name,
            latitude: f.s.latitude,
            longitude: f.s.longitude,
            street: f.sa.street,
            streetNr: f.sa.street_nr,
            city: f.sa.city,
            postalCode: f.sa.postal_code,
        }))
        .where((f, fns) => fns.eq(f.s.id, storeId))
        .build();

    const result = await db.query(store);
    return result[0];
}



export { getAllStores, getStoreById, getStoreByName, getAllStoresWithAddress, getStoreWithAddressById };