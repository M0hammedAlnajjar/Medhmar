-- MySQL reference schema. The application applies Flyway migrations automatically.
-- Do not run this separately against a database managed by Flyway.

CREATE TABLE users (
    user_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    preferred_language VARCHAR(10) NOT NULL,
    account_status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP(6) NOT NULL,
    avatar_url VARCHAR(2048),
    security_version BIGINT NOT NULL DEFAULT 0,
    row_version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_user_email UNIQUE (email),
    CONSTRAINT ck_user_status CHECK (account_status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);
CREATE TABLE roles (
    role_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    CONSTRAINT uk_role_name UNIQUE (role_name)
);
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
CREATE TABLE auth_accounts (
    account_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    user_id BIGINT NOT NULL,
    CONSTRAINT uk_auth_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uk_auth_user_provider UNIQUE (user_id, provider),
    CONSTRAINT fk_auth_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT ck_auth_provider CHECK (provider IN ('LOCAL','GOOGLE'))
);
CREATE TABLE password_resets (
    reset_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6),
    user_id BIGINT NOT NULL,
    CONSTRAINT uk_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX ix_reset_user_expiry ON password_resets(user_id, expires_at);

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

-- Tables for the teammate modules present on main at implementation time.
CREATE TABLE ownership_record (
    ownership_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    share_percent DOUBLE,
    start_at TIMESTAMP(6),
    end_at TIMESTAMP(6),
    camel_id BIGINT,
    owner_id BIGINT,
    CONSTRAINT fk_ownership_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id),
    CONSTRAINT fk_ownership_user FOREIGN KEY (owner_id) REFERENCES users(user_id)
);
CREATE TABLE market_place (
    listing_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    asking_price_omr DOUBLE,
    created_at TIMESTAMP(6),
    status VARCHAR(255),
    description VARCHAR(255),
    camel_id BIGINT,
    user_id BIGINT,
    CONSTRAINT fk_listing_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id),
    CONSTRAINT fk_listing_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE offer (
    offer_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    offered_price_omr DOUBLE,
    created_at TIMESTAMP(6),
    status VARCHAR(255),
    responded_at TIMESTAMP(6),
    listing_id BIGINT,
    user_id BIGINT,
    CONSTRAINT fk_offer_listing FOREIGN KEY (listing_id) REFERENCES market_place(listing_id),
    CONSTRAINT fk_offer_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE races (
    race_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    starts_at TIMESTAMP(6) NOT NULL,
    location VARCHAR(255) NOT NULL,
    distance_km DOUBLE NOT NULL,
    status VARCHAR(30) NOT NULL,
    results_image_url VARCHAR(2048),
    organizer_id BIGINT NOT NULL,
    CONSTRAINT fk_race_organizer FOREIGN KEY (organizer_id) REFERENCES users(user_id)
);

-- V5: tracking fields added by the camel module.
ALTER TABLE camel ADD COLUMN is_active BOOLEAN;
ALTER TABLE camel ADD COLUMN created_date TIMESTAMP(6);
ALTER TABLE camel ADD COLUMN updated_date TIMESTAMP(6);
