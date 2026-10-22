package com.gulfracing.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResourceRateLimitFilterTests {
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test
    void photoLimitFollowsAccountAcrossAddressesAndExpires() throws Exception {
        var errors = mock(SecurityErrorWriter.class);
        var chain = mock(FilterChain.class);
        var ticks = new AtomicLong();
        var filter = new ResourceRateLimitFilter(errors, true, ticks::get);
        var principal = mock(PlatformPrincipal.class);
        when(principal.getUserId()).thenReturn(7L);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of()));
        MockHttpServletResponse last = null;
        for (int i = 0; i < 6; i++) {
            last = new MockHttpServletResponse();
            filter.doFilter(photoRequest("192.0.2." + i), last, chain);
        }
        verify(chain, times(5)).doFilter(any(), any());
        verify(errors).write(any(), eq(429), eq("RESOURCE_RATE_LIMITED"), anyString());
        assertThat(last.getHeader("Retry-After")).isEqualTo("900");
        ticks.set(Duration.ofMinutes(15).plusSeconds(1).toNanos());
        filter.doFilter(photoRequest("192.0.2.7"), new MockHttpServletResponse(), chain);
        verify(chain, times(6)).doFilter(any(), any());
    }

    @Test
    void ipBudgetAlsoLimitsUploadsWithoutAuthentication() throws Exception {
        var errors = mock(SecurityErrorWriter.class);
        var chain = mock(FilterChain.class);
        var filter = new ResourceRateLimitFilter(errors, true);
        for (int i = 0; i < 21; i++) {
            var request = photoRequest("192.0.2.80");
            request.addHeader("X-Forwarded-For", "198.51.100." + i);
            filter.doFilter(request, new MockHttpServletResponse(), chain);
        }
        verify(chain, times(20)).doFilter(any(), any());
        verify(errors).write(any(), eq(429), eq("RESOURCE_RATE_LIMITED"), anyString());
    }

    private static MockHttpServletRequest photoRequest(String ip) {
        var request = new MockHttpServletRequest("POST", "/trainer-profile/photo");
        request.setServletPath("/trainer-profile/photo");
        request.setRemoteAddr(ip);
        return request;
    }
}
