package com.gulfracing.dto;

import com.gulfracing.entity.Organization;
import com.gulfracing.entity.Race;
import com.gulfracing.entity.User;
import com.gulfracing.enums.RaceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RaceDTO {

    private Long raceId;

    @NotBlank(message = "Race name is required")
    @Size(max = 150, message = "Race name cannot exceed 150 characters")
    private String name;

    @NotNull(message = "Race start date is required")
    private Instant startsAt;

    @NotBlank(message = "Race location is required")
    @Size(max = 255, message = "Race location cannot exceed 255 characters")
    private String location;

    @NotNull(message = "Race distance is required")
    @Positive(message = "Race distance must be greater than zero")
    private Double distanceKm;

    @NotNull(message = "Race status is required")
    private RaceStatus status;

    @Size(max = 2048, message = "Cover image URL cannot exceed 2048 characters")
    private String coverImageUrl;

    @Size(max = 2048, message = "Results image URL cannot exceed 2048 characters")
    private String resultsImageUrl;

    @NotNull(message = "Organizer ID is required")
    @Positive(message = "Organizer ID must be greater than zero")
    private Long organizerId;

    @Positive(message = "Organization ID must be greater than zero")
    private Long organizationId;

    public static RaceDTO convertToDTO(Race entity) {

        if (entity == null) {
            return null;
        }

        return RaceDTO.builder()
                .raceId(entity.getRaceId())
                .name(entity.getName())
                .startsAt(entity.getStartsAt())
                .location(entity.getLocation())
                .distanceKm(entity.getDistanceKm())
                .status(entity.getStatus())
                .coverImageUrl(entity.getCoverImageUrl())
                .resultsImageUrl(entity.getResultsImageUrl())
                .organizerId(
                        entity.getOrganizer() == null
                                ? null
                                : entity.getOrganizer().getUserId()
                )
                .organizationId(
                        entity.getOrganization() == null
                                ? null
                                : entity.getOrganization().getOrganizationId()
                )
                .build();
    }

    public static List<RaceDTO> convertToDTO(List<Race> entities) {

        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(RaceDTO::convertToDTO)
                .toList();
    }

    public Race toEntity() {

        Race race = new Race();

        race.setName(name);
        race.setStartsAt(startsAt);
        race.setLocation(location);
        race.setDistanceKm(distanceKm);
        race.setStatus(status);
        race.setCoverImageUrl(coverImageUrl);
        race.setResultsImageUrl(resultsImageUrl);

        if (organizerId != null) {
            User organizer = new User();
            organizer.setUserId(organizerId);
            race.setOrganizer(organizer);
        }

        if (organizationId != null) {
            Organization organization = new Organization();
            organization.setOrganizationId(organizationId);
            race.setOrganization(organization);
        }

        return race;
    }
}