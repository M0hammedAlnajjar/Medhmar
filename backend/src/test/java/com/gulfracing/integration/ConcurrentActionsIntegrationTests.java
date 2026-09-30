package com.gulfracing.integration;

import com.gulfracing.exception.ApiException;
import com.gulfracing.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ConcurrentActionsIntegrationTests extends IntegrationSupport {
    @Test
    void concurrentVotesProduceExactlyOneVoteAndDatabaseAlsoEnforcesUniqueness() throws Exception {
        var user = register("vote@example.com");
        var first = camel("First"); var second = camel("Second");
        long id = openChallenge(user.userId(),first.getCamelId(),second.getCamelId()).challengeId();
        var results = race(() -> challenges.vote(id,first.getCamelId(),user.userId()),
                           () -> challenges.vote(id,second.getCamelId(),user.userId()));
        assertThat(results).containsExactlyInAnyOrder(true,false);
        assertThat(voteRepository.count()).isEqualTo(1);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO votes (voted_at,user_id,challenge_id,camel_id) VALUES (?,?,?,?)",
            Timestamp.from(NOW),user.userId(),id,first.getCamelId())).isInstanceOf(DataIntegrityViolationException.class);
        var outsider = camel("Outside");
        var other = register("other@example.com");
        assertThatThrownBy(() -> jdbc.update("INSERT INTO votes (voted_at,user_id,challenge_id,camel_id) VALUES (?,?,?,?)",
            Timestamp.from(NOW),other.userId(),id,outsider.getCamelId())).isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test
    void concurrentResetRequestsCannotReuseTheSameToken() throws Exception {
        var user = register("reset@example.com");
        resets.requestReset(user.email());
        var token = ArgumentCaptor.forClass(String.class);
        verify(mail,timeout(2000)).send(eq(user.email()),token.capture());
        var results = race(() -> resets.reset(token.getValue(),"ReplacementPassword123!"),
                           () -> resets.reset(token.getValue(),"AnotherPassword123!"));
        assertThat(results).containsExactlyInAnyOrder(true,false);
        assertThat(userRepository.findById(user.userId()).orElseThrow().getSecurityVersion()).isEqualTo(1);
        assertThat(resetRepository.findByTokenHash(PasswordResetService.hash(token.getValue())).orElseThrow().getUsedAt()).isNotNull();
    }
    private List<Boolean> race(Runnable first, Runnable second) throws Exception {
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(() -> attempt(start,first));
            var b = executor.submit(() -> attempt(start,second));
            start.countDown();
            return List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));
        }
    }
    private boolean attempt(CountDownLatch start,Runnable action) throws InterruptedException {
        start.await();
        try { action.run(); return true; }
        catch (ApiException expected) { return false; }
    }
}
