package com.gulfracing.dto;

import com.gulfracing.entity.CulturalContent;
import com.gulfracing.entity.TouristEvent;
import com.gulfracing.entity.VisitorInfo;
import com.gulfracing.enums.ContentApprovalStatus;
import jakarta.validation.constraints.*;

import java.time.Instant;

public final class TourismDtos {
    private TourismDtos() {}

    public record EventRequest(
            @NotNull @Positive Long organizationId,
            @NotBlank @Size(max = 180) String name,
            @NotBlank @Size(max = 80) String type,
            @NotBlank @Size(max = 255) String location,
            @NotNull Instant startAt,
            @NotNull Instant endAt,
            @Size(max = 2000) String description
    ) {}

    public record EventView(
            Long eventId, Long organizationId, String organizationName, String name, String type,
            String location, Instant startAt, Instant endAt, String description
    ) {
        public static EventView from(TouristEvent entity) {
            return new EventView(entity.getEventId(), entity.getOrganization().getOrganizationId(),
                    entity.getOrganization().getName(), entity.getName(), entity.getType(), entity.getLocation(),
                    entity.getStartAt(), entity.getEndAt(), entity.getDescription());
        }
    }

    public record VisitView(
            Long infoId, Long eventId, Long userId, String ipAddress,
            String deviceInfo, String referrerUrl, Instant visitDate
    ) {
        public static VisitView from(VisitorInfo entity) {
            return new VisitView(entity.getInfoId(), entity.getEvent().getEventId(),
                    entity.getUser() == null ? null : entity.getUser().getUserId(),
                    entity.getIpAddress(), entity.getDeviceInfo(), entity.getReferrerUrl(), entity.getVisitDate());
        }
    }

    public record ContentRequest(
            @NotNull @Positive Long organizationId,
            @NotBlank @Size(max = 180) String title,
            @NotBlank @Size(max = 80) String type,
            @NotBlank @Size(max = 2048) String contentUrl,
            @NotBlank @Size(max = 100) String category
    ) {}

    public record ContentView(
            Long contentId, Long organizationId, String organizationName, String title, String type,
            String contentUrl, String category, ContentApprovalStatus approvedStatus, Long approvedBy
    ) {
        public static ContentView from(CulturalContent entity) {
            return new ContentView(entity.getContentId(), entity.getOrganization().getOrganizationId(),
                    entity.getOrganization().getName(), entity.getTitle(), entity.getType(), entity.getContentUrl(),
                    entity.getCategory(), entity.getApprovedStatus(),
                    entity.getApprovedBy() == null ? null : entity.getApprovedBy().getUserId());
        }
    }
}
