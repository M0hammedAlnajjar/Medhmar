-- Preserve entry and participant identities even when an entry is withdrawn.
ALTER TABLE race_entries ADD CONSTRAINT uk_race_entry_camel UNIQUE (race_id, camel_id);
ALTER TABLE race_entries ADD CONSTRAINT uk_race_participant_number UNIQUE (race_id, participant_number);
