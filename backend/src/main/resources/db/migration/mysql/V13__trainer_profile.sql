CREATE TABLE trainer_profile (
    user_id BIGINT NOT NULL PRIMARY KEY,
    bio TEXT,
    location VARCHAR(150),
    CONSTRAINT fk_trainer_profile_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);