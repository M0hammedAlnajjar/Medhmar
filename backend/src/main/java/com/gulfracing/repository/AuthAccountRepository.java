package com.gulfracing.repository;

import com.gulfracing.entity.AuthAccount;
import com.gulfracing.enums.Provider;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface AuthAccountRepository extends JpaRepository<AuthAccount, Long> {
    @EntityGraph(attributePaths = {"user", "user.roles"})
    Optional<AuthAccount> findByProviderAndProviderSubject(Provider provider, String subject);
    Optional<AuthAccount> findByUser_UserIdAndProvider(Long userId, Provider provider);
    @Query("select a.user.userId from AuthAccount a where a.provider = :provider and a.providerSubject = :subject")
    Optional<Long> findUserIdByIdentity(@Param("provider") Provider provider, @Param("subject") String subject);
}
