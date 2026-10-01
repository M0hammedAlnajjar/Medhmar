package com.gulfracing.repository;

import com.gulfracing.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {
    Optional<OrganizationMember> findByOrganization_OrganizationIdAndUser_UserId(Long organizationId, Long userId);
    List<OrganizationMember> findByOrganization_OrganizationIdAndEndAtIsNullOrderByMemberIdAsc(Long organizationId);
    boolean existsByOrganization_OrganizationIdAndUser_UserIdAndRole_RoleNameAndEndAtIsNull(
            Long organizationId, Long userId, String roleName);
    long countByOrganization_OrganizationIdAndRole_RoleNameAndEndAtIsNull(
            Long organizationId, String roleName);
}
