package com.gulfracing.repository;

import com.gulfracing.entity.Camel;
import org.springframework.data.jpa.repository.JpaRepository;

// Shared lookup for challenge participation; camel CRUD belongs to the camel module.
public interface CamelRepository extends JpaRepository<Camel, Long> {}
