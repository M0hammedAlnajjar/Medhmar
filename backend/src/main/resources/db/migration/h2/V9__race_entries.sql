CREATE TABLE race_entries (
                              entry_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                              registered_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
                              participant_number INT NOT NULL,
                              entry_status VARCHAR(30) NOT NULL,
                              race_id BIGINT NOT NULL,
                              registrant_id BIGINT NOT NULL,
                              camel_id BIGINT NOT NULL,

                              CONSTRAINT fk_race_entry_race
                                  FOREIGN KEY (race_id) REFERENCES races(race_id),

                              CONSTRAINT fk_race_entry_registrant
                                  FOREIGN KEY (registrant_id) REFERENCES users(user_id),

                              CONSTRAINT fk_race_entry_camel
                                  FOREIGN KEY (camel_id) REFERENCES camel(camel_id)
);