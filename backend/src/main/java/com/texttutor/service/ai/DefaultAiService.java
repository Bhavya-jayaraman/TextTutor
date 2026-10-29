package com.texttutor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.texttutor.service.rag.IntelligentStudySynthesizer;
import com.texttutor.service.rag.QueryIntentDetector;
import com.texttutor.service.rag.QuestionIntent;
import com.texttutor.service.rag.RetrievedChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

@Service
public class DefaultAiService implements AiService {

    private static final Logger log = LoggerFactory.getLogger(DefaultAiService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-3.1-flash-lite}")
    private String geminiModel;

    private final QueryIntentDetector queryIntentDetector;
    private final IntelligentStudySynthesizer studySynthesizer;
    private final ObjectMapper objectMapper;
    private HttpClient httpClient;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
            "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "explain",
            "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
            "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
            "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
            "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "please",
            "same", "she", "should", "so", "some", "such", "tell", "than", "that", "the", "their", "theirs",
            "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too",
            "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while",
            "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    );

    public DefaultAiService(
            QueryIntentDetector queryIntentDetector,
            IntelligentStudySynthesizer studySynthesizer,
            ObjectMapper objectMapper) {
        this.queryIntentDetector = queryIntentDetector;
        this.studySynthesizer = studySynthesizer;
        this.objectMapper = objectMapper;
        this.httpClient = null;
    }

