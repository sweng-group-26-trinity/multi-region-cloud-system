package com.sweng.backend.serverinfo;

import java.net.InetAddress;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;

/** Service for retrieving server information. */
@Service
public class ServerInfoService {
  private static final Logger LOGGER = LogManager.getLogger();
  private final Instant startTime = Instant.now();

  /** Constructs a ServerInfoService with default initialization. */
  public ServerInfoService() {}

  /**
   * Retrieves the server start time.
   *
   * @return the server start time in ISO format
   */
  public String getStartTime() {
    return DateTimeFormatter.ISO_INSTANT.format(startTime);
  }

  /**
   * Retrieves the host name.
   *
   * @return the host name
   */
  public String getHostName() {
    try {
      return InetAddress.getLocalHost().getHostName();
    } catch (Exception e) {
      LOGGER.error("Failed to get hostname", e);
      return "unknown";
    }
  }

  /**
   * Retrieves the current user.
   *
   * @return the current user
   */
  public String getUser() {
    return System.getProperty("user.name", "unknown");
  }

  /**
   * Retrieves the operating system information.
   *
   * @return the operating system
   */
  public String getOs() {
    return System.getProperty("os.name", "unknown");
  }
}
