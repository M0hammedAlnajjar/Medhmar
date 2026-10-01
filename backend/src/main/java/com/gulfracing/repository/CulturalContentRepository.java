package com.gulfracing.repository;

import com.gulfracing.entity.CulturalContent;
import com.gulfracing.enums.ContentApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CulturalContentRepository extends JpaRepository<CulturalContent, Long> {
    List<CulturalContent> findByApprovedStatusOrderByContentIdDesc(ContentApprovalStatus status);
    List<CulturalContent> findByOrganization_OrganizationIdOrderByContentIdDesc(Long organizationId);
}
