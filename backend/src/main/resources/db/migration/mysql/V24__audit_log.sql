CREATE TABLE audit_log (
    audit_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    description TEXT,
    camel_id BIGINT NOT NULL,

    CONSTRAINT fk_audit_log_camel
        FOREIGN KEY (camel_id) REFERENCES camel(camel_id)
);

CREATE INDEX ix_audit_log_camel
    ON audit_log(camel_id);

CREATE INDEX ix_audit_log_entity
    ON audit_log(entity_type, entity_id);

CREATE TABLE race_card_audit_log (
    card_id BIGINT NOT NULL,
    audit_id BIGINT NOT NULL,

    PRIMARY KEY (card_id, audit_id),

    CONSTRAINT fk_race_card_audit_log_card
        FOREIGN KEY (card_id) REFERENCES race_cards(card_id),

    CONSTRAINT fk_race_card_audit_log_audit
        FOREIGN KEY (audit_id) REFERENCES audit_log(audit_id)
);