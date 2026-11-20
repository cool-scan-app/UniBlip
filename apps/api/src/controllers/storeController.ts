import { Context } from "hono";
import * as storeService from "../services/storeService";

/**
 * function to get all stores from the database and return them as a JSON response.
 * @param c the context object
 * @returns a JSON response with the list of stores
 */
const getAllStores = async (c: Context) => {
    try {
        const stores = await storeService.getAllStores();
        return c.json(stores, 200);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to fetch stores" }, 500);
    }
}

/**
 * function to get a specific store by ID from the database and return it as a JSON response.
 * @param c the context object
 * @returns a JSON response with the store data or an error message
 */
const getStoreById = async (c: Context) => {
    const storeId = c.req.param("storeId");
    if (!storeId) {
        return c.json({ error: "StoreId is required" }, 400);
    }
    try {
        const store = await storeService.getStoreById(storeId);
        if (!store) {
            return c.json({ error: "Store not found" }, 404);
        }
        return c.json(store, 200);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to fetch store" }, 500);
    }
}
/**
 * function to get a specific store by name from the database and return it as a JSON response.
 * @param c the context object
 * @returns a JSON response with the store data or an error message
 */
const getStoreByName = async (c: Context) => {
    const storeName = c.req.param("storeName");
    if (!storeName) {
        return c.json({ error: "Store name is required" }, 400);
    }
    try {
        const store = await storeService.getStoreByName(storeName);
        if (!store) {
            return c.json({ error: "Store not found" }, 404);
        }
        return c.json(store, 200);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to fetch store" }, 500);
    }
}

const getAllStoresWithAddress = async (c: Context) => {
    try {
        const storesWithAddress = await storeService.getAllStoresWithAddress();
        return c.json(storesWithAddress, 200);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to fetch stores with address" }, 500);
    }
}

const getStoreWithAddressById = async (c: Context) => {
    const storeId = c.req.param("storeId");
    if (!storeId) {
        return c.json({ error: "StoreId is required" }, 400);
    }
    try {
        const storeWithAddress = await storeService.getStoreWithAddressById(storeId);
        if (!storeWithAddress) {
            return c.json({ error: "Store not found" }, 404);
        }
        return c.json(storeWithAddress, 200);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Failed to fetch store with address" }, 500);
    }
}

export { getAllStores, getStoreById, getStoreByName, getStoreWithAddressById, getAllStoresWithAddress };