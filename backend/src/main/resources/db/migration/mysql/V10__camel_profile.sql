ALTER TABLE camel ADD COLUMN sire VARCHAR(255);
ALTER TABLE camel ADD COLUMN dam VARCHAR(255);
ALTER TABLE camel ADD COLUMN category VARCHAR(255);
CREATE TABLE pedigree (
    pedigree_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    recorded_at TIMESTAMP(6),
    camel_id BIGINT NOT NULL,
    CONSTRAINT uq_pedigree_camel UNIQUE (camel_id),
    CONSTRAINT fk_pedigree_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id)
);
