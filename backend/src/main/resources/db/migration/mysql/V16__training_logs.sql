CREATE TABLE training_logs (
    log_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    agreement_id BIGINT NOT NULL,
    session_at TIMESTAMP(6) NOT NULL,
    duration_minutes INT NOT NULL,
    notes VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_training_log_agreement
        FOREIGN KEY (agreement_id) REFERENCES training_agreements(agreement_id),
    CONSTRAINT ck_training_log_duration
        CHECK (duration_minutes BETWEEN 1 AND 720)
);

CREATE INDEX ix_training_log_agreement_session
    ON training_logs(agreement_id, session_at);
