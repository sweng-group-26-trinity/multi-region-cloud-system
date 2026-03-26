package com.sweng.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.json.JsonParseException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import lombok.SneakyThrows;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ObjectMapper;

import net.jqwik.api.*;

@SpringBootTest
@ActiveProfiles("test")
public class StrictStringDeserializerTest {
  private ObjectMapper mapper = new ObjectMapper();
  private StrictStringDeserializer deserializer = new StrictStringDeserializer();

  @Property
  void allBoolsAreRejected(@ForAll Boolean input) {
    assertThrows(
        tools.jackson.databind.exc.MismatchedInputException.class,
        () -> deserialiseString(input.toString()));
  }

  @Property
  boolean allStringsAreAccepted(@ForAll String input) {
    String json = mapper.writeValueAsString(input);
    return deserialiseString(json).equals(input);
  }

  @SneakyThrows({ JsonParseException.class, IOException.class })
  private String deserialiseString(String input) {
    JsonParser parser = mapper.createParser(input);
    DeserializationContext ctxt = mapper._deserializationContext();
    parser.nextToken();
    return deserializer.deserialize(parser, ctxt);
  }
}
