package com.sweng.backend.restaurant;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sweng.backend.restaurant.dto.CreateRestaurantRequest;
import com.sweng.backend.restaurant.dto.UpdateRestaurantRequest;
import com.sweng.backend.user.Role;
import com.sweng.backend.user.User;
import com.sweng.backend.user.UserRepository;
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
class RestaurantApiIT {

  @Autowired WebApplicationContext context;
  @Autowired UserRepository userRepository;

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @BeforeEach
  void setup() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

    // Seed admin user if not present
    userRepository
        .findByUsername("admin")
        .orElseGet(
            () -> {
              User u =
                  new User(
                      UUID.randomUUID(),
                      "admin",
                      "admin@test.com",
                      "bcrypt-stub",
                      OffsetDateTime.now());
              u.getRoles().add(Role.ADMIN);
              return userRepository.save(u);
            });
  }

  @Test
  void listRestaurants_returns200_andPageShape() throws Exception {
    mockMvc
        .perform(get("/api/restaurants"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").exists());
  }

  @Test
  void listRestaurants_invalidParams_returns400() throws Exception {
    mockMvc
        .perform(get("/api/restaurants").param("page", "-1").param("size", "0"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void createRestaurant_setsOwnerIdToAuthenticatedUsersUuid() throws Exception {
    // Get expected UID from DB
    UUID expectedUid = userRepository.findByUsername("admin").orElseThrow().getUid();

    CreateRestaurantRequest req = new CreateRestaurantRequest();
    req.setName("Owned Place");
    req.setAddress("1 Owner Street");

    String response =
        mockMvc
            .perform(
                post("/api/restaurants")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.ownerId").value(expectedUid.toString()))
            .andReturn()
            .getResponse()
            .getContentAsString();

    // Optional extra check: fetch and ensure it stayed correct
    String id = objectMapper.readTree(response).get("id").asText();

    mockMvc
        .perform(get("/api/restaurants/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ownerId").value(expectedUid.toString()));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void createRestaurant_returns201_andCanFetchById() throws Exception {
    CreateRestaurantRequest req = new CreateRestaurantRequest();
    req.setName("New Place");
    req.setAddress("1 Test Street");

    String response =
        mockMvc
            .perform(
                post("/api/restaurants")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String id = objectMapper.readTree(response).get("id").asText();

    mockMvc
        .perform(get("/api/restaurants/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("New Place"));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void updateRestaurant_changesFields() throws Exception {
    CreateRestaurantRequest create = new CreateRestaurantRequest();
    create.setName("Before");
    create.setAddress("Addr");

    String createResponse =
        mockMvc
            .perform(
                post("/api/restaurants")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String id = objectMapper.readTree(createResponse).get("id").asText();

    UpdateRestaurantRequest update = new UpdateRestaurantRequest();
    update.setName("After");

    mockMvc
        .perform(
            put("/api/restaurants/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("After"));
  }

  @Test
  @WithMockUser(username = "admin", roles = "ADMIN")
  void deleteRestaurant_thenGetReturns404() throws Exception {
    CreateRestaurantRequest create = new CreateRestaurantRequest();
    create.setName("To Delete");
    create.setAddress("Addr");

    String createResponse =
        mockMvc
            .perform(
                post("/api/restaurants")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String id = objectMapper.readTree(createResponse).get("id").asText();

    mockMvc.perform(delete("/api/restaurants/" + id)).andExpect(status().isNoContent());

    mockMvc.perform(get("/api/restaurants/" + id)).andExpect(status().isNotFound());
  }
}
