package com.sweng.backend.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.module.SimpleModule;

/** Jackson configuration to customize JSON serialization/deserialization behavior. */
@Configuration
public class JacksonConfig {
  /** Constructs the default instance. */
  public JacksonConfig() {}

  /**
   * Configures the ObjectMapper to use StrictStringDeserializer for all String fields. This rejects
   * boolean, number, or other non-string values that would normally be coerced to strings.
   *
   * @return the configured ObjectMapper
   */
  @Bean
  JsonMapperBuilderCustomizer strictStringCustomizer() {
    return builder -> {
      SimpleModule module = new SimpleModule();
      module.addDeserializer(String.class, new StrictStringDeserializer());
      builder.addModule(module);
    };
  }
}
