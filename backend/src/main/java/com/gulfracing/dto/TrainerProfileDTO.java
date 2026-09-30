package com.gulfracing.dto;

import com.gulfracing.entity.TrainerProfile;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrainerProfileDTO {

    @Positive
    private Long userId;

    private String bio;

    private String location;

    public static TrainerProfileDTO convertToDTO(TrainerProfile entity) {
        return TrainerProfileDTO.builder()
                .userId(entity.getUserId())
                .bio(entity.getBio())
                .location(entity.getLocation())
                .build();
    }

    public static List<TrainerProfileDTO> convertToDTO(List<TrainerProfile> entityList) {
        List<TrainerProfileDTO> dtos = new ArrayList<>();

        for (TrainerProfile trainerProfile : entityList) {
            dtos.add(convertToDTO(trainerProfile));
        }

        return dtos;
    }
}