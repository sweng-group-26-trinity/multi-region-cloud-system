package com.sweng.backend.order;

import com.sweng.backend.order.dto.CreateOrderItemRequest;
import com.sweng.backend.order.dto.CreateOrderRequest;
import com.sweng.backend.order.dto.OrderDto;
import com.sweng.backend.order.dto.OrderItemDto;
import com.sweng.backend.order.dto.UpdateOrderRequest;
import com.sweng.backend.restaurant.RestaurantRepository;
import com.sweng.backend.user.UserRepository;
import com.sweng.backend.util.ValidationUtils;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for order endpoints.
 *
 * <p>Implements the OpenAPI Orders API using JPA persistence.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

  private final OrderRepository orderRepository;
  private final RestaurantRepository restaurantRepository;
  private final UserRepository userRepository;

  /**
   * Constructs the controller.
   *
   * @param orderRepository order repository
   * @param restaurantRepository restaurant repository (used for existence checks)
   * @param userRepository user repository (used to resolve authenticated user UUID)
   */
  public OrderController(
      OrderRepository orderRepository,
      RestaurantRepository restaurantRepository,
      UserRepository userRepository) {
    this.orderRepository = orderRepository;
    this.restaurantRepository = restaurantRepository;
    this.userRepository = userRepository;
  }

  /**
   * List orders (optionally filtered by restaurantId, userId, status).
   *
   * <p>Spec rule: users can only see their own orders unless ADMIN or RESTAURANT_OWNER.
   *
   * @param restaurantId optional filter by restaurant ID
   * @param userId optional filter by user ID
   * @param status optional filter by order status
   * @return list of orders wrapped in a data object
   */
  @GetMapping
  public ResponseEntity<?> getOrders(
      @RequestParam(required = false) String restaurantId,
      @RequestParam(required = false) String userId,
      @RequestParam(required = false) String status) {

    // For now: simple in-memory filtering after fetching all.
    // (You can optimize later with repository methods.)
    List<OrderEntity> all = orderRepository.findAll();

    AuthContext auth = requireAuth();

    boolean isAdmin = auth.hasRole("ROLE_ADMIN");
    boolean isOwner = auth.hasRole("ROLE_RESTAURANT_OWNER");

    UUID restaurantUuid =
        restaurantId != null ? parseUuidOr400(restaurantId, "restaurantId") : null;
    UUID userUuid = userId != null ? parseUuidOr400(userId, "userId") : null;
    OrderStatus st = status != null ? parseStatusOr400(status) : null;

    List<OrderEntity> filtered =
        all.stream()
            .filter(
                o -> {
                  if (restaurantUuid != null && !restaurantUuid.equals(o.getRestaurantId()))
                    return false;
                  if (st != null && st != o.getStatus()) return false;

                  // Visibility rule
                  if (isAdmin || isOwner) {
                    // can view all (but still allow explicit userId filter)
                    if (userUuid != null) {
                      return userUuid.equals(o.getCustomerId());
                    }
                    return true;
                  }

                  // Normal user: only their own orders
                  UUID me = auth.userUid;
                  if (me == null) return false;
                  if (!me.equals(o.getCustomerId())) return false;

                  // If userId filter present, it must match
                  return userUuid == null || userUuid.equals(o.getCustomerId());
                })
            .toList();

    // Spec response shape is { data: [...] }
    return ResponseEntity.ok(
        java.util.Map.of("data", filtered.stream().map(OrderController::toDto).toList()));
  }

  /**
   * Create a new order.
   *
   * <p>Spec: customer must be authenticated; must contain at least one item.
   *
   * @param body the order creation request
   * @return the created order
   */
  @PostMapping
  public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequest body) {
    AuthContext auth = requireAuth();

    UUID restaurantUuid = parseUuidOr400(body.getRestaurantId(), "restaurantId");

    // Validate restaurant exists
    if (!restaurantRepository.existsById(restaurantUuid)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid restaurantId");
    }

    if (body.getItems() == null || body.getItems().isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Order must contain at least one item");
    }

    ValidationUtils.rejectNullBytes(body.getCustomerName(), "customerName");
    ValidationUtils.rejectNullBytes(body.getCustomerEmail(), "customerEmail");
    ValidationUtils.rejectNullBytes(body.getSpecialInstructions(), "specialInstructions");
    for (CreateOrderItemRequest item : body.getItems()) {
      if (item == null) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Order items cannot contain null");
      }
      ValidationUtils.rejectNullBytes(item.getItemId(), "itemId");
    }

    OrderEntity e = new OrderEntity();
    e.setRestaurantId(restaurantUuid);
    e.setCustomerId(auth.userUid); // authenticated user
    e.setCustomerName(body.getCustomerName());
    e.setCustomerEmail(body.getCustomerEmail());
    e.setSpecialInstructions(body.getSpecialInstructions());
    e.setStatus(OrderStatus.pending);

    // Map items
    List<OrderItemEmbeddable> items =
        body.getItems().stream()
            .map(OrderController::toEmbeddable)
            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

    // Compute totals
    items.forEach(OrderController::computeSubtotalIfMissing);
    BigDecimal total =
        items.stream()
            .map(OrderItemEmbeddable::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    e.setItems(items);
    e.setTotalAmount(total);

    OrderEntity saved = orderRepository.save(e);
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
  }

  /**
   * Handle GET with empty orderId (trailing slash) - return 400.
   *
   * @return never returns normally, throws 400 error
   */
  @GetMapping("/")
  public ResponseEntity<Void> getOrderNoId() {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId is required");
  }

  /**
   * Get a specific order by ID with visibility rules.
   *
   * @param orderId the order ID
   * @return the order details
   */
  @GetMapping("/{orderId}")
  public ResponseEntity<OrderDto> getOrder(@PathVariable String orderId) {
    AuthContext auth = requireAuth();
    UUID id = parseUuidOr400(orderId, "orderId");

    OrderEntity found =
        orderRepository
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    enforceVisibility(auth, found);

    return ResponseEntity.ok(toDto(found));
  }

  /**
   * Handle PUT with empty orderId - return 405.
   *
   * @return 405 Method Not Allowed with Allow header
   */
  @PutMapping({"", "/"})
  public ResponseEntity<String> updateOrderNoId() {
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .header("Allow", "GET, POST")
        .body("Method PUT not allowed on /orders");
  }

  /**
   * Update an order.
   *
   * <p>Spec: Only allowed for orders in 'pending' status unless user has ADMIN role.
   *
   * @param orderId the order ID to update
   * @param body the update request body
   * @return the updated order
   */
  @PutMapping("/{orderId}")
  public ResponseEntity<OrderDto> updateOrder(
      @PathVariable String orderId, @Valid @RequestBody UpdateOrderRequest body) {

    AuthContext auth = requireAuth();
    UUID id = parseUuidOr400(orderId, "orderId");

    OrderEntity found =
        orderRepository
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    enforceVisibility(auth, found);

    boolean isAdmin = auth.hasRole("ROLE_ADMIN");

    if (!isAdmin && found.getStatus() != OrderStatus.pending) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only pending orders can be updated");
    }

    if (body.getCustomerName() != null) found.setCustomerName(body.getCustomerName());
    if (body.getCustomerEmail() != null) found.setCustomerEmail(body.getCustomerEmail());
    if (body.getSpecialInstructions() != null)
      found.setSpecialInstructions(body.getSpecialInstructions());

    ValidationUtils.rejectNullBytes(body.getCustomerName(), "customerName");
    ValidationUtils.rejectNullBytes(body.getCustomerEmail(), "customerEmail");
    ValidationUtils.rejectNullBytes(body.getSpecialInstructions(), "specialInstructions");

    if (body.getItems() != null) {
      if (body.getItems().isEmpty()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Order must contain at least one item");
      }
      for (CreateOrderItemRequest item : body.getItems()) {
        if (item == null) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST, "Order items cannot contain null");
        }
        ValidationUtils.rejectNullBytes(item.getItemId(), "itemId");
      }
      List<OrderItemEmbeddable> items =
          body.getItems().stream()
              .map(OrderController::toEmbeddable)
              .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
      items.forEach(OrderController::computeSubtotalIfMissing);
      BigDecimal total =
          items.stream()
              .map(OrderItemEmbeddable::getSubtotal)
              .reduce(BigDecimal.ZERO, BigDecimal::add);
      found.getItems().clear();
      found.getItems().addAll(items);
      found.setTotalAmount(total);
    }

    if (body.getStatus() != null) {
      found.setStatus(parseStatusOr400(body.getStatus()));
    }

    OrderEntity saved = orderRepository.save(found);
    return ResponseEntity.ok(toDto(saved));
  }

  /**
   * Handle DELETE with empty orderId - return 405.
   *
   * @return 405 Method Not Allowed with Allow header
   */
  @DeleteMapping({"", "/"})
  public ResponseEntity<String> deleteOrderNoId() {
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .header("Allow", "GET, POST")
        .body("Method DELETE not allowed on /orders");
  }

  /**
   * Delete (cancel) an order.
   *
   * <p>Spec: Only the order owner or users with ADMIN/RESTAURANT_OWNER role can delete orders.
   *
   * @param orderId the order ID to delete
   * @return 204 No Content on success
   */
  @DeleteMapping("/{orderId}")
  public ResponseEntity<Void> deleteOrder(@PathVariable String orderId) {
    AuthContext auth = requireAuth();
    UUID id = parseUuidOr400(orderId, "orderId");

    OrderEntity found =
        orderRepository
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    enforceVisibility(auth, found);

    orderRepository.deleteById(found.getId());
    return ResponseEntity.noContent().build();
  }

  private static void enforceVisibility(AuthContext auth, OrderEntity order) {
    boolean isAdmin = auth.hasRole("ROLE_ADMIN");
    boolean isOwner = auth.hasRole("ROLE_RESTAURANT_OWNER");

    if (isAdmin || isOwner) {
      return;
    }

    if (auth.userUid == null
        || order.getCustomerId() == null
        || !auth.userUid.equals(order.getCustomerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
  }

  private static UUID parseUuidOr400(String raw, String fieldName) {
    try {
      return UUID.fromString(raw);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName);
    }
  }

  private static OrderStatus parseStatusOr400(String raw) {
    try {
      return OrderStatus.valueOf(raw);
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }
  }

  private static OrderItemEmbeddable toEmbeddable(CreateOrderItemRequest req) {
    OrderItemEmbeddable e = new OrderItemEmbeddable();
    e.setItemId(req.getItemId());
    e.setQuantity(req.getQuantity());

    // Spec has name/unitPrice/subtotal in OrderItem, but CreateOrder only supplies itemId+quantity.
    // Until menu items exist, we store placeholders and totals as 0.
    e.setName(req.getItemId());
    e.setUnitPrice(BigDecimal.ZERO);
    e.setSubtotal(BigDecimal.ZERO);
    return e;
  }

  private static void computeSubtotalIfMissing(OrderItemEmbeddable item) {
    if (item.getUnitPrice() == null) item.setUnitPrice(BigDecimal.ZERO);
    if (item.getSubtotal() == null) {
      BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
      item.setSubtotal(item.getUnitPrice().multiply(qty));
    }
  }

  private static OrderDto toDto(OrderEntity e) {
    OrderDto dto = new OrderDto();
    dto.setId(e.getId().toString());
    dto.setRestaurantId(e.getRestaurantId().toString());
    dto.setCustomerId(e.getCustomerId() != null ? e.getCustomerId().toString() : null);
    dto.setCustomerName(e.getCustomerName());
    dto.setCustomerEmail(e.getCustomerEmail());
    dto.setStatus(e.getStatus().name());
    dto.setTotalAmount(e.getTotalAmount());
    dto.setSpecialInstructions(e.getSpecialInstructions());

    dto.setItems(
        e.getItems().stream()
            .map(
                it -> {
                  OrderItemDto d = new OrderItemDto();
                  d.setItemId(it.getItemId());
                  d.setName(it.getName());
                  d.setQuantity(it.getQuantity());
                  d.setUnitPrice(it.getUnitPrice());
                  d.setSubtotal(it.getSubtotal());
                  return d;
                })
            .toList());

    dto.setCreatedAt(OffsetDateTime.ofInstant(e.getCreatedAt(), ZoneOffset.UTC));
    dto.setUpdatedAt(OffsetDateTime.ofInstant(e.getUpdatedAt(), ZoneOffset.UTC));
    return dto;
  }

  private AuthContext requireAuth() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    String username = auth.getName();
    if (username == null || username.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    UUID uid =
        userRepository
            .findByUsername(username)
            .map(com.sweng.backend.user.User::getUid)
            .orElse(null);

    return new AuthContext(uid, auth);
  }

  /** Holder for authenticated context info. */
  private static final class AuthContext {
    private final UUID userUid;
    private final Authentication auth;

    private AuthContext(UUID userUid, Authentication auth) {
      this.userUid = userUid;
      this.auth = auth;
    }

    private boolean hasRole(String role) {
      for (GrantedAuthority a : auth.getAuthorities()) {
        if (role.equals(a.getAuthority())) return true;
      }
      return false;
    }
  }
}
