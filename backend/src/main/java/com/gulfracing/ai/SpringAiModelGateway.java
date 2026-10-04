package com.gulfracing.ai;

import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class SpringAiModelGateway implements AiModelGateway {
    private final ObjectProvider<ChatModel> models;

    public SpringAiModelGateway(ObjectProvider<ChatModel> models) {
        this.models = models;
    }

    @Override
    public boolean available() {
        return models.getIfAvailable() != null;
    }

    @Override
    public String answer(String systemInstructions, String userMessage) {
        var model = models.getIfAvailable();
        if (model == null) throw new IllegalStateException("No AI model is configured.");
        // Typed messages avoid template substitution and do not grant any tools.
        var response = model.call(new Prompt(List.of(
                new SystemMessage(systemInstructions), new UserMessage(userMessage))));
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return null;
        }
        return response.getResult().getOutput().getText();
    }
}
