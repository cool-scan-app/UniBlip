import * as storeProductRepository from '../repositories/storeProductRepository';

const getStoreProductByBarcode = async (storeId: string, barcode: string) => {
    const storeProduct = await storeProductRepository.getStoreProductByBarcode(storeId, barcode);
    return storeProduct;
}

export { getStoreProductByBarcode };