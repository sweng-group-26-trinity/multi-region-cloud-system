package com.sweng.backend.menu;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository for {@link MenuItemEntity}. */
public interface MenuItemRepository extends JpaRepository<MenuItemEntity, UUID> {

  /**
   * Finds all menu items for a given restaurant.
   *
   * @param restaurantId the restaurant ID
   * @return list of menu items
   */
  List<MenuItemEntity> findByRestaurantId(UUID restaurantId);

  /**
   * Finds all available menu items for a given restaurant.
   *
   * @param restaurantId the restaurant ID
   * @return list of available menu items
   */
  List<MenuItemEntity> findByRestaurantIdAndIsAvailableTrue(UUID restaurantId);

  /**
   * Finds a menu item by its ID and restaurant ID.
   *
   * @param id the menu item ID
   * @param restaurantId the restaurant ID
   * @return optional menu item
   */
  java.util.Optional<MenuItemEntity> findByIdAndRestaurantId(UUID id, UUID restaurantId);
}