-- Optional broadcaster link managed by administrators; published challenge data remains authoritative.
ALTER TABLE challenges ADD COLUMN stream_url VARCHAR(500) NULL;
