package com.gulfracing.integration;

import com.gulfracing.dto.CamelDTO;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import com.gulfracing.service.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class CamelMutationConcurrencyIntegrationTests extends IntegrationSupport {
    @Autowired CamelAccessService access;
    @Autowired MarketPlaceService listings;
    @Autowired OfferService offers;
    @MockitoSpyBean CamelService mutations;

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void saleCannotPassBetweenOwnershipCheckAndMutation(boolean deletion) throws Exception {
        var seller = register("seller@example.com", "OWNER");
        var buyer = register("buyer@example.com", "OWNER");
        var session = login(seller.email());
        var request = CamelDTO.builder().name("Original Camel").gender(Gender.MALE)
                .birthDate(Date.from(Instant.parse("2020-01-01T00:00:00Z")))
                .breed("Omani").status(CamelStatus.ACTIVE).build();
        long camelId = access.create(request, seller.userId());
        request.setCamelId(camelId);
        request.setName("Updated Before Sale");
        long listing = listings.addMarketPlace(new BigDecimal("1000.000"), "Camel for sale", camelId, seller.userId());
        long offer = offers.addOffer(new BigDecimal("900.000"), listing, buyer.userId());

        var checked = new CountDownLatch(1);
        var resume = new CountDownLatch(1);
        Answer<Object> pauseMutation = invocation -> {
            checked.countDown();
            if (!resume.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Mutation was not released.");
            return invocation.callRealMethod();
        };
        if (deletion) doAnswer(pauseMutation).when(mutations).deleteById(camelId);
        else doAnswer(pauseMutation).when(mutations).updateCamel(eq(camelId), anyString(), any(), any(),
                any(), any(), any(), any(), any(), any());

        var executor = Executors.newFixedThreadPool(2);
        try {
            var mutation = executor.submit(() -> mvc.perform(deletion
                    ? delete("/camel/deleteById").param("id", Long.toString(camelId)).session(session).with(csrf())
                    : put("/camel/update").session(session).with(csrf()).contentType("application/json").content(payload(request)))
                    .andReturn().getResponse().getStatus());
            assertThat(checked.await(5, TimeUnit.SECONDS)).isTrue();
            var saleStarted = new CountDownLatch(1);
            var sale = executor.submit(() -> {
                saleStarted.countDown();
                return offers.acceptOffer(offer, seller.userId());
            });
            assertThat(saleStarted.await(5, TimeUnit.SECONDS)).isTrue();
            // The sale must wait for the mutation's authorization transaction.
            // Previously it could commit here, after the controller's ownership check.
            assertThatThrownBy(() -> sale.get(300, TimeUnit.MILLISECONDS)).isInstanceOf(TimeoutException.class);
            resume.countDown();
            assertThat(mutation.get(10, TimeUnit.SECONDS)).isEqualTo(deletion ? 409 : 200);
            sale.get(10, TimeUnit.SECONDS);
            assertThat(camelRepository.findById(camelId).orElseThrow().getIsActive()).isTrue();
            assertThat(jdbc.queryForObject("SELECT owner_id FROM ownership_record WHERE camel_id = ? AND is_active = true",
                    Long.class, camelId)).isEqualTo(buyer.userId());

            // The seller's existing session must now be denied for either operation.
            var denied = mvc.perform(deletion
                    ? delete("/camel/deleteById").param("id", Long.toString(camelId)).session(session).with(csrf())
                    : put("/camel/update").session(session).with(csrf()).contentType("application/json").content(payload(request)))
                    .andReturn().getResponse().getStatus();
            assertThat(denied).isEqualTo(403);
        } finally {
            resume.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();
        }
    }
}
