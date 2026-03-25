package com.sweng.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/** Configuration for RestTemplate beans. */
@Configuration
public class RestTemplateConfig {

  /** Default constructor for RestTemplateConfig. */
  public RestTemplateConfig() {}

  /**
   * Creates and configures a RestTemplate bean for HTTP requests.
   *
   * @return a new RestTemplate instance
   */
  @Bean
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }
}
