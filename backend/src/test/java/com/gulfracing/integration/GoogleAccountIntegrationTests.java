package com.gulfracing.integration;

import com.gulfracing.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class GoogleAccountIntegrationTests extends IntegrationSupport {
    @Test
    void googleIdentityIsKeyedBySubjectAndGetsOnlyViewerRole() {
        var first = googleAccounts.provision(verified("google-sub-1","google@example.com",true));
        var again = googleAccounts.provision(verified("google-sub-1","changed@example.com",true));
        assertThat(first.getUserId()).isEqualTo(again.getUserId());
        assertThat(userRepository.count()).isEqualTo(1);
        assertThat(accountRepository.count()).isEqualTo(1);
        assertThat(first.getAuthorities()).extracting("authority").containsExactly("ROLE_VIEWER");
    }
    @Test
    void unverifiedGoogleEmailAndSilentLinkingAreRejected() {
        register("local@example.com");
        assertThatThrownBy(() -> googleAccounts.provision(verified("new-sub","local@example.com",true)))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> googleAccounts.provision(verified("other-sub","new@example.com",false)))
            .isInstanceOf(ApiException.class);
        assertThat(userRepository.count()).isEqualTo(1);
    }
    private OidcUser verified(String sub,String email,boolean emailVerified) {
        var token = new OidcIdToken("test-only-token",NOW,NOW.plusSeconds(3600),
            Map.of("sub",sub,"email",email,"email_verified",emailVerified,"name","Google User",
                "iss","https://accounts.google.com","aud",List.of("test-client")));
        return new DefaultOidcUser(List.of(new SimpleGrantedAuthority("OIDC_USER")),token);
    }
}
