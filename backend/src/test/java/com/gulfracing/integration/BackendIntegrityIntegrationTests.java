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
    void auditHistoryIsFilteredAndPaginatedOnTheServer() {
        var actor = register("audit-pagination@example.com");
        recorder.record("AUDIT_PAGE_TEST", "Camel", actor.userId(), null, actor.userId());
        recorder.record("AUDIT_PAGE_TEST", "User", actor.userId(), null, actor.userId());
        recorder.record("AUDIT_PAGE_TEST", "User", actor.userId(), null, actor.userId());

        var first = auditLogs.list(0, 1, "AUDIT_PAGE_TEST", "User", actor.userId(),
                NOW.minusSeconds(60), NOW.plusSeconds(60));
        assertThat(first.totalElements()).isEqualTo(2);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.content()).hasSize(1);
        assertThat(first.content().getFirst().getActorUserId()).isEqualTo(actor.userId());
        assertThat(first.content().getFirst().getEntityType()).isEqualTo("User");

        var next = auditLogs.list(1, 1, "AUDIT_PAGE_TEST", "User", actor.userId(), null, null);
        assertThat(next.content()).hasSize(1);
        assertThat(next.content().getFirst().getAuditId())
                .isLessThan(first.content().getFirst().getAuditId());

        assertThat(auditLogs.list(0, 20, "NO_SUCH_ACTION", null, null, null, null)
                .totalElements()).isZero();
        assertThatThrownBy(() -> auditLogs.list(0, 20, null, null, null,
                NOW.plusSeconds(60), NOW.minusSeconds(60)))
                .isInstanceOf(ApiException.class);
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

    @Autowired OfferService offerService;
    @Autowired com.gulfracing.repository.OfferRepository offers;
    @Autowired com.gulfracing.repository.MarketPlaceRepository listings;

    @Test
    void saleCannotOverwriteScheduledFutureOwnership() {
        var seller = register("scheduled-seller@example.com", "OWNER");
        var buyer = register("scheduled-buyer@example.com", "OWNER");
        var future = register("future-owner@example.com", "OWNER");
        var camel = camel("Scheduled"); camel.setIsActive(true); camelRepository.saveAndFlush(camel);
        Date boundary = Date.from(NOW.plusSeconds(3600));
        ownerships.addOwnershipRecord(100.0, Date.from(NOW), boundary, camel.getCamelId(), seller.userId());
        ownerships.addOwnershipRecord(100.0, boundary, null, camel.getCamelId(), future.userId());
        Long listing = marketplace.addMarketPlace(new BigDecimal("10.125"), "Scheduled listing", camel.getCamelId(), seller.userId());
        Long offer = offerService.addOffer(new BigDecimal("10.125"), listing, buyer.userId());
        assertThatThrownBy(() -> offerService.acceptOffer(offer, seller.userId()))
                .isInstanceOf(ApiException.class).hasMessageContaining("scheduled");
        assertThat(jdbc.queryForObject("select count(*) from sale_transaction", Integer.class)).isZero();
    }

    @Test
    void acceptWaitsForWithdrawalAndCannotAcceptTheWithdrawnOffer() throws Exception {
        var seller = register("concurrent-seller@example.com", "OWNER");
        var buyer = register("concurrent-buyer@example.com", "OWNER");
        var camel = camel("Withdrawal"); camel.setIsActive(true); camelRepository.saveAndFlush(camel);
        ownerships.addOwnershipRecord(100.0, Date.from(NOW), null, camel.getCamelId(), seller.userId());
        Long listing = marketplace.addMarketPlace(new BigDecimal("50.001"), "Concurrent offer", camel.getCamelId(), seller.userId());
        Long offerId = offerService.addOffer(new BigDecimal("50.001"), listing, buyer.userId());
        var locked = new CountDownLatch(1); var release = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var withdrawal = executor.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
                listings.findLockedById(listing).orElseThrow();
                offers.findById(offerId).orElseThrow().setIsActive(false); offers.flush();
                locked.countDown();
                try {
                    if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Test timeout");
                } catch (InterruptedException ex) { throw new IllegalStateException(ex); }
            }));
            try {
                assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
                var accepting = executor.submit(() -> offerService.acceptOffer(offerId, seller.userId()));
                assertThatThrownBy(() -> accepting.get(500, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
                release.countDown(); withdrawal.get(10, TimeUnit.SECONDS);
                assertThatThrownBy(() -> accepting.get(10, TimeUnit.SECONDS))
                        .isInstanceOf(ExecutionException.class).hasCauseInstanceOf(ApiException.class);
                assertThat(jdbc.queryForObject("select count(*) from sale_transaction", Integer.class)).isZero();
            } finally { release.countDown(); }
        }
    }
}
