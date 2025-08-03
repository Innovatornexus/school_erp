  import pg from 'pg';
  import 'dotenv/config';
  import { drizzle } from 'drizzle-orm/node-postgres';
  import * as schema from '@shared/schema';

  const { Pool } = pg;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Is your local DB running?");
  }

  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
