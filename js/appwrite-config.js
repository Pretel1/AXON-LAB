// js/appwrite-config.js
import { Client, Account, Databases, Storage, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

// Configuración de Appwrite para AXON-LAB
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69e8df29003c99e7a35e');

// Exportar servicios
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

// IDs de tus recursos (CREAR EN EL PANEL DE APPWRITE)
export const DATABASE_ID = 'axon_lab_db';
export const LABS_COLLECTION_ID = 'laboratorios';
export const DOCUMENTS_BUCKET_ID = 'documentos_usuarios';

// Variable global para el usuario actual
export let currentUser = null;

// Función para actualizar el usuario actual
export async function updateCurrentUser() {
    try {
        currentUser = await account.get();
        return currentUser;
    } catch (error) {
        currentUser = null;
        return null;
    }
}