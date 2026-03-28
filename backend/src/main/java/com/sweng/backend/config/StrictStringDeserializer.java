package com.sweng.backend.config;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

/**
 * Custom deserializer that only accepts actual string values or null. Rejects boolean, number, or
 * other types that would normally be coerced to strings.
 */
public class StrictStringDeserializer extends ValueDeserializer<String> {

  /** Creates a new StrictStringDeserializer instance. */
  public StrictStringDeserializer() {
    super();
  }

  @Override
  public String deserialize(JsonParser p, DeserializationContext ctxt) throws JacksonException {
    return switch (p.currentToken()) {
      case JsonToken.VALUE_STRING -> p.getString();
      case JsonToken.VALUE_NULL -> null;
      case null -> null;
      case JsonToken token -> {
        ctxt.reportInputMismatch(String.class, "Expected a string value but got %s", token);
        yield null;
      }
    };
  }

  @Override
  public String getNullValue(DeserializationContext ctxt) {
    return null;
  }
}
