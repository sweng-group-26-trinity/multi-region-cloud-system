package com.sweng.backend.order;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repository for managing {@link OrderEntity} persistence. */
@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {}
