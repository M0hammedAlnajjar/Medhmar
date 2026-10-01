CREATE TABLE organizations (
    organization_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    region VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    contact_email VARCHAR(254) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    row_version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_organization_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE organization_members (
    member_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    start_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT uk_organization_member UNIQUE (organization_id, user_id),
    CONSTRAINT fk_org_member_org FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
    CONSTRAINT fk_org_member_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_org_member_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
CREATE INDEX ix_org_member_org ON organization_members(organization_id, end_at);
CREATE INDEX ix_org_member_user ON organization_members(user_id, end_at);

ALTER TABLE races ADD COLUMN organization_id BIGINT NULL;
ALTER TABLE races ADD CONSTRAINT fk_race_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id);
CREATE INDEX ix_race_organization ON races(organization_id);
