// js/appwrite-config.js
import { Client, Account, Databases, Storage, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.0/+esm';

// Configuración correcta para tu proyecto en New York
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1') // Usa el endpoint regional
    .setProject('69e8df29003c99e7a35e');            // Tu ID de proyecto

// Opcional: Configuración para mayor robustez si usas la red Edge
// client.setSelfSigned(true);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

export const DATABASE_ID = 'axon_lab_db';
export const LABS_COLLECTION_ID = 'laboratorios';
export const DOCUMENTS_BUCKET_ID = 'documentos_usuarios';
