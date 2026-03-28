package com.sweng.backend.serverinfo;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sweng.backend.auth.JwtUtil;
import com.sweng.backend.user.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ServerInfoController.class)
class ServerInfoControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private ServerInfoService serverInfoService;

  @MockitoBean private JwtUtil jwtUtil;

  @MockitoBean private CustomUserDetailsService customUserDetailsService;

  @BeforeEach
  void setUp() {
    when(serverInfoService.getStartTime()).thenReturn("2026-01-01T00:00:00.000Z");
    when(serverInfoService.getHostName()).thenReturn("test-host");
    when(serverInfoService.getUser()).thenReturn("test-user");
    when(serverInfoService.getOs()).thenReturn("Ubuntu 22.04 LTS");
  }

  @Test
  void getServerInfo_returnsServerInfo() throws Exception {
    mockMvc
        .perform(get("/api/server-info").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.startTime").value("2026-01-01T00:00:00.000Z"))
        .andExpect(jsonPath("$.hostName").value("test-host"))
        .andExpect(jsonPath("$.user").value("test-user"))
        .andExpect(jsonPath("$.os").value("Ubuntu 22.04 LTS"));
  }
}
