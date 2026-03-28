package com.sweng.backend.serverinfo;

import com.sweng.backend.serverinfo.dto.ServerInfoDto;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for server information endpoints.
 *
 * <p>Implements the OpenAPI ServerInfo API.
 */
@RestController
@RequestMapping("/api/server-info")
public class ServerInfoController {
  private static final Logger LOGGER = LogManager.getLogger();
  private final ServerInfoService serverInfoService;

  /**
   * Constructs the controller.
   *
   * @param serverInfoService the server info service
   */
  public ServerInfoController(ServerInfoService serverInfoService) {
    this.serverInfoService = serverInfoService;
  }

  /**
   * Return information about the server
   *
   * @return useful info about the server
   */
  @GetMapping
  public ResponseEntity<ServerInfoDto> getServerInfo() {
    ServerInfoDto dto = new ServerInfoDto();
    dto.setStartTime(serverInfoService.getStartTime());
    dto.setHostName(serverInfoService.getHostName());
    dto.setUser(serverInfoService.getUser());
    dto.setOs(serverInfoService.getOs());

    return ResponseEntity.ok(dto);
  }
}
