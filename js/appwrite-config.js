// js/appwrite-config.js
import { Client, Account, Databases, Storage, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

// Usar endpoint global (sin región específica)
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')  // ← Cambiado de nyc a cloud
    .setProject('69e8df29003c99e7a35e');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

export const DATABASE_ID = 'axon_lab_db';
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
