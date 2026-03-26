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
class OrderSecurityIT {

  @Autowired WebApplicationContext context;

  @Autowired UserRepository userRepository;
  @Autowired RestaurantRepository restaurantRepository;
  @Autowired OrderRepository orderRepository;

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private UUID restaurantId;
  private String orderIdOfCustomerA;
  private String orderIdOfCustomerB;

  @BeforeEach
  void setup() throws Exception {
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

    // Create order as customerA
    CreateOrderRequest a = new CreateOrderRequest();
    a.setRestaurantId(restaurantId.toString());
    a.setItems(List.of(buildItem("item-a", 1)));

    String aResp =
        mockMvc
            .perform(
                post("/api/orders")
                    .with(
                        org.springframework.security.test.web.servlet.request
                            .SecurityMockMvcRequestPostProcessors.user("customerA")
                            .roles("CUSTOMER"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(a)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    orderIdOfCustomerA = objectMapper.readTree(aResp).get("id").asText();

    // Create order as customerB
    CreateOrderRequest b = new CreateOrderRequest();
    b.setRestaurantId(restaurantId.toString());
    b.setItems(List.of(buildItem("item-b", 1)));

    String bResp =
        mockMvc
            .perform(
                post("/api/orders")
                    .with(
                        org.springframework.security.test.web.servlet.request
                            .SecurityMockMvcRequestPostProcessors.user("customerB")
                            .roles("CUSTOMER"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(b)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    orderIdOfCustomerB = objectMapper.readTree(bResp).get("id").asText();
  }

  private CreateOrderItemRequest buildItem(String itemId, int quantity) {
    CreateOrderItemRequest item = new CreateOrderItemRequest();
    item.setItemId(itemId);
    item.setQuantity(quantity);
    return item;
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

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void customer_cannotFetchOtherUsersOrder() throws Exception {
    mockMvc
        .perform(get("/api/orders/" + orderIdOfCustomerB))
        .andExpect(status().is4xxClientError());
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void customer_listOrders_onlySeesOwn() throws Exception {
    mockMvc
        .perform(get("/api/orders"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data[?(@.id=='" + orderIdOfCustomerA + "')]").exists())
        .andExpect(jsonPath("$.data[?(@.id=='" + orderIdOfCustomerB + "')]").doesNotExist());
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void admin_canFetchAnyOrder() throws Exception {
    mockMvc
        .perform(get("/api/orders/" + orderIdOfCustomerB))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderIdOfCustomerB));
  }

  @Test
  @WithMockUser(username = "owner", roles = "RESTAURANT_OWNER")
  void restaurantOwner_canFetchAnyOrder() throws Exception {
    mockMvc
        .perform(get("/api/orders/" + orderIdOfCustomerB))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(orderIdOfCustomerB));
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void updateOrder_nonPending_isRejected_forCustomer() throws Exception {
    OrderEntity e = orderRepository.findById(UUID.fromString(orderIdOfCustomerA)).orElseThrow();
    e.setStatus(OrderStatus.preparing);
    orderRepository.save(e);

    UpdateOrderRequest update = new UpdateOrderRequest();
    update.setSpecialInstructions("Try update");

    mockMvc
        .perform(
            put("/api/orders/" + orderIdOfCustomerA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void updateOrder_nonPending_isAllowed_forAdmin() throws Exception {
    OrderEntity e = orderRepository.findById(UUID.fromString(orderIdOfCustomerA)).orElseThrow();
    e.setStatus(OrderStatus.preparing);
    orderRepository.save(e);

    UpdateOrderRequest update = new UpdateOrderRequest();
    update.setSpecialInstructions("Admin update ok");

    mockMvc
        .perform(
            put("/api/orders/" + orderIdOfCustomerA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.specialInstructions").value("Admin update ok"));
  }

  @Test
  @WithMockUser(username = "customerA", roles = "CUSTOMER")
  void deleteOrder_otherUsersOrder_isRejected() throws Exception {
    mockMvc
        .perform(delete("/api/orders/" + orderIdOfCustomerB))
        .andExpect(status().is4xxClientError());
  }

  @Test
  @WithMockUser(username = "owner", roles = "RESTAURANT_OWNER")
  void deleteOrder_ownerRole_canDeleteAny() throws Exception {
    mockMvc.perform(delete("/api/orders/" + orderIdOfCustomerB)).andExpect(status().isNoContent());
  }
}
