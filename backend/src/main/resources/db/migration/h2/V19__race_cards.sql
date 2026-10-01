CREATE TABLE race_cards (
    card_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    race_id BIGINT NOT NULL,
    version INT NOT NULL,
    publish_date TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    published_by BIGINT NOT NULL,
    CONSTRAINT uk_race_card_version UNIQUE (race_id, version),
    CONSTRAINT fk_race_card_race FOREIGN KEY (race_id) REFERENCES races(race_id),
    CONSTRAINT fk_race_card_publisher FOREIGN KEY (published_by) REFERENCES users(user_id)
);
CREATE INDEX ix_race_card_race ON race_cards(race_id, version);

CREATE TABLE race_card_entries (
    card_entry_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    card_id BIGINT NOT NULL,
    entry_id BIGINT NOT NULL,
    trim_number INT NOT NULL,
    camel_name_snapshot VARCHAR(255) NOT NULL,
    owner_name_snapshot VARCHAR(150) NOT NULL,
    trainer_name_snapshot VARCHAR(150),
    CONSTRAINT uk_race_card_entry UNIQUE (card_id, entry_id),
    CONSTRAINT fk_race_card_entry_card FOREIGN KEY (card_id) REFERENCES race_cards(card_id),
    CONSTRAINT fk_race_card_entry_race_entry FOREIGN KEY (entry_id) REFERENCES race_entries(entry_id)
);
