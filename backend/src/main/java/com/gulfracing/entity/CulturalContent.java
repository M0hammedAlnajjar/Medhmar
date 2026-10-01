package com.gulfracing.entity;

import com.gulfracing.enums.ContentApprovalStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "cultural_content", indexes = {
        @Index(name = "ix_content_org_status", columnList = "organization_id,approved_status")
})
@Getter
@Setter
@NoArgsConstructor
public class CulturalContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "content_id")
    private Long contentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "content_type", nullable = false, length = 80)
    private String type;

    @Column(name = "content_url", nullable = false, length = 2048)
    private String contentUrl;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "approved_status", nullable = false, length = 20)
    private ContentApprovalStatus approvedStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
}
