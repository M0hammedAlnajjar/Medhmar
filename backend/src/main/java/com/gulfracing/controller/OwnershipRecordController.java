package com.gulfracing.controller;

import com.gulfracing.dto.OwnershipRecordDTO;
import com.gulfracing.service.OwnershipRecordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("ownershipRecord")
public class OwnershipRecordController {
    OwnershipRecordService ownershipRecordService;

    @Autowired
    public OwnershipRecordController(OwnershipRecordService ownershipRecordService) {
        this.ownershipRecordService = ownershipRecordService;
    }

    //Add API
    @PostMapping("add")
    public Long addOwnershipRecord(@Valid @RequestBody OwnershipRecordDTO dto) {
        return ownershipRecordService.addOwnershipRecord(
                dto.getSharePercent(),
                dto.getStartAt(),
                dto.getEndAt(),
                dto.getCamelId(),
                dto.getOwnerId()
        );
    }

    //Get all API
    @GetMapping("getAll")
    public List<OwnershipRecordDTO> getAllOwnershipRecords() {
        return OwnershipRecordDTO.convertToDTO(ownershipRecordService.getAllOwnershipRecords()
        );
    }

    //Get By Id API
    @GetMapping("getById")
    public OwnershipRecordDTO getById(@RequestParam Long id) {
        return OwnershipRecordDTO.convertToDTO(ownershipRecordService.getById(id)
        );
    }

    //Update API
    @PutMapping("update")
    public OwnershipRecordDTO updateOwnershipRecord(
            @Valid @RequestBody OwnershipRecordDTO dto) {
        return OwnershipRecordDTO.convertToDTO(
                ownershipRecordService.updateOwnershipRecord(
                        dto.getOwnershipId(),
                        dto.getSharePercent(),
                        dto.getStartAt(),
                        dto.getEndAt()
                )
        );
    }

    //Delete API
    @DeleteMapping("deleteById")
    public Boolean deleteOwnershipRecord(@RequestParam Long id) {
        return ownershipRecordService.deleteById(id);
    }
}
