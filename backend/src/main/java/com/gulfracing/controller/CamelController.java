package com.gulfracing.controller;

import com.gulfracing.dto.CamelDTO;
import com.gulfracing.dto.CamelProfileDTO;
import com.gulfracing.dto.OwnershipHistoryDTO;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import com.gulfracing.service.OwnershipRecordService;
import com.gulfracing.service.CamelProfileService;
import com.gulfracing.service.CamelService;
import com.gulfracing.service.CamelAccessService;
import com.gulfracing.security.AccountAccess;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("camel")
public class CamelController {

    CamelService camelService;
    private final CamelProfileService profiles;
    private final OwnershipRecordService ownershipRecords;
    private final CamelAccessService access;

    @Autowired
    public CamelController(CamelService camelService, CamelAccessService access,
                           CamelProfileService profiles, OwnershipRecordService ownershipRecords) {
        this.camelService = camelService;
        this.profiles = profiles;
        this.ownershipRecords = ownershipRecords;
        this.access = access;
    }

    //Add API
    @PostMapping("add")
    public Long addCamel(@Valid @RequestBody CamelDTO dto, Authentication auth) {
        return access.create(dto, AccountAccess.requiredId(auth));
    }

    //Get all API
    @GetMapping("getAll")
    public PageResponse<CamelDTO> getAllCamels(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String breed,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) CamelStatus status
    ) {
        return PageResponse.from(
                camelService.searchCamels(
                        page,
                        size,
                        search,
                        gender,
                        breed,
                        category,
                        status
                ),
                CamelDTO::convertToDTO
        );
    }

    // My Camels API
    @GetMapping("my-camels")
    public List<CamelDTO> getMyCamels(Authentication auth) {
        Long userId = AccountAccess.requiredId(auth);

        return CamelDTO.convertToDTO(
                ownershipRecords.getMyCamels(userId)
        );
    }

    //Get By Id API
    @GetMapping("getById")
    public CamelDTO getById(@RequestParam Long id) {
        return CamelDTO.convertToDTO(camelService.getById(id));
    }

    //Full Profile API
    @GetMapping("profile")
    public CamelProfileDTO getProfile(@RequestParam Long id) {
        return profiles.getProfile(id);
    }

    //Ownership History API
    @GetMapping("ownership-history")
    public List<OwnershipHistoryDTO> getOwnershipHistory(@RequestParam Long id) {
        return ownershipRecords.getOwnershipHistory(id);
    }

    //Update API
    @PutMapping("update")
    public CamelDTO updateCamel(@Valid @RequestBody CamelDTO dto, Authentication auth) {
        access.requireOwner(dto.getCamelId(), AccountAccess.requiredId(auth));
        return CamelDTO.convertToDTO(
                camelService.updateCamel(
                        dto.getCamelId(),
                        dto.getName(),
                        dto.getGender(),
                        dto.getBirthDate(),
                        dto.getBreed(),
                        dto.getPhotoUrl(),
                        dto.getSire(),
                        dto.getDam(),
                        dto.getCategory(),
                        dto.getStatus()
                )
        );
    }

    //Delete API
    @DeleteMapping("deleteById")
    public Boolean deleteCamel(@RequestParam Long id, Authentication auth) {
        access.requireOwner(id, AccountAccess.requiredId(auth));
        return camelService.deleteById(id);
    }
}
