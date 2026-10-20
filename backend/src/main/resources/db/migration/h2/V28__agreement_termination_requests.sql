
ALTER TABLE training_agreements
    ADD COLUMN termination_request_status VARCHAR(20);

ALTER TABLE training_agreements
    ADD COLUMN termination_requested_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE training_agreements
    ADD COLUMN termination_requested_by BIGINT;

ALTER TABLE training_agreements
    ADD COLUMN termination_decision_notes VARCHAR(1000);

ALTER TABLE training_agreements
    ADD CONSTRAINT fk_agreement_termination_requested_by
        FOREIGN KEY (termination_requested_by) REFERENCES users(user_id);
