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
    JsonToken token = p.currentToken();

    if (token == JsonToken.VALUE_STRING) {
      return p.getString();
    } else if (token == JsonToken.VALUE_NULL) {
      return null;
    } else {
      ctxt.reportInputMismatch(String.class, "Expected a string value but got %s", token);
      return null;
    }
  }

  @Override
  public String getNullValue(DeserializationContext ctxt) {
    return null;
  }
}
