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


export { getAllStores, getStoreById, getStoreByName };