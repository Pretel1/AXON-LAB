// js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://xxrxoyotgragaunygsne.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dmHdG4_xal2iWHFagZjo2Q_PFtxHfPJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Buckets
export const LABS_BUCKET = 'laboratorios';
export const MEDIA_BUCKET = 'media';

console.log('✅ Supabase configurado correctamente');
