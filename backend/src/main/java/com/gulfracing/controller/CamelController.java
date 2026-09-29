package com.gulfracing.controller;

import com.gulfracing.dto.CamelDTO;
import com.gulfracing.entity.Camel;
import com.gulfracing.service.CamelService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("camel")
public class CamelController {

    CamelService camelService;

    @Autowired
    public CamelController(CamelService camelService) {
        this.camelService = camelService;
    }

    //Add API
    @PostMapping("add")
    public Long addCamel(@Valid @RequestBody CamelDTO dto) {
        return camelService.addCamel(
                dto.getName(),
                dto.getGender(),
                dto.getBirthDate(),
                dto.getBreed(),
                dto.getPhotoUrl(),
                dto.getStatus()
        );
    }

    //Get all API
    @GetMapping("getAll")
    public List<CamelDTO> getAllCamels() {
        List<CamelDTO> camels = CamelDTO.convertToDTO(camelService.getAllCamels());
        return camels;
    }

    //Get By Id API
    @GetMapping("getById")
    public CamelDTO getById(@RequestParam Long id) {
        return CamelDTO.convertToDTO(camelService.getById(id));
    }

    //Update API
    @PutMapping("update")
    public CamelDTO updateCamel(@Valid @RequestBody CamelDTO dto) {
        return CamelDTO.convertToDTO(
                camelService.updateCamel(
                        dto.getCamelId(),
                        dto.getName(),
                        dto.getGender(),
                        dto.getBirthDate(),
                        dto.getBreed(),
                        dto.getPhotoUrl(),
                        dto.getStatus()
                )
        );
    }

    //Delete API
    @DeleteMapping("deleteById")
    public Boolean deleteCamel(@RequestParam Long id) {
        return camelService.deleteById(id);
    }
}