package com.gulfracing.repository;

import com.gulfracing.entity.Pedigree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedigreeRepository extends JpaRepository<Pedigree, Long> {

    Optional<Pedigree> findByCamel_CamelId(Long camelId);

    List<Pedigree> findBySireCamel_CamelId(Long camelId);

    List<Pedigree> findByDamCamel_CamelId(Long camelId);
}
