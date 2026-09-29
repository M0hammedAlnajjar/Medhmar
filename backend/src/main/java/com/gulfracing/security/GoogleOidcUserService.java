package com.gulfracing.security;

import com.gulfracing.service.GoogleAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.*;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoogleOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {
    private final GoogleAccountService accounts;
    private final OidcUserService delegate = new OidcUserService();
    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        if (!"google".equals(request.getClientRegistration().getRegistrationId()))
            throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        // Spring validates the issuer, audience, signature and nonce before this user service is called.
        OidcUser verified = delegate.loadUser(request);
        try {
            return accounts.provision(verified);
        } catch (RuntimeException ex) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_unavailable"),
                "Google sign-in could not be completed.", ex);
        }
    }
}
