import * as storeRepository from '../repositories/storeRepository';

const getAllStores = async () => {
    const stores = await storeRepository.getAllStores();
    return stores;
}

const getStoreById = async (storeId: string) => {
    const store = await storeRepository.getStoreById(storeId);
    return store;
}

const getStoreByName = async (storeName: string) => {
    const store = await storeRepository.getStoreByName(storeName);
    return store;
}

export { getAllStores, getStoreById, getStoreByName };