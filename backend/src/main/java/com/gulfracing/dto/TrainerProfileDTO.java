package com.gulfracing.dto;

import com.gulfracing.entity.TrainerProfile;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrainerProfileDTO {
    // Optional in requests; always sourced from the authenticated account for writes.
    @Positive
    private Long userId;

    @Size(max = 2000)
    private String bio;

    @Size(max = 150)
    private String location;

    public static TrainerProfileDTO convertToDTO(TrainerProfile entity) {
        return TrainerProfileDTO.builder()
                .userId(entity.getUserId())
                .bio(entity.getBio())
                .location(entity.getLocation())
                .build();
    }

    public static List<TrainerProfileDTO> convertToDTO(List<TrainerProfile> entityList) {
        return entityList.stream().map(TrainerProfileDTO::convertToDTO).toList();
    }
}
