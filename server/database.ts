import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log("Connected to PostgreSQL successfully");
    return true;
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    return false;
  }
}