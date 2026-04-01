package com.sweng.backend.menu;

import com.sweng.backend.menu.dto.CreateMenuItemRequest;
import com.sweng.backend.menu.dto.MenuItemDto;
import com.sweng.backend.menu.dto.MenuItemListResponse;
import com.sweng.backend.menu.dto.UpdateMenuItemRequest;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** REST controller for menu item endpoints. */
@RestController
@RequestMapping("/api/restaurants/{restaurantId}/menu")
public class MenuItemController {

  private final MenuItemRepository repository;

  public MenuItemController(MenuItemRepository repository) {
    this.repository = repository;
  }

  /** Get all menu items for a restaurant. */
  @GetMapping
  public ResponseEntity<MenuItemListResponse> getMenu(
      @PathVariable String restaurantId,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Boolean availableOnly) {

    UUID rid = parseUuidOr400(restaurantId);

    List<MenuItemEntity> items;

    if (category != null && !category.isBlank()) {
      items =
          Boolean.TRUE.equals(availableOnly)
              ? repository.findByRestaurantIdAndCategoryAndIsAvailableTrue(rid, category)
              : repository.findByRestaurantIdAndCategory(rid, category);
    } else {
      items =
          Boolean.TRUE.equals(availableOnly)
              ? repository.findByRestaurantIdAndIsAvailableTrue(rid)
              : repository.findByRestaurantId(rid);
    }

    List<MenuItemDto> dtoList = items.stream().map(MenuItemController::toDto).toList();

    return ResponseEntity.ok(new MenuItemListResponse(dtoList));
  }

  /** Create a menu item for a restaurant. */
  @PostMapping
  public ResponseEntity<MenuItemDto> createMenuItem(
      @PathVariable String restaurantId, @Valid @RequestBody CreateMenuItemRequest body) {

    UUID rid = parseUuidOr400(restaurantId);

    MenuItemEntity e = new MenuItemEntity();
    e.setRestaurantId(rid);
    e.setName(body.getName());
    e.setDescription(body.getDescription());
    e.setCategory(body.getCategory());
    e.setPrice(body.getPrice());
    e.setImageUrl(body.getImageUrl());

    if (body.getIsAvailable() != null) {
      e.setAvailable(body.getIsAvailable());
    }

    MenuItemEntity saved = repository.save(e);
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
  }

  /** Get a single menu item. */
  @GetMapping("/{menuItemId}")
  public ResponseEntity<MenuItemDto> getMenuItem(
      @PathVariable String restaurantId, @PathVariable String menuItemId) {

    UUID rid = parseUuidOr400(restaurantId);
    UUID mid = parseUuidOr400(menuItemId);

    MenuItemEntity item =
        repository
            .findByIdAndRestaurantId(mid, rid)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

    return ResponseEntity.ok(toDto(item));
  }

  /** Update a menu item. */
  @PutMapping("/{menuItemId}")
  public ResponseEntity<MenuItemDto> updateMenuItem(
      @PathVariable String restaurantId,
      @PathVariable String menuItemId,
      @Valid @RequestBody UpdateMenuItemRequest body) {

    UUID rid = parseUuidOr400(restaurantId);
    UUID mid = parseUuidOr400(menuItemId);

    MenuItemEntity item =
        repository
            .findByIdAndRestaurantId(mid, rid)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

    if (body.getName() != null) item.setName(body.getName());
    if (body.getDescription() != null) item.setDescription(body.getDescription());
    if (body.getCategory() != null) item.setCategory(body.getCategory());
    if (body.getPrice() != null) item.setPrice(body.getPrice());
    if (body.getImageUrl() != null) item.setImageUrl(body.getImageUrl());
    if (body.getIsAvailable() != null) item.setAvailable(body.getIsAvailable());

    MenuItemEntity saved = repository.save(item);
    return ResponseEntity.ok(toDto(saved));
  }

  /** Delete a menu item. */
  @DeleteMapping("/{menuItemId}")
  public ResponseEntity<Void> deleteMenuItem(
      @PathVariable String restaurantId, @PathVariable String menuItemId) {

    UUID rid = parseUuidOr400(restaurantId);
    UUID mid = parseUuidOr400(menuItemId);

    MenuItemEntity item =
        repository
            .findByIdAndRestaurantId(mid, rid)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

    repository.delete(item);
    return ResponseEntity.noContent().build();
  }

  /** Converts entity → DTO. */
  private static MenuItemDto toDto(MenuItemEntity e) {
    MenuItemDto dto = new MenuItemDto();
    dto.setId(e.getId().toString());
    dto.setRestaurantId(e.getRestaurantId().toString());
    dto.setName(e.getName());
    dto.setDescription(e.getDescription());
    dto.setCategory(e.getCategory());
    dto.setPrice(e.getPrice());
    dto.setImageUrl(e.getImageUrl());
    dto.setIsAvailable(e.isAvailable());
    dto.setCreatedAt(OffsetDateTime.ofInstant(e.getCreatedAt(), ZoneOffset.UTC));
    dto.setUpdatedAt(OffsetDateTime.ofInstant(e.getUpdatedAt(), ZoneOffset.UTC));
    return dto;
  }

  private static UUID parseUuidOr400(String raw) {
    try {
      return UUID.fromString(raw);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ID");
    }
  }
}
