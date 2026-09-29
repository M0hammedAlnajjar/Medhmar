package com.gulfracing.dto;

import com.gulfracing.entity.Camel;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CamelDTO {
    @Positive
    private Long camelId;

    @NotBlank(message = "Camel name cannot be blank")
    @Size(min = 2, max = 50, message = "Camel name has to be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Camel gender cannot be blank")
    private Gender gender;

    @NotNull(message = "Camel birth date cannot be null")
    @Past(message = "Camel birth date must be in the past")
    private Date birthDate;

    @NotBlank(message = "Camel breed cannot be blank")
    @Size(min = 2, max = 50,
            message = "Camel breed has to be between 2 and 50 characters")
    private String breed;

    private String photoUrl;

    @NotBlank(message = "Camel status cannot be blank")
    private CamelStatus status;


    public static CamelDTO convertToDTO(Camel entity) {
        CamelDTO dto = CamelDTO.builder()
                .camelId(entity.getCamelId())
                .name(entity.getName())
                .gender(entity.getGender())
                .birthDate(entity.getBirthDate())
                .breed(entity.getBreed())
                .photoUrl(entity.getPhotoUrl())
                .status(entity.getStatus())
                .build();
        return dto;
    }


    public static List<CamelDTO> convertToDTO(List<Camel> entityList) {
        List<CamelDTO> dtos = new ArrayList<>();
        for (Camel camel : entityList) {
            dtos.add(convertToDTO(camel));
        }
        return dtos;
    }
}
