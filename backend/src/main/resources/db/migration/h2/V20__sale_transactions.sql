CREATE TABLE sale_transaction (
    sale_transaction_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sale_price_omr DOUBLE NOT NULL,
    sold_at TIMESTAMP(6) NOT NULL,
    is_active BOOLEAN,
    created_date TIMESTAMP(6),
    updated_date TIMESTAMP(6),
    offer_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    camel_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    CONSTRAINT uk_sale_transaction_offer UNIQUE (offer_id),
    CONSTRAINT fk_sale_transaction_offer FOREIGN KEY (offer_id) REFERENCES offer(offer_id),
    CONSTRAINT fk_sale_transaction_listing FOREIGN KEY (listing_id) REFERENCES market_place(listing_id),
    CONSTRAINT fk_sale_transaction_camel FOREIGN KEY (camel_id) REFERENCES camel(camel_id),
    CONSTRAINT fk_sale_transaction_seller FOREIGN KEY (seller_id) REFERENCES users(user_id),
    CONSTRAINT fk_sale_transaction_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id)
);
