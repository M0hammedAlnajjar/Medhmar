ALTER TABLE ownership_record ADD COLUMN is_active BOOLEAN;
ALTER TABLE ownership_record ADD COLUMN created_date TIMESTAMP(6);
ALTER TABLE ownership_record ADD COLUMN updated_date TIMESTAMP(6);
