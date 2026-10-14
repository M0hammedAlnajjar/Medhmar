ALTER TABLE market_place ALTER COLUMN asking_price_omr DECIMAL(12,3);
ALTER TABLE offer ALTER COLUMN offered_price_omr DECIMAL(12,3);
ALTER TABLE sale_transaction ALTER COLUMN sale_price_omr DECIMAL(12,3);
ALTER TABLE audit_log ALTER COLUMN camel_id DROP NOT NULL;
ALTER TABLE audit_log ADD COLUMN actor_user_id BIGINT;