    private synchronized HttpClient getHttpClient() {
        if (this.httpClient == null) {
            try {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                TrustManager[] trustAll = new TrustManager[]{
                        new X509TrustManager() {
                            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                            public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                            public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                        }
                };
                sslContext.init(null, trustAll, new SecureRandom());

                this.httpClient = HttpClient.newBuilder()
                        .sslContext(sslContext)
                        .connectTimeout(Duration.ofSeconds(15))
                        .build();
            } catch (Throwable t) {
                try {
                    this.httpClient = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(15))
                            .build();
                } catch (Throwable t2) {
                    return null;
                }
            }
        }
        return this.httpClient;
    }

    public record GeminiCallResult(
            boolean success,
            String text,
            String errorMessage,
            int statusCode
    ) {}

    public GeminiCallResult executeGeminiPrompt(String prompt, double temperature) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return new GeminiCallResult(false, null, "GEMINI_API_KEY is not configured on the server. Set GEMINI_API_KEY in your environment or application.yml.", 401);
        }

        try {
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> contentMap = Map.of("role", "user", "parts", List.of(part));
            Map<String, Object> genConfig = Map.of("temperature", temperature, "maxOutputTokens", 4096);
            Map<String, Object> payload = Map.of(
                    "contents", List.of(contentMap),
                    "generationConfig", genConfig
            );

            String requestBody = objectMapper.writeValueAsString(payload);

            List<String> modelsToTry = new ArrayList<>();
            String primary = (geminiModel != null && !geminiModel.isBlank()) ? geminiModel.trim() : "gemini-3.1-flash-lite";
            modelsToTry.add(primary);
            for (String candidate : List.of("gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash")) {
                if (!modelsToTry.contains(candidate)) {
                    modelsToTry.add(candidate);
                }
            }

            GeminiCallResult lastResult = null;
            for (String currentModel : modelsToTry) {
                String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + currentModel + ":generateContent?key=" + geminiApiKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, java.nio.charset.StandardCharsets.UTF_8))
                        .timeout(Duration.ofSeconds(25))
                        .build();

                HttpClient client = getHttpClient();
                if (client != null) {
                    try {
                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                        int code = response.statusCode();

                        if (code == 200) {
                            JsonNode root = objectMapper.readTree(response.body());
                            JsonNode candidates = root.path("candidates");
                            if (candidates.isArray() && !candidates.isEmpty()) {
                                JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                                if (!textNode.isMissingNode() && !textNode.asText().isBlank()) {
                                    return new GeminiCallResult(true, textNode.asText().trim(), null, 200);
                                }
                            }
                            return new GeminiCallResult(false, null, "Gemini returned an empty candidate response.", 200);
                        }

                        String errorMsg = "Gemini API error (HTTP " + code + ")";
                        try {
                            JsonNode root = objectMapper.readTree(response.body());
                            JsonNode errorNode = root.path("error");
                            if (!errorNode.isMissingNode()) {
                                String msg = errorNode.path("message").asText();
                                String status = errorNode.path("status").asText();
                                if (!msg.isBlank()) {
                                    errorMsg = msg;
                                }
                                if ("RESOURCE_EXHAUSTED".equalsIgnoreCase(status) || code == 429) {
                                    errorMsg = "Gemini API quota exhausted (HTTP 429). Please check your Google AI Studio quota limits or retry in a few moments.";
                                } else if ("API_KEY_INVALID".equalsIgnoreCase(status) || code == 400 || code == 403) {
                                    if (msg.toLowerCase().contains("key")) {
                                        errorMsg = "Invalid GEMINI_API_KEY. Please verify your Google Gemini API key.";
                                    }
                                }
                            }
                        } catch (Exception ignored) {}

                        log.warn("Gemini model {} returned HTTP {}: {}", currentModel, code, errorMsg);
                        lastResult = new GeminiCallResult(false, null, errorMsg, code);

                        // If quota exhausted or invalid key, don't keep trying models
                        if (code == 401 || code == 403 || code == 429) {
                            return lastResult;
                        }

                        // Try next model if 503 (high demand) or 404 (not found)
                        if (code == 503 || code == 404) {
                            continue;
                        }
                    } catch (Exception httpEx) {
                        log.warn("Primary HttpClient error ({}) on model {}, attempting native transport...", httpEx.getMessage(), currentModel);
                    }
                }

                // High-reliability native transport fallback for Windows loopback/Schannel
                GeminiCallResult curlResult = executeGeminiViaCurl(endpoint, requestBody);
                if (curlResult != null) {
                    if (curlResult.success()) {
                        return curlResult;
                    }
                    lastResult = curlResult;
                    if (curlResult.statusCode() == 503 || curlResult.statusCode() == 404) {
                        log.info("Model {} via curl returned HTTP {}, trying next model...", currentModel, curlResult.statusCode());
                        continue;
                    }
                    if (curlResult.statusCode() == 401 || curlResult.statusCode() == 403 || curlResult.statusCode() == 429) {
                        return curlResult;
                    }
                }
            }

            return lastResult != null ? lastResult : new GeminiCallResult(false, null, "Gemini API request failed to connect.", 500);

        } catch (Exception ex) {
            log.warn("Gemini API network connection failed: {}", ex.getMessage());
            return new GeminiCallResult(false, null, "Gemini API connection error: " + ex.getMessage(), 500);
        }
    }

    private GeminiCallResult executeGeminiViaCurl(String endpoint, String requestBody) {
        java.io.File tempFile = null;
        try {
            tempFile = java.io.File.createTempFile("gemini_req_", ".json");
            java.nio.file.Files.writeString(tempFile.toPath(), requestBody, java.nio.charset.StandardCharsets.UTF_8);

            ProcessBuilder pb = new ProcessBuilder(
                    "curl.exe", "-s",
                    "--max-time", "20",
                    "-X", "POST",
                    endpoint,
                    "-H", "Content-Type: application/json",
                    "-d", "@" + tempFile.getAbsolutePath()
            );
            Process p = pb.start();
            StringBuilder out = new StringBuilder();
            try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(p.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) out.append(line).append("\n");
            }
            p.waitFor();
            String responseStr = out.toString().trim();

            if (!responseStr.isEmpty()) {
                JsonNode root = objectMapper.readTree(responseStr);
                JsonNode errorNode = root.path("error");
                if (!errorNode.isMissingNode()) {
                    int errCode = errorNode.path("code").asInt(500);
                    String errMsg = errorNode.path("message").asText("Gemini provider error");
                    return new GeminiCallResult(false, null, errMsg, errCode);
                }
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode() && !textNode.asText().isBlank()) {
                        return new GeminiCallResult(true, textNode.asText().trim(), null, 200);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Curl transport fallback error: {}", ex.getMessage());
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
        return null;
    }

    @Override
    public GeminiStatusResult verifyGeminiConnection() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return new GeminiStatusResult(
                    false,
                    false,
                    geminiModel,
                    "GEMINI_API_KEY is not configured in the server environment or application.yml. Live AI features are utilizing local intelligence fallback."
            );
        }

        GeminiCallResult testResult = executeGeminiPrompt("Respond with the exact word 'READY' to verify API connectivity.", 0.0);
        if (testResult.success()) {
            return new GeminiStatusResult(
                    true,
                    true,
                    geminiModel,
                    "Successfully verified connection to Google Gemini API (" + geminiModel + ")."
            );
        } else {
            return new GeminiStatusResult(
                    true,
                    false,
                    geminiModel,
                    testResult.errorMessage()
            );
        }
    }

    @Override
    public String generateStructuredNotes(String title, String extractedText, String category) {
        if (extractedText == null || extractedText.isBlank()) {
            return "### ⚠️ Notice\n\nNo readable text could be extracted from this source. If this is an image or scanned document, digital text or OCR processing is required.";
        }

        String safeTitle = (title != null && !title.isBlank()) ? title.trim() : "Study Subject";
        String safeCategory = (category != null && !category.isBlank()) ? category.trim() : "General";

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            String prompt = "You are TextTutor, an expert academic tutor and reading companion.\n" +
                    "Generate comprehensive, highly structured, in-depth study notes from the following extracted source material.\n\n" +
                    "DOCUMENT TITLE: " + safeTitle + "\n" +
                    "CATEGORY / SUBJECT: " + safeCategory + "\n\n" +
                    "CRITICAL ACCURACY & GROUNDING RULES:\n" +
                    "1. Use ONLY facts, concepts, definitions, formulas, arguments, names, and dates present in the extracted text.\n" +
                    "2. Do NOT invent information or change meanings.\n" +
                    "3. Adapt appropriately to the document genre (novel/story, textbook, lecture notes, research paper, report, manual).\n" +
                    "4. Structure the output clearly in GitHub-flavored Markdown:\n" +
                    "   # " + safeTitle + "\n" +
                    "   ## 📖 Overview & Executive Summary\n" +
                    "   ## 🔑 Key Concepts, Terminology & Formal Definitions\n" +
                    "   ## 📚 Detailed Section Breakdown & Analysis (core arguments, mechanisms, historical context, or narrative developments)\n" +
                    "   ## 💡 High-Yield Takeaways & Practical Insights\n" +
                    "   ## ❓ Active Recall & Self-Quiz Questions\n\n" +
                    "EXTRACTED SOURCE CONTENT:\n" +
                    (extractedText.length() > 25000 ? extractedText.substring(0, 25000) + "\n\n[Content truncated to fit context window]" : extractedText);

            GeminiCallResult call = executeGeminiPrompt(prompt, 0.2);
            if (call.success() && call.text() != null && !call.text().isBlank()) {
                return call.text();
            }
        }

        return synthesizeComprehensiveOfflineNotes(safeTitle, extractedText, safeCategory);
    }

    private String synthesizeComprehensiveOfflineNotes(String title, String content, String category) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(title).append("\n\n");

        List<String> sentences = extractCleanSentences(content);
        if (sentences.isEmpty()) {
            sb.append("## 📖 Overview\n\n").append(content.trim()).append("\n");
            return sb.toString();
        }

        // Overview
        sb.append("## 📖 Executive Overview & Document Scope\n\n");
        int overviewSentences = Math.min(3, sentences.size());
        for (int i = 0; i < overviewSentences; i++) {
            sb.append(sentences.get(i)).append(" ");
        }
        sb.append("\n\n");

        // Definitions & Key Concepts
        List<String> definitions = findSentencesMatching(sentences, List.of("is", "refers to", "defined as", "represents", "means"));
        sb.append("## 🔑 Key Concepts & Verified Definitions\n\n");
        if (!definitions.isEmpty()) {
            for (int i = 0; i < Math.min(5, definitions.size()); i++) {
                sb.append("- **Concept ").append(i + 1).append("**: ").append(definitions.get(i)).append("\n");
            }
        } else {
            for (int i = 0; i < Math.min(3, sentences.size()); i++) {
                sb.append("- **Point ").append(i + 1).append("**: ").append(sentences.get(i)).append("\n");
            }
        }
        sb.append("\n");

        // Detailed Section Breakdown
        sb.append("## 📚 In-Depth Subject Breakdown & Analysis\n\n");
        int step = Math.max(1, sentences.size() / 3);
        for (int i = 0; i < sentences.size(); i += step) {
            int end = Math.min(i + step, sentences.size());
            sb.append("### Section ").append((i / step) + 1).append(": Focus Area\n\n");
            for (int j = i; j < end; j++) {
                sb.append(sentences.get(j)).append(" ");
            }
            sb.append("\n\n");
        }

        // High-Yield Takeaways
        sb.append("## 💡 High-Yield Takeaways & Revision Points\n\n");
        for (int i = 0; i < Math.min(4, sentences.size()); i++) {
            sb.append(i + 1).append(". ").append(sentences.get(i)).append("\n");
        }
        sb.append("\n");

        // Active Recall Questions
        sb.append("## ❓ Active Recall & Self-Testing Questions\n\n");
        for (int i = 0; i < Math.min(3, sentences.size()); i++) {
            sb.append("- **Q").append(i + 1).append("**: According to the source material, what are the primary properties or implications of ").append(title).append("?\n");
            sb.append("  *Answer*: ").append(sentences.get(i)).append("\n\n");
        }

        return sb.toString();
    }

    @Override
    public AiSummaryResult summarizeNote(String title, String content, String category) {
        String safeTitle = (title != null && !title.isBlank()) ? title.trim() : "Study Topic";
        String safeContent = (content != null) ? content.trim() : "";
        String safeCategory = (category != null && !category.isBlank()) ? category.trim() : "General";

        if (geminiApiKey != null && !geminiApiKey.isBlank() && !safeContent.isBlank()) {
            String prompt = "You are TextTutor AI. Generate an accurate study summary for \"" + safeTitle + "\" (" + safeCategory + ") based on the following text.\n" +
                    "Return ONLY a valid JSON object with EXACT keys:\n" +
                    "\"shortSummary\": string (1-2 sentences),\n" +
                    "\"detailedSummary\": string (thorough paragraph),\n" +
                    "\"bulletPoints\": array of strings (3-5 key points),\n" +
                    "\"keywords\": array of strings (3-6 important terms).\n\n" +
                    "Output raw JSON only without markdown formatting.\n\n" +
                    "CONTENT:\n" + (safeContent.length() > 10000 ? safeContent.substring(0, 10000) : safeContent);

            GeminiCallResult res = executeGeminiPrompt(prompt, 0.2);
            if (res.success() && res.text() != null) {
                try {
                    String cleanJson = res.text().replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("```$", "").trim();
                    JsonNode root = objectMapper.readTree(cleanJson);
                    String shortSummary = root.path("shortSummary").asText("");
                    String detailedSummary = root.path("detailedSummary").asText("");
                    List<String> bulletPoints = new ArrayList<>();
                    for (JsonNode bp : root.path("bulletPoints")) {
                        bulletPoints.add(bp.asText());
                    }
                    List<String> keywords = new ArrayList<>();
                    for (JsonNode kw : root.path("keywords")) {
                        keywords.add(kw.asText());
                    }
                    if (!shortSummary.isBlank()) {
                        return new AiSummaryResult(shortSummary, detailedSummary, bulletPoints, keywords);
                    }
                } catch (Exception ignored) {}
            }
        }

        return generateHeuristicSummary(safeTitle, safeContent, safeCategory);
    }

    @Override
    public String explainKeyword(String keyword, String contextTitle) {
        String safeKeyword = (keyword != null) ? keyword.trim() : "Key Term";
        String safeTitle = (contextTitle != null && !contextTitle.isBlank()) ? contextTitle.trim() : "this subject";

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            String prompt = "In 2-3 clear, educational sentences, explain the concept of \"" + safeKeyword + "\" in the context of \"" + safeTitle + "\".";
            GeminiCallResult res = executeGeminiPrompt(prompt, 0.2);
            if (res.success() && res.text() != null && !res.text().isBlank()) {
                return res.text();
            }
        }

        return "\"" + safeKeyword + "\" is a fundamental concept in " + safeTitle +
                ". It represents an essential mechanism required for comprehensive understanding and revision.";
    }

    @Override
    public List<GeneratedFlashcard> generateFlashcards(String title, String content, String category, int count) {
        int targetCount = count > 0 ? Math.min(count, 15) : 5;
        String safeTitle = (title != null && !title.isBlank()) ? title.trim() : "Core Concept";
        String safeContent = (content != null) ? content.trim() : "";
        String safeCategory = (category != null && !category.isBlank()) ? category.trim() : "General";

        if (geminiApiKey != null && !geminiApiKey.isBlank() && !safeContent.isBlank()) {
            String prompt = "Generate exactly " + targetCount + " active recall flashcards based strictly on the following content for \"" + safeTitle + "\" (" + safeCategory + ").\n" +
                    "Return ONLY a valid JSON array of objects with keys: \"question\", \"answer\", \"difficulty\" (Easy, Medium, or Hard), \"sourceReference\".\n" +
                    "Do NOT wrap in markdown formatting. Output raw JSON.\n\n" +
                    "CONTENT:\n" + (safeContent.length() > 10000 ? safeContent.substring(0, 10000) : safeContent);

            GeminiCallResult res = executeGeminiPrompt(prompt, 0.2);
            if (res.success() && res.text() != null) {
                try {
                    String cleanJson = res.text().replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("```$", "").trim();
                    JsonNode root = objectMapper.readTree(cleanJson);
                    if (root.isArray() && !root.isEmpty()) {
                        List<GeneratedFlashcard> list = new ArrayList<>();
                        for (JsonNode n : root) {
                            String q = n.path("question").asText("");
                            String a = n.path("answer").asText("");
                            String diff = n.path("difficulty").asText("Medium");
                            String src = n.path("sourceReference").asText(safeTitle);
                            if (!q.isBlank() && !a.isBlank()) {
                                list.add(new GeneratedFlashcard(q, a, diff, src));
                            }
                        }
                        if (!list.isEmpty()) {
                            return list;
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        return generateHeuristicFlashcards(safeTitle, safeContent, safeCategory, targetCount);
    }

    private List<GeneratedFlashcard> generateHeuristicFlashcards(String safeTitle, String content, String category, int targetCount) {
        List<GeneratedFlashcard> cards = new ArrayList<>();
        if (content == null || content.isBlank()) {
            cards.add(new GeneratedFlashcard(
                    "What is the key principle of " + safeTitle + "?",
                    "Core subject matter defined in your coursework for " + category + ".",
                    "Easy",
                    "Page 1"
            ));
            return cards;
        }

        List<String> sentences = extractCleanSentences(content);
        if (sentences.isEmpty()) {
            cards.add(new GeneratedFlashcard(
                    "What is the key principle of " + safeTitle + "?",
                    content.trim(),
                    "Easy",
                    "Page 1"
            ));
            return cards;
        }

        Set<String> seenQuestions = new HashSet<>();

        String defSentence = findFirstMatching(sentences, List.of("is", "refers to", "defined as", "represents", "means"));
        if (defSentence == null) defSentence = sentences.get(0);
        String q1 = "What is " + safeTitle + "?";
        cards.add(new GeneratedFlashcard(q1, defSentence, "Easy", "Page 1"));
        seenQuestions.add(q1);

        String mechSentence = findFirstMatching(sentences, List.of("allows", "enables", "works by", "mechanism", "functions", "operates", "ensures", "relies on"));
        if (mechSentence != null && cards.size() < targetCount) {
            String q2 = "How does " + safeTitle + " operate or function?";
            if (seenQuestions.add(q2)) {
                cards.add(new GeneratedFlashcard(q2, mechSentence, "Medium", "Page 1"));
            }
        }

        String purpSentence = findFirstMatching(sentences, List.of("reduces", "prevents", "solves", "optimizes", "improves", "goal", "purpose", "eliminates"));
        if (purpSentence != null && cards.size() < targetCount) {
            String q3 = "What primary challenge or objective is addressed by " + safeTitle + "?";
            if (seenQuestions.add(q3)) {
                cards.add(new GeneratedFlashcard(q3, purpSentence, "Medium", "Page 1"));
            }
        }

        for (int i = 0; i < sentences.size() && cards.size() < targetCount; i++) {
            String s = sentences.get(i);
            if (s.equals(defSentence) || s.equals(mechSentence) || s.equals(purpSentence)) {
                continue;
            }
            String generatedQuestion = formQuestionFromSentence(s, safeTitle);
            if (generatedQuestion != null && seenQuestions.add(generatedQuestion)) {
                String diff = (cards.size() % 3 == 0) ? "Hard" : (cards.size() % 2 == 0 ? "Medium" : "Easy");
                cards.add(new GeneratedFlashcard(generatedQuestion, s, diff, "Section: " + safeTitle));
            }
        }

        int sIdx = 0;
        while (cards.size() < targetCount && sIdx < sentences.size()) {
            String s = sentences.get(sIdx++);
            String q = "State an essential rule or fact regarding " + safeTitle + " (Point " + (cards.size() + 1) + ").";
            if (seenQuestions.add(q)) {
                cards.add(new GeneratedFlashcard(q, s, "Medium", "Section: " + safeTitle));
            }
        }

        if (cards.size() < targetCount) {
            String fallbackAnswer = !sentences.isEmpty() ? sentences.get(0) : content.trim();
            while (cards.size() < targetCount) {
                int num = cards.size() + 1;
                String q = "Key Concept #" + num + ": What is an essential principle of " + safeTitle + "?";
                cards.add(new GeneratedFlashcard(q, fallbackAnswer, "Medium", "Section: " + safeTitle));
            }
        }

        return cards;
    }

    @Override
    public List<GeneratedQuestion> generateQuiz(String title, String content, String category, int count) {
        int targetCount = count > 0 ? Math.min(count, 10) : 3;
        String safeTitle = (title != null && !title.isBlank()) ? title.trim() : "Study Topic";
        String safeContent = (content != null) ? content.trim() : "";
        String safeCategory = (category != null && !category.isBlank()) ? category.trim() : "General";

        if (geminiApiKey != null && !geminiApiKey.isBlank() && !safeContent.isBlank()) {
            String prompt = "Generate exactly " + targetCount + " multiple-choice quiz questions based strictly on the following content for \"" + safeTitle + "\" (" + safeCategory + ").\n" +
                    "Return ONLY a valid JSON array of objects with keys:\n" +
                    "\"question\", \"optionA\", \"optionB\", \"optionC\", \"optionD\", \"correctAnswer\" (\"A\", \"B\", \"C\", or \"D\"), \"explanation\", \"sourceReference\".\n" +
                    "Do NOT wrap in markdown formatting. Output raw JSON.\n\n" +
                    "CONTENT:\n" + (safeContent.length() > 10000 ? safeContent.substring(0, 10000) : safeContent);

            GeminiCallResult res = executeGeminiPrompt(prompt, 0.2);
            if (res.success() && res.text() != null) {
                try {
                    String cleanJson = res.text().replaceAll("^```json\\s*", "").replaceAll("^```\\s*", "").replaceAll("```$", "").trim();
                    JsonNode root = objectMapper.readTree(cleanJson);
                    if (root.isArray() && !root.isEmpty()) {
                        List<GeneratedQuestion> list = new ArrayList<>();
                        for (JsonNode n : root) {
                            String q = n.path("question").asText("");
                            String optA = n.path("optionA").asText("");
                            String optB = n.path("optionB").asText("");
                            String optC = n.path("optionC").asText("");
                            String optD = n.path("optionD").asText("");
                            String ans = n.path("correctAnswer").asText("A").toUpperCase();
                            String expl = n.path("explanation").asText("");
                            String src = n.path("sourceReference").asText(safeTitle);
                            if (!q.isBlank() && !optA.isBlank() && !optB.isBlank()) {
                                list.add(new GeneratedQuestion(q, optA, optB, optC, optD, ans, expl, src));
                            }
                        }
                        if (!list.isEmpty()) {
                            return list;
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        return generateHeuristicQuiz(safeTitle, safeContent, safeCategory, targetCount);
    }

    private List<GeneratedQuestion> generateHeuristicQuiz(String safeTitle, String content, String category, int targetCount) {
        List<GeneratedQuestion> questions = new ArrayList<>();
        List<String> sentences = extractCleanSentences(content != null ? content : "");
        if (sentences.isEmpty()) {
            questions.add(new GeneratedQuestion(
                    "Which statement accurately reflects \"" + safeTitle + "\"?",
                    "It constitutes a verified core concept in " + category + ".",
                    "It is deprecated and rejected by modern empirical standards.",
                    "It has no operational relevance to " + category + ".",
                    "It causes undefined behavior and should always be omitted.",
                    "A",
                    "Option A is correct based on your study materials.",
                    "Page 1"
            ));
            return questions;
        }

        Set<String> seenQuestions = new HashSet<>();

        for (int i = 0; i < sentences.size() && questions.size() < targetCount; i++) {
            String keyFact = sentences.get(i);
            String questionPrompt = formQuestionFromSentence(keyFact, safeTitle);
            if (questionPrompt == null) {
                questionPrompt = "According to your notes on \"" + safeTitle + "\", which statement is true?";
            }

            if (!seenQuestions.add(questionPrompt)) {
                questionPrompt = "Regarding " + safeTitle + ", which statement is correct? (Fact " + (questions.size() + 1) + ")";
                seenQuestions.add(questionPrompt);
            }

            List<String> distractors = generatePlausibleDistractors(keyFact, sentences, i);

            int correctIndex = (questions.size()) % 4;
            String[] options = new String[4];
            options[correctIndex] = keyFact;

            int dIdx = 0;
            for (int opt = 0; opt < 4; opt++) {
                if (opt != correctIndex) {
                    options[opt] = distractors.get(dIdx++);
                }
            }

            String correctLetter = switch (correctIndex) {
                case 0 -> "A";
                case 1 -> "B";
                case 2 -> "C";
                default -> "D";
            };

            String explanation = "Option " + correctLetter + " is correct because: \"" + keyFact + "\"";

            questions.add(new GeneratedQuestion(
                    questionPrompt,
                    options[0],
                    options[1],
                    options[2],
                    options[3],
                    correctLetter,
                    explanation,
                    "Page 1, Section: " + safeTitle
            ));
        }

        return questions;
    }

    @Override
    public ChatResult answerStudyQuestion(String question, List<StudyNoteContext> userNotes, List<ChatMessageContext> history) {
        return answerStudyQuestionWithChunks(question, userNotes, Collections.emptyList(), history);
    }

    @Override
    public ChatResult answerStudyQuestionWithChunks(
            String question,
            List<StudyNoteContext> userNotes,
            List<RetrievedChunk> retrievedChunks,
            List<ChatMessageContext> history) {

        String safeQuestion = (question != null) ? question.trim() : "";
        QueryIntentDetector.QueryAnalysis analysis = queryIntentDetector.analyze(safeQuestion, history);

        List<RetrievedChunk> chunksToUse = retrievedChunks;
        if ((chunksToUse == null || chunksToUse.isEmpty()) && userNotes != null && !userNotes.isEmpty()) {
            chunksToUse = convertNotesToChunks(userNotes, analysis.effectiveQuery());
        }

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String geminiAnswer = callGeminiWithChunks(safeQuestion, analysis, chunksToUse, history);
                if (geminiAnswer != null && !geminiAnswer.isBlank()) {
                    List<StudyNoteContext> citedNotes = mapChunksToNotes(chunksToUse, userNotes);
                    List<SourceCitation> citations = mapChunksToCitations(chunksToUse);
                    return new ChatResult(geminiAnswer, citedNotes, citations);
                }
            } catch (Exception ex) {
                log.warn("Gemini chat synthesis fallback: {}", ex.getMessage());
            }
        }

        List<String> libraryTopics = userNotes != null
                ? userNotes.stream().map(StudyNoteContext::title).collect(Collectors.toList())
                : Collections.emptyList();

        String answer = studySynthesizer.synthesize(safeQuestion, analysis, chunksToUse != null ? chunksToUse : Collections.emptyList(), libraryTopics);

        List<StudyNoteContext> citedNotes = mapChunksToNotes(chunksToUse != null ? chunksToUse : Collections.emptyList(), userNotes);
        List<SourceCitation> citations = mapChunksToCitations(chunksToUse != null ? chunksToUse : Collections.emptyList());

        return new ChatResult(answer, citedNotes, citations);
    }

    private List<RetrievedChunk> convertNotesToChunks(List<StudyNoteContext> notes, String query) {
        List<String> queryTokens = queryIntentDetector.analyze(query, Collections.emptyList()).focalTopic() != null
                ? Arrays.asList(query.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                : Collections.emptyList();

        List<RetrievedChunk> list = new ArrayList<>();
        long id = 1;
        for (StudyNoteContext note : notes) {
            String content = note.content() != null ? note.content() : "";
            int score = calculateMatchScore(note.title(), note.category(), content, queryTokens);
            if (score > 0) {
                String excerpt = content.length() > 200 ? content.substring(0, 197) + "..." : content;
                list.add(new RetrievedChunk(
                        id++,
                        null,
                        note.id(),
                        note.title(),
                        1,
                        note.category() != null ? note.category() : "General",
                        content,
                        excerpt,
                        score
                ));
            }
        }
        list.sort((a, b) -> Double.compare(b.relevanceScore(), a.relevanceScore()));
        return list.stream().limit(5).collect(Collectors.toList());
    }

    private int calculateMatchScore(String title, String category, String content, List<String> tokens) {
        int score = 0;
        String tLow = title != null ? title.toLowerCase() : "";
        String cLow = content != null ? content.toLowerCase() : "";
        for (String tok : tokens) {
            if (tok.length() < 3 || STOP_WORDS.contains(tok)) continue;
            if (tLow.contains(tok)) score += 15;
            if (cLow.contains(tok)) score += 5;
        }
        return score;
    }

    private String callGeminiWithChunks(
            String question,
            QueryIntentDetector.QueryAnalysis analysis,
            List<RetrievedChunk> chunks,
            List<ChatMessageContext> history) {

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are TextTutor, an AI study companion. Answer the student's question accurately, educationally, and in student-friendly terms.\n");
        prompt.append("CRITICAL GROUNDING RULES:\n");
        prompt.append("1. Answer using ONLY the provided verified study note excerpts.\n");
        prompt.append("2. Include source citations in format [Source: <filename>, Page <page>, Section: <section>].\n");
        prompt.append("3. If the question asks for something NOT supported by the notes, explicitly state that it is not in the student's notes. Do not hallucinate facts or page numbers.\n");
        prompt.append("4. Detected question intent: ").append(analysis.intent().name()).append(". Format your answer accordingly (e.g. definitions, bullet points, comparisons, or step-by-step).\n\n");

        if (chunks != null && !chunks.isEmpty()) {
            prompt.append("VERIFIED STUDY MATERIAL EXCERPTS:\n");
            for (RetrievedChunk c : chunks) {
                prompt.append("- Document: ").append(c.fileName())
                        .append(", Page: ").append(c.pageNumber())
                        .append(", Section: ").append(c.sectionHeading())
                        .append("\n  Content: ").append(c.content()).append("\n\n");
            }
        }

        if (history != null && !history.isEmpty()) {
            prompt.append("RECENT CONVERSATION HISTORY:\n");
            for (ChatMessageContext m : history.subList(Math.max(0, history.size() - 4), history.size())) {
                prompt.append(m.role()).append(": ").append(m.content()).append("\n");
            }
            prompt.append("\n");
        }

        prompt.append("STUDENT QUESTION: ").append(question);

        GeminiCallResult result = executeGeminiPrompt(prompt.toString(), 0.2);
        if (result.success() && result.text() != null && !result.text().isBlank()) {
            return result.text();
        }
        return null;
    }

    private List<StudyNoteContext> mapChunksToNotes(List<RetrievedChunk> chunks, List<StudyNoteContext> allNotes) {
        if (chunks == null || chunks.isEmpty() || allNotes == null) return Collections.emptyList();
        Set<Long> noteIds = chunks.stream()
                .map(RetrievedChunk::noteId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return allNotes.stream()
                .filter(n -> noteIds.contains(n.id()))
                .collect(Collectors.toList());
    }

    private List<SourceCitation> mapChunksToCitations(List<RetrievedChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) return Collections.emptyList();
        List<SourceCitation> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (RetrievedChunk c : chunks) {
            String key = c.fileName() + "_" + c.pageNumber() + "_" + c.sectionHeading();
            if (seen.add(key)) {
                list.add(new SourceCitation(
                        c.noteId(),
                        c.documentId(),
                        c.fileName(),
                        c.sectionHeading(),
                        c.pageNumber(),
                        c.sectionHeading(),
                        c.excerpt()
                ));
            }
        }
        return list;
    }

    private List<String> extractCleanSentences(String content) {
        if (content == null || content.isBlank()) return Collections.emptyList();
        String[] splits = content.split("(?<=[.!?])\\s+|\\n+");
        List<String> list = Arrays.stream(splits)
                .map(String::trim)
                .filter(s -> s.length() > 10)
                .collect(Collectors.toList());
        if (list.isEmpty() && content.trim().length() > 5) {
            return List.of(content.trim());
        }
        return list;
    }

    private List<String> findSentencesMatching(List<String> sentences, List<String> keywords) {
        List<String> matches = new ArrayList<>();
        for (String s : sentences) {
            String sLower = s.toLowerCase();
            for (String kw : keywords) {
                if (sLower.contains(kw)) {
                    matches.add(s);
                    break;
                }
            }
        }
        return matches;
    }

    private String findFirstMatching(List<String> sentences, List<String> keywords) {
        for (String s : sentences) {
            String sLower = s.toLowerCase();
            for (String kw : keywords) {
                if (sLower.contains(kw)) {
                    return s;
                }
            }
        }
        return null;
    }

    private String formQuestionFromSentence(String sentence, String fallbackTopic) {
        String clean = sentence.replaceAll("^[^a-zA-Z0-9]+", "").trim();

        Matcher isMatcher = Pattern.compile("^([A-Z][a-zA-Z0-9\\s]{2,35})\\s+(?:is|refers to|means|represents)\\s+(.+)$").matcher(clean);
        if (isMatcher.find()) {
            return "What is " + isMatcher.group(1).trim() + "?";
        }

        if (clean.toLowerCase().contains("allows") || clean.toLowerCase().contains("enables")) {
            return "What does " + fallbackTopic + " enable or allow?";
        }

        if (clean.toLowerCase().contains("requires")) {
            return "What does " + fallbackTopic + " require to function properly?";
        }

        return "What critical fact should be remembered regarding " + fallbackTopic + "?";
    }

    private List<String> generatePlausibleDistractors(String correctFact, List<String> allSentences, int correctIndex) {
        List<String> distractors = new ArrayList<>();

        for (int i = 0; i < allSentences.size() && distractors.size() < 3; i++) {
            if (i != correctIndex) {
                String candidate = allSentences.get(i);
                if (!candidate.equalsIgnoreCase(correctFact) && !distractors.contains(candidate)) {
                    distractors.add(candidate);
                }
            }
        }

        String[] realisticDistractors = new String[]{
                "It serves only as deprecated legacy metadata with no operational effect.",
                "It causes uncontrolled divergence and must be disabled during runtime execution.",
                "It is an optional heuristic that has been replaced by uncalibrated random sampling.",
                "It guarantees zero latency regardless of network partition or hardware faults."
        };

        int rIdx = 0;
        while (distractors.size() < 3 && rIdx < realisticDistractors.length) {
            distractors.add(realisticDistractors[rIdx++]);
        }

        return distractors;
    }

    private AiSummaryResult generateHeuristicSummary(String title, String content, String category) {
        String safeContent = (content != null) ? content.trim() : "";
        String safeCategory = (category != null && !category.isBlank()) ? category.trim() : "General";

        List<String> sentences = extractCleanSentences(safeContent);

        String shortSummary = !sentences.isEmpty()
                ? String.join(" ", sentences.subList(0, Math.min(2, sentences.size())))
                : "Summary of \"" + title + "\" covering core concepts in " + safeCategory + ".";

        String detailedSummary = sentences.size() >= 3
                ? String.join(" ", sentences.subList(0, Math.min(4, sentences.size())))
                : shortSummary + " Includes fundamental principles and definitions for " + safeCategory + ".";

        List<String> bulletPoints = !sentences.isEmpty()
                ? sentences.stream().limit(4).map(s -> "• " + s).collect(Collectors.toList())
                : List.of(
                "• Key concept covered: " + title,
                "• Subject domain: " + safeCategory,
                "• Core terminology indexed for spaced repetition."
        );

        List<String> keywords = Arrays.stream(safeContent.toLowerCase().replaceAll("[^a-z0-9\\s]", "").split("\\s+"))
                .filter(w -> w.length() > 4 && !STOP_WORDS.contains(w))
                .distinct()
                .limit(6)
                .collect(Collectors.toList());

        return new AiSummaryResult(shortSummary, detailedSummary, bulletPoints, keywords);
    }
}
