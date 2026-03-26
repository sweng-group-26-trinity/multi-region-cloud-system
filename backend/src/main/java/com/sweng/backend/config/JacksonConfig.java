package com.sweng.backend.config;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson configuration to customize JSON serialization/deserialization
 * behavior.
 */
@Configuration
public class JacksonConfig {

  /**
   * Configures the ObjectMapper to use StrictStringDeserializer for all String
   * fields. This rejects
   * boolean, number, or other non-string values that would normally be coerced to
   * strings.
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
