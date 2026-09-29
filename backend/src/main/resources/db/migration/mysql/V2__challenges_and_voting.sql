-- Camel is the shared entity currently maintained by the camel module.
CREATE TABLE camel (
    camel_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    gender VARCHAR(255),
    birth_date TIMESTAMP(6),
    breed VARCHAR(255),
    photo_url VARCHAR(255),
    status VARCHAR(255)
);
CREATE TABLE challenges (
    challenge_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    opens_at TIMESTAMP(6) NOT NULL,
    closes_at TIMESTAMP(6) NOT NULL,
    status VARCHAR(20) NOT NULL,
    creator_id BIGINT NOT NULL,
    CONSTRAINT fk_challenge_creator FOREIGN KEY (creator_id) REFERENCES users(user_id),
    CONSTRAINT ck_challenge_times CHECK (closes_at > opens_at),
    CONSTRAINT ck_challenge_status CHECK (status IN ('DRAFT','OPEN','CLOSED'))
);
CREATE INDEX ix_challenge_status ON challenges(status, challenge_id);
CREATE TABLE challenge_camels (
    challenge_id BIGINT NOT NULL,
    camel_id BIGINT NOT NULL,
    PRIMARY KEY (challenge_id, camel_id),
    CONSTRAINT fk_entry_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id),
    CONSTRAINT fk_entry_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id)
);
CREATE TABLE votes (
    vote_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    voted_at TIMESTAMP(6) NOT NULL,
    user_id BIGINT NOT NULL,
    challenge_id BIGINT NOT NULL,
    camel_id BIGINT NOT NULL,
    CONSTRAINT uk_vote_user_challenge UNIQUE (user_id, challenge_id),
    CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_vote_entry FOREIGN KEY (challenge_id, camel_id)
        REFERENCES challenge_camels(challenge_id, camel_id)
);
CREATE INDEX ix_vote_challenge_camel ON votes(challenge_id, camel_id);
