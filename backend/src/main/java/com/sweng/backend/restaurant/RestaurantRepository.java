package com.sweng.backend.restaurant;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository for {@link RestaurantEntity}. */
public interface RestaurantRepository extends JpaRepository<RestaurantEntity, UUID> {

  /**
   * Finds active restaurants using pagination.
   *
   * @param pageable paging + sorting configuration
   * @return page of active restaurants
   */
  Page<RestaurantEntity> findByIsActiveTrue(Pageable pageable);
}
