import { Pool } from 'pg';

// Singleton Pool para reutilización de conexiones en Next.js Server Actions y API Routes
let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = 
      process.env.DATABASE_URL || 
      process.env.POSTGRES_URL || 
      process.env.SUPABASE_DB_URL ||
      'postgresql://postgres:postgres@localhost:5432/facturacontrol';

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false,
    });

    pool.on('error', (err) => {
      console.error('Error inesperado en cliente de PostgreSQL:', err);
    });
  }

  return pool;
}

/**
 * Función helper para ejecutar consultas SQL directas en PostgreSQL con parámetros
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const dbPool = getDbPool();
  const result = await dbPool.query(text, params);
  return result.rows as T[];
}

/**
 * Función helper para ejecutar una sola fila en PostgreSQL
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
