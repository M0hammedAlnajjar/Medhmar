-- Keep the legacy free-text sire/dam fields on camel for existing records.
-- Registered parents are canonical links in the one-to-one pedigree table.
ALTER TABLE pedigree ADD COLUMN sire_camel_id BIGINT;
ALTER TABLE pedigree ADD COLUMN dam_camel_id BIGINT;

ALTER TABLE pedigree
    ADD CONSTRAINT fk_pedigree_sire FOREIGN KEY (sire_camel_id) REFERENCES camel(camel_id);
ALTER TABLE pedigree
    ADD CONSTRAINT fk_pedigree_dam FOREIGN KEY (dam_camel_id) REFERENCES camel(camel_id);

CREATE INDEX idx_pedigree_sire ON pedigree(sire_camel_id);
CREATE INDEX idx_pedigree_dam ON pedigree(dam_camel_id);
