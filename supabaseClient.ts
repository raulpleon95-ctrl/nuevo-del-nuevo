
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Intentamos inicializar al cargar el archivo si ya existen credenciales guardadas
if (typeof window !== 'undefined') {
  const storedConfig = localStorage.getItem('school_sys_config');
  if (storedConfig) {
    try {
      const { url, key } = JSON.parse(storedConfig);
      if (url && key && url.includes('http')) {
        supabaseInstance = createClient(url, key);
      }
    } catch (e) {
      console.error("Error al inicializar Supabase desde almacenamiento local", e);
    }
  }
}

export const getSupabase = () => {
  return supabaseInstance;
};

export const configureSupabase = (url: string, key: string) => {
  if (!url || !key) return;
  
  // Validar formato básico URL
  if (!url.startsWith('http')) {
      console.error("URL inválida");
      return;
  }

  try {
      // Crear instancia en memoria inmediatamente
      supabaseInstance = createClient(url, key);
      // Guardar en disco
      localStorage.setItem('school_sys_config', JSON.stringify({ url, key }));
      return true;
  } catch (error) {
      console.error("Error configurando Supabase:", error);
      return false;
  }
};

// Nueva función para probar conexión antes de guardar
export const testConnection = async (url: string, key: string): Promise<boolean> => {
    try {
        const tempClient = createClient(url, key);
        // Intentamos leer la tabla school_data. Si la tabla no existe, fallará.
        // Limitamos a 1 para que sea rápido.
        const { error } = await tempClient.from('school_data').select('id').limit(1);
        
        if (error) {
            console.error("Error de conexión Supabase:", error.message);
            // Si el error es "relation does not exist", significa que conectó pero falta la tabla.
            // Eso cuenta como éxito parcial de conexión, pero mejor lanzamos error para que el usuario corra el SQL.
            if (error.message.includes('relation "public.school_data" does not exist') || error.message.includes('Could not find the table')) {
                throw new Error("Conexión exitosa, pero la tabla 'school_data' no existe. Por favor ejecuta el código SQL (Paso 1).");
            }
            throw new Error(error.message); 
        }
        return true;
    } catch (e: any) {
        console.error("Test de conexión fallido:", e);
        if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network request failed'))) {
             throw new Error("No se pudo conectar al servidor. Verifica tu conexión a internet o la URL.");
        }
        throw e;
    }
}

export const disconnectSupabase = () => {
  localStorage.removeItem('school_sys_config');
  supabaseInstance = null;
  window.location.reload();
};

export const isSupabaseConfigured = () => !!supabaseInstance;

// Exportamos una instancia por defecto para compatibilidad, aunque puede ser null
export const supabase = supabaseInstance;