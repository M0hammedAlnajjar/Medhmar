CREATE TABLE tourist_events (
    event_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    name VARCHAR(180) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_at TIMESTAMP(6) NOT NULL,
    end_at TIMESTAMP(6) NOT NULL,
    description VARCHAR(2000),
    CONSTRAINT fk_tourist_event_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
    CONSTRAINT ck_tourist_event_times CHECK (end_at > start_at)
);
CREATE INDEX ix_tourist_event_org_start ON tourist_events(organization_id, start_at);

CREATE TABLE visitor_info (
    info_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT,
    ip_address VARCHAR(64),
    device_info VARCHAR(500),
    referrer_url VARCHAR(2048),
    visit_date TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_visitor_event FOREIGN KEY (event_id) REFERENCES tourist_events(event_id),
    CONSTRAINT fk_visitor_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX ix_visitor_event_date ON visitor_info(event_id, visit_date);

CREATE TABLE cultural_content (
    content_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    title VARCHAR(180) NOT NULL,
    content_type VARCHAR(80) NOT NULL,
    content_url VARCHAR(2048) NOT NULL,
    category VARCHAR(100) NOT NULL,
    approved_status VARCHAR(20) NOT NULL,
    approved_by BIGINT,
    CONSTRAINT fk_content_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
    CONSTRAINT fk_content_approver FOREIGN KEY (approved_by) REFERENCES users(user_id),
    CONSTRAINT ck_content_status CHECK (approved_status IN ('PENDING','APPROVED','REJECTED'))
);
CREATE INDEX ix_content_org_status ON cultural_content(organization_id, approved_status);
