import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Falla rápido y con un mensaje claro en vez de un error críptico de supabase-js.
  throw new Error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalas con los valores del proyecto Sparadise-os en Supabase.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
