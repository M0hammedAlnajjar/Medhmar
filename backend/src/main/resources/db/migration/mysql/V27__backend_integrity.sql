ALTER TABLE market_place MODIFY asking_price_omr DECIMAL(12,3);
ALTER TABLE offer MODIFY offered_price_omr DECIMAL(12,3);
ALTER TABLE sale_transaction MODIFY sale_price_omr DECIMAL(12,3) NOT NULL;
ALTER TABLE audit_log MODIFY camel_id BIGINT NULL;
ALTER TABLE audit_log ADD COLUMN actor_user_id BIGINT NULL;
