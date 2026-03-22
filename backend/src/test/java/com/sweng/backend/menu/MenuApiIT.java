package com.sweng.backend.menu;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sweng.backend.menu.dto.CreateMenuItemRequest;
import com.sweng.backend.menu.dto.UpdateMenuItemRequest;
import com.sweng.backend.restaurant.RestaurantEntity;
import com.sweng.backend.restaurant.RestaurantRepository;
import com.sweng.backend.user.Role;
import com.sweng.backend.user.User;
import com.sweng.backend.user.UserRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
class MenuApiIT {

  @Autowired WebApplicationContext context;
  @Autowired UserRepository userRepository;
  @Autowired RestaurantRepository restaurantRepository;
  @Autowired MenuItemRepository menuItemRepository;

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private UUID restaurantId;

  @BeforeEach
  void setup() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

    menuItemRepository.deleteAll();
    restaurantRepository.deleteAll();

    seedUserIfMissing("admin", Role.ADMIN);
    seedUserIfMissing("owner", Role.RESTAURANT_OWNER);

    UUID ownerUid = userRepository.findByUsername("owner").orElseThrow().getUid();

    RestaurantEntity r = new RestaurantEntity();
    r.setId(UUID.randomUUID());
    r.setName("Menu Test Restaurant");
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

  private MenuItemEntity seedMenuItem(
      String name, String category, BigDecimal price, boolean isAvailable) {
    MenuItemEntity item = new MenuItemEntity();
    item.setId(UUID.randomUUID());
    item.setRestaurantId(restaurantId);
    item.setName(name);
    item.setDescription(name + " description");
    item.setCategory(category);
    item.setPrice(price);
    item.setAvailable(isAvailable);
    return menuItemRepository.save(item);
  }

  @Test
  void getRestaurantMenu_returnsWrappedDataArray() throws Exception {
    seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);
    seedMenuItem("Cola", "Drink", new BigDecimal("3.00"), false);

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data.length()").value(2));
  }

  @Test
  void getRestaurantMenu_filtersByCategory() throws Exception {
    seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);
    seedMenuItem("Ice Cream", "Dessert", new BigDecimal("5.00"), true);

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu").param("category", "Dessert"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(1))
        .andExpect(jsonPath("$.data[0].name").value("Ice Cream"))
        .andExpect(jsonPath("$.data[0].category").value("Dessert"));
  }

  @Test
  void getRestaurantMenu_filtersAvailableOnly() throws Exception {
    seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);
    seedMenuItem("Cola", "Drink", new BigDecimal("3.00"), false);

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu").param("availableOnly", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(1))
        .andExpect(jsonPath("$.data[0].name").value("Burger"))
        .andExpect(jsonPath("$.data[0].isAvailable").value(true));
  }

  @Test
  void getMenuItem_returnsSingleItem() throws Exception {
    MenuItemEntity item = seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu/" + item.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(item.getId().toString()))
        .andExpect(jsonPath("$.restaurantId").value(restaurantId.toString()))
        .andExpect(jsonPath("$.name").value("Burger"))
        .andExpect(jsonPath("$.price").value(12.50));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void createMenuItem_returns201_andCanFetchById() throws Exception {
    CreateMenuItemRequest req = new CreateMenuItemRequest();
    req.setName("Pizza");
    req.setDescription("Stone baked");
    req.setCategory("Main");
    req.setPrice(new BigDecimal("14.99"));
    req.setImageUrl("https://example.com/pizza.jpg");
    req.setIsAvailable(true);

    String response =
        mockMvc
            .perform(
                post("/api/restaurants/" + restaurantId + "/menu")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.restaurantId").value(restaurantId.toString()))
            .andExpect(jsonPath("$.name").value("Pizza"))
            .andExpect(jsonPath("$.category").value("Main"))
            .andExpect(jsonPath("$.price").value(14.99))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String id = objectMapper.readTree(response).get("id").asText();

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Pizza"));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void updateMenuItem_changesFields() throws Exception {
    MenuItemEntity item = seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);

    UpdateMenuItemRequest req = new UpdateMenuItemRequest();
    req.setName("Cheese Burger");
    req.setPrice(new BigDecimal("13.75"));
    req.setIsAvailable(false);

    mockMvc
        .perform(
            put("/api/restaurants/" + restaurantId + "/menu/" + item.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Cheese Burger"))
        .andExpect(jsonPath("$.price").value(13.75))
        .andExpect(jsonPath("$.isAvailable").value(false));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void deleteMenuItem_thenGetReturns404() throws Exception {
    MenuItemEntity item = seedMenuItem("Burger", "Main", new BigDecimal("12.50"), true);

    mockMvc
        .perform(delete("/api/restaurants/" + restaurantId + "/menu/" + item.getId()))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/api/restaurants/" + restaurantId + "/menu/" + item.getId()))
        .andExpect(status().isNotFound());
  }
}