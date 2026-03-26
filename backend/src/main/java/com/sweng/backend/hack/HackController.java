package com.sweng.backend.hack;

import java.util.concurrent.CompletableFuture;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for hack endpoints.
 *
 * <p>Implements the OpenAPI Hack API.
 */
@RestController
@RequestMapping("/api/hack")
public class HackController {
  private static final Logger LOGGER = LogManager.getLogger();

  /** Constructs the controller. */
  public HackController() {}

  /**
   * Simulate a malicious "hack" event by causing a non graceful shutdown of the server
   *
   * @return a status code on if the request was accepted successfully
   */
  @PostMapping
  public ResponseEntity<?> hackServer() {
    LOGGER.info("Hack endpoint triggered");

    CompletableFuture.runAsync(
        () -> {
          try {
            Thread.sleep(250);
          } catch (InterruptedException ignored) {
          }
          Runtime.getRuntime().halt(1);
        });

    return ResponseEntity.ok("shutting down");
  }
}
