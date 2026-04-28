// js/supabase-config.js - CONFIGURACIÓN OFICIAL AXON-LAB
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Tu URL de proyecto (la que termina en .supabase.co)
const SUPABASE_URL = 'https://xxrxoyotgragaunygsne.supabase.co'; 

// Tu Publishable Key (LA QUE EMPIEZA CON sb_publishable)
const SUPABASE_ANON_KEY = 'sb_publishable_dmHdG4_xal2iWHFagZjo2Q_PFtxHfPJ';

// Inicialización del cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Buckets de almacenamiento
export const LABS_BUCKET = 'laboratorios';
export const MEDIA_BUCKET = 'media';

console.log('🚀 Supabase conectado: Entorno AXON-LAB listo');
