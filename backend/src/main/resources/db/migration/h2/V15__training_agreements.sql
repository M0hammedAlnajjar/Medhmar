CREATE TABLE training_agreements (
    agreement_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    trainer_user_id BIGINT NOT NULL,
    camel_id BIGINT NOT NULL,
    fee_omr DECIMAL(12,3) NOT NULL,
    prize_share_pct DECIMAL(5,2) NOT NULL,
    sale_share_pct DECIMAL(5,2) NOT NULL,
    starts_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    proposed_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP(6) WITH TIME ZONE,
    accepted_at TIMESTAMP(6) WITH TIME ZONE,
    terminated_at TIMESTAMP(6) WITH TIME ZONE,
    status VARCHAR(30) NOT NULL,
    row_version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_agreement_owner FOREIGN KEY (owner_id) REFERENCES users(user_id),
    CONSTRAINT fk_agreement_trainer FOREIGN KEY (trainer_user_id) REFERENCES trainer_profile(user_id),
    CONSTRAINT fk_agreement_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id),
    CONSTRAINT ck_agreement_prize_pct CHECK (prize_share_pct BETWEEN 0 AND 100),
    CONSTRAINT ck_agreement_sale_pct CHECK (sale_share_pct BETWEEN 0 AND 100),
    CONSTRAINT ck_agreement_fee CHECK (fee_omr >= 0),
    CONSTRAINT ck_agreement_dates CHECK (ends_at > starts_at)
);
CREATE INDEX ix_agreement_camel_status ON training_agreements(camel_id,status);
CREATE INDEX ix_agreement_owner ON training_agreements(owner_id);
CREATE INDEX ix_agreement_trainer ON training_agreements(trainer_user_id);
