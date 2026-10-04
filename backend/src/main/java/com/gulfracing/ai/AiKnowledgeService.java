package com.gulfracing.ai;

import com.gulfracing.dto.AiDtos;
import com.gulfracing.service.CamelService;
import com.gulfracing.service.RaceService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiKnowledgeService {
    private final CamelService camels;
    private final RaceService races;
    private final ObjectMapper json;
    private final String guide;

    public AiKnowledgeService(CamelService camels, RaceService races, ObjectMapper json,
            @Value("classpath:ai/platform-guide.txt") Resource guide) throws IOException {
        this.camels = camels;
        this.races = races;
        this.json = json;
        this.guide = guide.getContentAsString(StandardCharsets.UTF_8);
    }

    public String guide() { return guide; }

    public record Context(String json, List<AiDtos.Source> sources) {}

    @Transactional(readOnly = true)
    public Context context(AiDtos.ChatRequest request) {
        var records = new LinkedHashMap<String, Object>();
        var sources = new ArrayList<AiDtos.Source>();
        sources.add(new AiDtos.Source("platform-guide", "Medhmar platform guide", "/api/ai/guide"));
        // Explicit, bounded public-field projections. Never serialize JPA entities.
        if (request.raceId() != null) {
            var race = races.getRaceById(request.raceId());
            var data = new LinkedHashMap<String, Object>();
            data.put("raceId", race.getRaceId());
            data.put("name", text(race.getName()));
            data.put("startsAtUtc", race.getStartsAt().toString());
            data.put("location", text(race.getLocation()));
            data.put("distanceKm", race.getDistanceKm());
            data.put("status", race.getStatus());
            records.put("race", data);
            sources.add(new AiDtos.Source("race:" + race.getRaceId(), "Race " + race.getRaceId(),
                    "/api/races/" + race.getRaceId()));
        }
        if (request.camelId() != null) {
            var camel = camels.getById(request.camelId()); // rejects inactive/deleted camels
            var data = new LinkedHashMap<String, Object>();
            data.put("camelId", camel.getCamelId());
            data.put("name", text(camel.getName()));
            data.put("gender", camel.getGender());
            data.put("breed", text(camel.getBreed()));
            data.put("category", text(camel.getCategory()));
            data.put("status", camel.getStatus());
            records.put("camel", data);
            sources.add(new AiDtos.Source("camel:" + camel.getCamelId(), "Camel " + camel.getCamelId(),
                    "/camel/getById?id=" + camel.getCamelId()));
        }
        return new Context(json.writeValueAsString(Map.of(
                "question", request.question().strip(), "publicRecords", records)), List.copyOf(sources));
    }

    private static String text(String value) {
        if (value == null) return null;
        return value.substring(0, Math.min(value.length(), 300));
    }
}
