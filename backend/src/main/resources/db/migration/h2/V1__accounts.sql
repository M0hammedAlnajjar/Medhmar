CREATE TABLE users (
    user_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    preferred_language VARCHAR(10) NOT NULL,
    account_status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
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
    expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP(6) WITH TIME ZONE,
    user_id BIGINT NOT NULL,
    CONSTRAINT uk_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX ix_reset_user_expiry ON password_resets(user_id, expires_at);
