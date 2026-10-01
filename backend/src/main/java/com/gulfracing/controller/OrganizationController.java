package com.gulfracing.controller;

import com.gulfracing.dto.OrganizationDtos.*;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService organizations;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public View create(@Valid @RequestBody Create request, Authentication auth) {
        return organizations.create(request, AccountAccess.requiredId(auth));
    }

    @GetMapping
    public List<View> list() { return organizations.list(); }

    @GetMapping("/{id}")
    public View get(@PathVariable Long id) { return organizations.get(id); }

    @PutMapping("/{id}")
    public View update(@PathVariable Long id, @Valid @RequestBody Update request, Authentication auth) {
        return organizations.update(id, request, AccountAccess.requiredId(auth));
    }

    @GetMapping("/{id}/members")
    public List<MemberView> members(@PathVariable Long id) { return organizations.listMembers(id); }

    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberView addMember(@PathVariable Long id, @Valid @RequestBody MemberRequest request, Authentication auth) {
        return organizations.addMember(id, request, AccountAccess.requiredId(auth));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable Long id, @PathVariable Long userId, Authentication auth) {
        organizations.removeMember(id, userId, AccountAccess.requiredId(auth));
    }
}
