// js/appwrite-config.js
import { Client, Account, Databases, Storage, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69e8df29003c99e7a35e');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

// ✅ CORREGIDO: usa el ID real de tu base de datos
export const DATABASE_ID = '69e8e6b3000221e0e536';
export const LABS_COLLECTION_ID = 'laboratorios';
export const DOCUMENTS_BUCKET_ID = 'documentos_usuarios';

export let currentUser = null;

export async function updateCurrentUser() {
    try {
        currentUser = await account.get();
        return currentUser;
    } catch (error) {
        currentUser = null;
        return null;
    }
}
