package com.texttutor.service.rag;

import com.texttutor.service.ai.AiService;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class QueryIntentDetector {

    private static final Pattern DEFINITION_PATTERN = Pattern.compile(
            "\\b(what\\s+is|what\\s+are|define|meaning\\s+of|definition\\s+of|concept\\s+of)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EXPLANATION_PATTERN = Pattern.compile(
            "\\b(explain|how\\s+does|why\\s+does|how\\s+do|mechanism\\s+of|describe|detail|elaborate)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SUMMARY_PATTERN = Pattern.compile(
            "\\b(summarize|summary|overview|key\\s+points|main\\s+ideas|brief|digest|recap)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern COMPARISON_PATTERN = Pattern.compile(
            "\\b(compare|difference\\s+between|differences|vs|versus|distinguish|in\\s+contrast\\s+to)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PROS_CONS_PATTERN = Pattern.compile(
            "\\b(advantage|advantages|disadvantage|disadvantages|pros\\s+and\\s+cons|benefits|drawbacks|limitations)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PROCESS_PATTERN = Pattern.compile(
            "\\b(steps|step\\s+by\\s+step|how\\s+to|process|procedure|algorithm|workflow|stages|phases)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EXAMPLE_PATTERN = Pattern.compile(
            "\\b(example|give\\s+an\\s+example|sample|instance|illustrate|demonstrate|show\\s+me\\s+an\\s+example)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EXAM_PATTERN = Pattern.compile(
            "\\b(exam|test|quiz|high\\s+yield|practice\\s+question|expected\\s+questions|important\\s+question)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern FOLLOW_UP_PATTERN = Pattern.compile(
            "^\\s*(what\\s+are\\s+its|how\\s+does\\s+it|why\\s+does\\s+it|give\\s+an\\s+example\\s+of\\s+(it|this|that)|what\\s+about\\s+(it|this|that)|explain\\s+(it|this|that)|explain\\s+that\\s+again|what\\s+is\\s+its|what\\s+are\\s+the\\s+types)\\b",
            Pattern.CASE_INSENSITIVE
    );

    public record QueryAnalysis(
            QuestionIntent intent,
            String effectiveQuery,
            String focalTopic,
            boolean isFollowUp
    ) {}

    public QueryAnalysis analyze(String rawQuery, List<AiService.ChatMessageContext> history) {
        String cleanQuery = (rawQuery != null) ? rawQuery.trim() : "";
        QuestionIntent intent = detectIntent(cleanQuery);

        boolean isFollowUp = isFollowUpQuery(cleanQuery);
        String focalTopic = extractFocalTopic(cleanQuery);
        String effectiveQuery = cleanQuery;

        if (isFollowUp && history != null && !history.isEmpty()) {
            String priorTopic = extractPriorSubject(history);
            if (priorTopic != null && !priorTopic.isBlank()) {
                focalTopic = priorTopic;
                effectiveQuery = priorTopic + " " + cleanQuery.replaceAll("\\b(it|its|this|that|again)\\b", "").trim();
            }
        }

        return new QueryAnalysis(intent, effectiveQuery, focalTopic, isFollowUp);
    }

    private QuestionIntent detectIntent(String query) {
        if (COMPARISON_PATTERN.matcher(query).find()) return QuestionIntent.COMPARISON;
        if (PROS_CONS_PATTERN.matcher(query).find()) return QuestionIntent.ADVANTAGES_DISADVANTAGES;
        if (PROCESS_PATTERN.matcher(query).find()) return QuestionIntent.PROCESS;
        if (EXAMPLE_PATTERN.matcher(query).find()) return QuestionIntent.EXAMPLE;
        if (EXAM_PATTERN.matcher(query).find()) return QuestionIntent.EXAM_PREP;
        if (SUMMARY_PATTERN.matcher(query).find()) return QuestionIntent.SUMMARY;
        if (DEFINITION_PATTERN.matcher(query).find()) return QuestionIntent.DEFINITION;
        if (EXPLANATION_PATTERN.matcher(query).find()) return QuestionIntent.EXPLANATION;
        return QuestionIntent.GENERAL_STUDY;
    }

    private boolean isFollowUpQuery(String query) {
        if (query.length() < 30 && FOLLOW_UP_PATTERN.matcher(query).find()) {
            return true;
        }
        String lower = query.toLowerCase();
        return lower.contains("what are its") || lower.contains("explain that again") ||
                lower.contains("tell me more about it") || lower.matches(".*\\b(its|that|this|it)\\b.*") && query.split("\\s+").length <= 5;
    }

    private String extractFocalTopic(String query) {
        // Strip common question filler words
        String stripped = query.replaceAll("(?i)\\b(can you|please|what is|what are|explain|tell me about|how does|why does|describe|give an example of|summarize|define)\\b", "")
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .trim();
        return stripped.length() > 2 ? stripped : query;
    }

    private String extractPriorSubject(List<AiService.ChatMessageContext> history) {
        // Walk backwards through history to find the subject of the last exchange
        for (int i = history.size() - 1; i >= 0; i--) {
            AiService.ChatMessageContext msg = history.get(i);
            if ("user".equalsIgnoreCase(msg.role()) || "student".equalsIgnoreCase(msg.role())) {
                String topic = extractFocalTopic(msg.content());
                if (!topic.isBlank() && !isFollowUpQuery(topic)) {
                    return topic;
                }
            } else if ("assistant".equalsIgnoreCase(msg.role()) || "model".equalsIgnoreCase(msg.role())) {
                // Check if assistant bolded a note or subject title e.g. **"Topic"**
                Matcher boldMatcher = Pattern.compile("\\*\\*([A-Za-z0-9\\s]{3,40})\\*\\*").matcher(msg.content());
                if (boldMatcher.find()) {
                    return boldMatcher.group(1);
                }
            }
        }
        return null;
    }
}
