-- Remove any legacy plaintext member password column and values.
ALTER TABLE IF EXISTS "AccessCredentials" DROP COLUMN IF EXISTS "plainPassword";
