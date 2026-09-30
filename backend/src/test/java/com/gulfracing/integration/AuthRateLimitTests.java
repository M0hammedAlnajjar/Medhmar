package com.gulfracing.integration;

import com.gulfracing.security.*;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import static org.mockito.Mockito.*;

class AuthRateLimitTests {
    @Test
    void repeatedResetAttemptsAreLimitedWithoutTrustingForwardedHeaders() throws Exception {
        var errors = mock(SecurityErrorWriter.class);
        var chain = mock(FilterChain.class);
        var filter = new AuthRateLimitFilter(errors,true);
        for (int i=0;i<6;i++) {
            var request = new MockHttpServletRequest("POST","/api/auth/forgot-password");
            request.setServletPath("/api/auth/forgot-password");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For","192.0.2."+i);
            filter.doFilter(request,new MockHttpServletResponse(),chain);
        }
        verify(chain,times(5)).doFilter(any(),any());
        verify(errors).write(any(),eq(429),eq("RATE_LIMITED"),anyString());
    }
}
