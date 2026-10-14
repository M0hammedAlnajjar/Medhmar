package com.gulfracing.integration;

import com.gulfracing.dto.OrganizationDtos;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.AuditLogRepository;
import com.gulfracing.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

class BackendIntegrityIntegrationTests extends IntegrationSupport {
    @Autowired OwnershipRecordService ownerships;
    @Autowired MarketPlaceService marketplace;
    @Autowired OrganizationService organizations;
    @Autowired AuditLogService auditLogs;
    @Autowired AuditLogRepository auditRepository;
    @Autowired AuditRecorder recorder;
    @Autowired PlatformTransactionManager transactionManager;

    @Test
    void ownershipCannotExceed100IncludingFutureOverlapsButAdjacentPeriodsAreAllowed() {
        var first = register("first@example.com", "OWNER");
        var second = register("second@example.com", "OWNER");
        var camel = camel("Ownership");
        Date start = Date.from(NOW), boundary = Date.from(NOW.plusSeconds(3600));
        ownerships.addOwnershipRecord(100.0, start, boundary, camel.getCamelId(), first.userId());
        assertThatThrownBy(() -> ownerships.addOwnershipRecord(1.0, start, null, camel.getCamelId(), second.userId()))
                .isInstanceOf(ApiException.class).hasMessageContaining("100");
        ownerships.addOwnershipRecord(100.0, boundary, null, camel.getCamelId(), second.userId());
        assertThatThrownBy(() -> ownerships.addOwnershipRecord(1.0, start, null, camel.getCamelId(), first.userId()))
                .isInstanceOf(ApiException.class);
        assertThat(jdbc.queryForObject("select count(*) from ownership_record", Integer.class)).isEqualTo(2);
    }

    @Test
    void concurrentListingsCreateOnlyOneActiveListing() throws Exception {
        var owner = register("seller@example.com", "OWNER");
        var camel = camel("Concurrent"); camel.setIsActive(true); camelRepository.saveAndFlush(camel);
        ownerships.addOwnershipRecord(100.0, Date.from(NOW), null, camel.getCamelId(), owner.userId());
        var start = new CountDownLatch(1);
        Callable<Boolean> create = () -> {
            start.await();
            try { marketplace.addMarketPlace(new BigDecimal("123.456"), "Test listing", camel.getCamelId(), owner.userId()); return true; }
            catch (ApiException ex) { return false; }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(create); var b = executor.submit(create); start.countDown();
            assertThat(java.util.List.of(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        }
        assertThat(jdbc.queryForObject("select count(*) from market_place where is_active=true", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select asking_price_omr from market_place", BigDecimal.class))
                .isEqualByComparingTo("123.456");
    }

    @Test
    void lastOrganizerCannotBeDemotedButCanAfterAnotherOrganizerIsAdded() {
        var owner = register("organizer@example.com");
        var other = register("second-org@example.com");
        users.updateRoles(owner.userId(), Set.of("ORGANIZER"));
        var org = organizations.create(new OrganizationDtos.Create("Race Club", "Muscat", null, "club@example.com"), owner.userId());
        assertThatThrownBy(() -> organizations.addMember(org.organizationId(),
                new OrganizationDtos.MemberRequest(owner.userId(), "VIEWER"), owner.userId()))
                .isInstanceOf(ApiException.class).hasMessageContaining("at least one");
        organizations.addMember(org.organizationId(), new OrganizationDtos.MemberRequest(other.userId(), "ORGANIZER"), owner.userId());
        organizations.addMember(org.organizationId(), new OrganizationDtos.MemberRequest(owner.userId(), "VIEWER"), owner.userId());
        assertThat(organizations.canManage(org.organizationId(), other.userId())).isTrue();
    }

    @Test
    void auditRecordsActorAndCannotBeChangedOrDeleted() {
        var actor = register("audit@example.com");
        Long id = recorder.record("TEST", "User", actor.userId(), null, actor.userId());
        var log = auditRepository.findById(id).orElseThrow();
        assertThat(log.getActorUserId()).isEqualTo(actor.userId());
        assertThat(log.getCreatedAt()).isEqualTo(NOW);
        assertThatThrownBy(() -> auditLogs.update(id, "EDIT", "User", actor.userId(), null, null))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> auditLogs.delete(id)).isInstanceOf(ApiException.class);
        assertThat(auditRepository.findById(id).orElseThrow().getActionType()).isEqualTo("TEST");
    }

    @Test
    void auditIsRolledBackWithBusinessTransaction() {
        var actor = register("rollback@example.com");
        long before = auditRepository.count();
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            recorder.record("ROLLBACK", "User", actor.userId(), null, actor.userId());
            tx.setRollbackOnly();
        });
        assertThat(auditRepository.count()).isEqualTo(before);
    }

    @Test
    void excessiveMonetaryPrecisionIsRejectedBeforePersistence() {
        assertThatThrownBy(() -> marketplace.addMarketPlace(new BigDecimal("1.0001"), "Bad precision", 1L, 1L))
                .isInstanceOf(ApiException.class);
    }
}
