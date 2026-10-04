package com.gulfracing.ai;

/** Model boundary: receives approved context, never entities or credentials. */
public interface AiModelGateway {
    boolean available();
    String answer(String systemInstructions, String userMessage);
}
