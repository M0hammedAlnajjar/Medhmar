
package com.gulfracing.security;

import com.gulfracing.exception.ApiException;
import com.gulfracing.service.GoogleAccountService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.oidc.userinfo.*;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class GoogleOidcUserService
        implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final GoogleAccountService accounts;
    private final OidcUserService delegate = new OidcUserService();

    @Override
    public OidcUser loadUser(OidcUserRequest request)
            throws OAuth2AuthenticationException {

        if (!"google".equals(
                request.getClientRegistration().getRegistrationId())) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unsupported_provider")
            );
        }

        // Spring validates the Google identity before this service is called.
        OidcUser verified = delegate.loadUser(request);

        HttpServletRequest httpRequest = null;

        if (RequestContextHolder.getRequestAttributes()
                instanceof ServletRequestAttributes attributes) {
            httpRequest = attributes.getRequest();
        }

        // Retrieve and remove the selected signup role from the session.
        String selectedRole = httpRequest == null
                ? null
                : GoogleSignupIntent.consume(httpRequest);

        try {
            return accounts.provision(verified, selectedRole);
        } catch (ApiException ex) {
            // Only an account conflict receives the account_exists code.
            String code = ex.getStatus() == HttpStatus.CONFLICT
                    ? "account_exists"
                    : "account_unavailable";

            throw new OAuth2AuthenticationException(
                    new OAuth2Error(code),
                    "Google sign-in could not be completed.",
                    ex
            );
        } catch (RuntimeException ex) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("account_unavailable"),
                    "Google sign-in could not be completed.",
                    ex
            );
        }
    }
}
