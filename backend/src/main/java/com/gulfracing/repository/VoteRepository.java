package com.gulfracing.repository;

import com.gulfracing.entity.Vote;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    boolean existsByUser_UserIdAndChallengeCamel_Id_ChallengeId(Long userId, Long challengeId);
    @Query("select v.challengeCamel.id.camelId as camelId, count(v) as voteCount from Vote v " +
           "where v.challengeCamel.id.challengeId = :id group by v.challengeCamel.id.camelId")
    List<VoteCount> countVotes(@Param("id") Long challengeId);
    interface VoteCount {
        Long getCamelId();
        long getVoteCount();
    }
}
