// js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ❌ ERROR: No dejes 'TU_SUPABASE_URL'
// ✅ CORRECTO: Debe ser la URL que copiaste de tu panel
const SUPABASE_URL = 'https://tu-id-de-proyecto.supabase.co'; 
const SUPABASE_ANON_KEY = 'tu-clave-anon-larga-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const LABS_BUCKET = 'laboratorios';

console.log('✅ Supabase configurado correctamente');
