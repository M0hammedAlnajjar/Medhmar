CREATE TABLE race_results (
                              entry_id BIGINT NOT NULL PRIMARY KEY,
                              finish_position INT NOT NULL,
                              elapsed_ms BIGINT NOT NULL,

                              CONSTRAINT fk_race_result_entry
                                  FOREIGN KEY (entry_id) REFERENCES race_entries(entry_id)
);