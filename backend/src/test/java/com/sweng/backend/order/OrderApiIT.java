package com.sweng.backend.order;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sweng.backend.order.dto.CreateOrderItemRequest;
import com.sweng.backend.order.dto.CreateOrderRequest;
import com.sweng.backend.order.dto.UpdateOrderRequest;
import com.sweng.backend.restaurant.RestaurantEntity;
import com.sweng.backend.restaurant.RestaurantRepository;
import com.sweng.backend.user.Role;
import com.sweng.backend.user.User;
import com.sweng.backend.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
class OrderApiIT {

  @Autowired WebApplicationContext context;
  @Autowired UserRepository userRepository;
  @Autowired RestaurantRepository restaurantRepository;
  @Autowired OrderRepository orderRepository;

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private UUID restaurantId;

  @BeforeEach
  void setup() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

    orderRepository.deleteAll();
    restaurantRepository.deleteAll();

    seedUserIfMissing("admin", Role.ADMIN);
    seedUserIfMissing("customerA", Role.CUSTOMER);
    seedUserIfMissing("customerB", Role.CUSTOMER);
    seedUserIfMissing("owner", Role.RESTAURANT_OWNER);

    UUID ownerUid = userRepository.findByUsername("owner").orElseThrow().getUid();

    RestaurantEntity r = new RestaurantEntity();
    r.setId(UUID.randomUUID());
    r.setName("Test Resto");
    r.setAddress("1 Test Street");
    r.setActive(true);
    r.setOwnerId(ownerUid);

    restaurantId = restaurantRepository.save(r).getId();
  }

  private User seedUserIfMissing(String username, Role role) {
    return userRepository
        .findByUsername(username)
        .orElseGet(
            () -> {
              User u =
                  new User(
                      UUID.randomUUID(),
                      username,
                      username + "@test.com",
                      "bcrypt-stub",
                      OffsetDateTime.now());
              u.getRoles().add(role);
              return userRepository.save(u);
            });
  }

  private CreateOrderItemRequest buildItem(String itemId, int quantity) {
    CreateOrderItemRequest item = new CreateOrderItemRequest();
    item.setItemId(itemId);
    item.setQuantity(quantity);
    return item;
  }

  @Test
  void createOrder_withoutAuth_isRejected() throws Exception {
    CreateOrderRequest req = new CreateOrderRequest();
    req.setRestaurantId(restaurantId.toString());
    req.setItems(List.of(buildItem("item-1", 1)));

    mockMvc
        .perform(
            post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().is4xxClientError());
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void createOrder_setsCustomerId_andDefaultsPending() throws Exception {
    UUID expectedCustomerUid = userRepository.findByUsername("customerA").orElseThrow().getUid();

    CreateOrderRequest req = new CreateOrderRequest();
    req.setRestaurantId(restaurantId.toString());
    req.setItems(List.of(buildItem("item-1", 2)));

    mockMvc
        .perform(
            post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.restaurantId").value(restaurantId.toString()))
        .andExpect(jsonPath("$.customerId").value(expectedCustomerUid.toString()))
        .andExpect(jsonPath("$.status").value("pending"))
        .andExpect(jsonPath("$.items[0].itemId").value("item-1"))
        .andExpect(jsonPath("$.items[0].quantity").value(2));
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void createOrder_withEmptyItems_returns400() throws Exception {
    CreateOrderRequest req = new CreateOrderRequest();
    req.setRestaurantId(restaurantId.toString());
    req.setItems(List.of());

    mockMvc
        .perform(
            post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void getOrders_returnsWrappedDataArray() throws Exception {
    CreateOrderRequest req = new CreateOrderRequest();
    req.setRestaurantId(restaurantId.toString());
    req.setItems(List.of(buildItem("item-1", 1)));

    mockMvc
        .perform(
            post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated());

    mockMvc
        .perform(get("/api/orders"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray());
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void updateOrder_ownerCanUpdateWhenPending() throws Exception {
    CreateOrderRequest create = new CreateOrderRequest();
    create.setRestaurantId(restaurantId.toString());
    create.setItems(List.of(buildItem("item-1", 1)));

    String response =
        mockMvc
            .perform(
                post("/api/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String id = objectMapper.readTree(response).get("id").asText();

    UpdateOrderRequest update = new UpdateOrderRequest();
    update.setSpecialInstructions("No onions");

    mockMvc
        .perform(
            put("/api/orders/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.specialInstructions").value("No onions"));
  }
}
