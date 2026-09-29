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
