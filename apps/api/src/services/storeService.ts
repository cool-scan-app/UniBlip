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

const getAllStoresWithAddress = async () => {
    const storesWithAddress = await storeRepository.getAllStoresWithAddress();
    return storesWithAddress;
}

const getStoreWithAddressById = async (storeId: string) => {
    const storeWithAddress = await storeRepository.getStoreWithAddressById(storeId);
    return storeWithAddress;
}



export { getAllStores, getStoreById, getStoreByName, getStoreWithAddressById, getAllStoresWithAddress };