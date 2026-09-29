package com.gulfracing.repository;

import com.gulfracing.entity.*;
import org.springframework.data.jpa.repository.*;
import java.util.List;

public interface ChallengeCamelRepository extends JpaRepository<ChallengeCamel, ChallengeCamelId> {
    @EntityGraph(attributePaths = "camel")
    List<ChallengeCamel> findById_ChallengeIdOrderById_CamelIdAsc(Long challengeId);
    long countById_ChallengeId(Long challengeId);
}
