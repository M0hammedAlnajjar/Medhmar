ALTER TABLE sale_transaction ADD COLUMN trainer_id BIGINT NULL, ADD COLUMN agreement_id BIGINT NULL, ADD COLUMN trainer_share_omr DECIMAL(12,3) NULL, ADD COLUMN seller_net_omr DECIMAL(12,3) NULL;
ALTER TABLE sale_transaction ADD CONSTRAINT fk_sale_transaction_trainer FOREIGN KEY (trainer_id) REFERENCES users(user_id);
ALTER TABLE sale_transaction ADD CONSTRAINT fk_sale_transaction_agreement FOREIGN KEY (agreement_id) REFERENCES training_agreements(agreement_id);
