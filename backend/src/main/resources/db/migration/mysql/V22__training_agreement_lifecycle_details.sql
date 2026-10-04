ALTER TABLE training_agreements
    ADD COLUMN rejection_reason VARCHAR(1000),
    ADD COLUMN termination_reason VARCHAR(1000),
    ADD COLUMN completed_at TIMESTAMP(6),
    ADD COLUMN expired_at TIMESTAMP(6),
    ADD COLUMN terms TEXT,
    ADD COLUMN terminated_by BIGINT,
    ADD COLUMN rejected_by BIGINT;

ALTER TABLE training_agreements
    ADD CONSTRAINT fk_agreement_terminated_by
        FOREIGN KEY (terminated_by) REFERENCES users(user_id);

ALTER TABLE training_agreements
    ADD CONSTRAINT fk_agreement_rejected_by
        FOREIGN KEY (rejected_by) REFERENCES users(user_id);