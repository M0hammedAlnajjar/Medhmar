package com.gulfracing.dto;

import com.gulfracing.entity.Organization;
import com.gulfracing.entity.OrganizationMember;
import com.gulfracing.enums.OrganizationStatus;
import jakarta.validation.constraints.*;

import java.time.Instant;

public final class OrganizationDtos {
    private OrganizationDtos() {}

    public record Create(
            @NotBlank @Size(max = 180) String name,
            @NotBlank @Size(max = 120) String region,
            @Size(max = 2000) String description,
            @NotBlank @Email @Size(max = 254) String contactEmail
    ) {}

    public record Update(
            @NotBlank @Size(max = 180) String name,
            @NotBlank @Size(max = 120) String region,
            @Size(max = 2000) String description,
            @NotBlank @Email @Size(max = 254) String contactEmail,
            @NotNull OrganizationStatus status
    ) {}

    public record MemberRequest(
            @NotNull @Positive Long userId,
            @NotBlank @Size(max = 50) String roleName
    ) {}

    public record View(
            Long organizationId, String name, String region, String description,
            String contactEmail, OrganizationStatus status, Instant createdAt
    ) {
        public static View from(Organization entity) {
            return new View(entity.getOrganizationId(), entity.getName(), entity.getRegion(),
                    entity.getDescription(), entity.getContactEmail(), entity.getStatus(), entity.getCreatedAt());
        }
    }

    public record MemberView(
            Long memberId, Long organizationId, Long userId, String fullName,
            String roleName, Instant startAt, Instant endAt
    ) {
        public static MemberView from(OrganizationMember entity) {
            return new MemberView(entity.getMemberId(), entity.getOrganization().getOrganizationId(),
                    entity.getUser().getUserId(), entity.getUser().getFullName(),
                    entity.getRole().getRoleName(), entity.getStartAt(), entity.getEndAt());
        }
    }
}
