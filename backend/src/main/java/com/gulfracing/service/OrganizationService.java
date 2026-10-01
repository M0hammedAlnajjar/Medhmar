package com.gulfracing.service;

import com.gulfracing.dto.OrganizationDtos.*;
import com.gulfracing.entity.Organization;
import com.gulfracing.entity.OrganizationMember;
import com.gulfracing.enums.OrganizationStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.OrganizationMemberRepository;
import com.gulfracing.repository.OrganizationRepository;
import com.gulfracing.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OrganizationService {
    private final OrganizationRepository organizations;
    private final OrganizationMemberRepository members;
    private final RoleRepository roles;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public View create(Create request, Long actorId) {
        var actor = users.getActive(actorId);
        boolean organizer = actor.getRoles().stream().anyMatch(r -> "ORGANIZER".equals(r.getRoleName()));
        if (!organizer && !users.isAdmin(actorId)) throw ApiException.forbidden();

        var organization = new Organization();
        apply(organization, request.name(), request.region(), request.description(), request.contactEmail());
        organization.setStatus(OrganizationStatus.ACTIVE);
        organization.setCreatedAt(clock.instant());
        organizations.saveAndFlush(organization);

        var membership = new OrganizationMember();
        membership.setOrganization(organization);
        membership.setUser(actor);
        membership.setRole(roles.findByRoleName("ORGANIZER")
                .orElseThrow(() -> new IllegalStateException("ORGANIZER role is missing.")));
        membership.setStartAt(clock.instant());
        members.saveAndFlush(membership);

        return View.from(organization);
    }

    @Transactional(readOnly = true)
    public List<View> list() {
        return organizations.findAllByOrderByNameAsc().stream().map(View::from).toList();
    }

    @Transactional(readOnly = true)
    public View get(Long id) {
        return View.from(entity(id));
    }

    @Transactional
    public View update(Long id, Update request, Long actorId) {
        requireManager(id, actorId);
        var organization = entity(id);
        apply(organization, request.name(), request.region(), request.description(), request.contactEmail());
        organization.setStatus(request.status());
        return View.from(organization);
    }

    @Transactional(readOnly = true)
    public List<MemberView> listMembers(Long organizationId) {
        entity(organizationId);
        return members.findByOrganization_OrganizationIdAndEndAtIsNullOrderByMemberIdAsc(organizationId)
                .stream().map(MemberView::from).toList();
    }

    @Transactional
    public MemberView addMember(Long organizationId, MemberRequest request, Long actorId) {
        requireManager(organizationId, actorId);
        var organization = entity(organizationId);
        var user = users.getActive(request.userId());
        String roleName = request.roleName().strip().toUpperCase(Locale.ROOT);
        var role = roles.findByRoleName(roleName)
                .orElseThrow(() -> ApiException.badRequest("Unknown role."));

        var membership = members
                .findByOrganization_OrganizationIdAndUser_UserId(organizationId, request.userId())
                .orElseGet(OrganizationMember::new);
        membership.setOrganization(organization);
        membership.setUser(user);
        membership.setRole(role);
        membership.setStartAt(clock.instant());
        membership.setEndAt(null);
        return MemberView.from(members.saveAndFlush(membership));
    }

    @Transactional
    public void removeMember(Long organizationId, Long userId, Long actorId) {
        requireManager(organizationId, actorId);
        var membership = members.findByOrganization_OrganizationIdAndUser_UserId(organizationId, userId)
                .orElseThrow(() -> ApiException.notFound("Organization member"));
        if (membership.getEndAt() != null) throw ApiException.notFound("Organization member");

        if ("ORGANIZER".equals(membership.getRole().getRoleName())
                && members.countByOrganization_OrganizationIdAndRole_RoleNameAndEndAtIsNull(
                        organizationId, "ORGANIZER") <= 1) {
            throw ApiException.conflict("An organization must keep at least one active organizer.");
        }
        membership.setEndAt(clock.instant());
    }

    @Transactional(readOnly = true)
    public boolean canManage(Long organizationId, Long actorId) {
        if (users.isAdmin(actorId)) return true;
        return members.existsByOrganization_OrganizationIdAndUser_UserIdAndRole_RoleNameAndEndAtIsNull(
                organizationId, actorId, "ORGANIZER");
    }

    @Transactional(readOnly = true)
    public void requireManager(Long organizationId, Long actorId) {
        entity(organizationId);
        if (!canManage(organizationId, actorId)) throw ApiException.forbidden();
    }

    @Transactional(readOnly = true)
    public Organization entity(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("Organization ID must be greater than zero.");
        return organizations.findById(id).orElseThrow(() -> ApiException.notFound("Organization"));
    }

    private void apply(Organization organization, String name, String region, String description, String contactEmail) {
        organization.setName(name.strip());
        organization.setRegion(region.strip());
        organization.setDescription(description == null ? null : description.strip());
        organization.setContactEmail(UserService.normalizeEmail(contactEmail));
    }
}
