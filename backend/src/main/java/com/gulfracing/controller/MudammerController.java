package com.gulfracing.controller;
import com.gulfracing.dto.MudammerDTO;
import com.gulfracing.service.MudammerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mudammer")
@RequiredArgsConstructor
public class MudammerController {

    private final MudammerService mudammerService;

    @PostMapping("/add")
    public Long addMudammer(
            @Valid @RequestBody MudammerDTO dto
    ) {
        return mudammerService.create(
                dto.getProposedAt(),
                dto.getStartsAt(),
                dto.getEndsAt(),
                dto.getFeeOmr(),
                dto.getOfferedSharePct(),
                dto.getStatus(),
                dto.getAcceptedAt(),
                dto.getUserId(),
                dto.getTrainerId(),
                dto.getCamelId()
        );
    }

    @GetMapping("/getAll")
    public List<MudammerDTO> getAllMudammers() {
        return MudammerDTO.convertToDTO(
                mudammerService.getAll()
        );
    }

    @GetMapping("/getById")
    public MudammerDTO getById(
            @RequestParam Long id
    ) {
        return MudammerDTO.convertToDTO(
                mudammerService.getById(id)
        );
    }

    @PutMapping("/update")
    public MudammerDTO updateMudammer(
            @Valid @RequestBody MudammerDTO dto
    ) {
        return MudammerDTO.convertToDTO(
                mudammerService.update(
                        dto.getAgreementId(),
                        dto.getProposedAt(),
                        dto.getStartsAt(),
                        dto.getEndsAt(),
                        dto.getFeeOmr(),
                        dto.getOfferedSharePct(),
                        dto.getStatus(),
                        dto.getAcceptedAt(),
                        dto.getUserId(),
                        dto.getTrainerId(),
                        dto.getCamelId()
                )
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteMudammer(
            @RequestParam Long id
    ) {
        return mudammerService.delete(id);
    }
}
