-- File: <drizzle_folder>/0001_manual_alter.sql

ALTER TABLE "materials" ALTER COLUMN "material_type" SET DATA TYPE material_type USING "material_type"::material_type;