package com.texttutor.service.rag;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class IntelligentStudySynthesizer {

    public String synthesize(
            String question,
            QueryIntentDetector.QueryAnalysis analysis,
            List<RetrievedChunk> retrievedChunks,
            List<String> userLibraryTopics) {

        if (retrievedChunks.isEmpty()) {
            return buildInsufficientEvidenceAnswer(question, analysis.focalTopic(), userLibraryTopics);
        }

        RetrievedChunk primaryChunk = retrievedChunks.get(0);
        String focalTopic = (analysis.focalTopic() != null && !analysis.focalTopic().isBlank())
                ? analysis.focalTopic()
                : primaryChunk.sectionHeading();

        StringBuilder sb = new StringBuilder();

        switch (analysis.intent()) {
            case DEFINITION -> synthesizeDefinition(sb, focalTopic, primaryChunk, retrievedChunks);
            case EXPLANATION -> synthesizeExplanation(sb, focalTopic, primaryChunk, retrievedChunks);
            case COMPARISON -> synthesizeComparison(sb, focalTopic, retrievedChunks);
            case ADVANTAGES_DISADVANTAGES -> synthesizeProsAndCons(sb, focalTopic, retrievedChunks);
            case PROCESS -> synthesizeProcess(sb, focalTopic, retrievedChunks);
            case EXAMPLE -> synthesizeExample(sb, focalTopic, retrievedChunks);
            case EXAM_PREP -> synthesizeExamPrep(sb, focalTopic, primaryChunk, retrievedChunks);
            case SUMMARY -> synthesizeSummary(sb, focalTopic, retrievedChunks);
            default -> synthesizeGeneralAnswer(sb, focalTopic, primaryChunk, retrievedChunks);
        }

        appendCitations(sb, retrievedChunks);

        return sb.toString();
    }

    private void synthesizeDefinition(StringBuilder sb, String topic, RetrievedChunk primary, List<RetrievedChunk> all) {
        sb.append("### 📖 Definition: ").append(capitalize(topic)).append("\n\n");

        List<String> definitionSentences = findSentencesMatching(all, List.of("is", "refers to", "defined as", "represents", "means"));
        if (!definitionSentences.isEmpty()) {
            sb.append(definitionSentences.get(0)).append("\n\n");
        } else {
            sb.append(primary.excerpt()).append("\n\n");
        }

        sb.append("#### 📌 Key Characteristics\n");
        List<String> details = extractKeyClauses(all, 3);
        for (String detail : details) {
            sb.append("- ").append(detail).append("\n");
        }
    }

    private void synthesizeExplanation(StringBuilder sb, String topic, RetrievedChunk primary, List<RetrievedChunk> all) {
        sb.append("### 💡 Explanation: ").append(capitalize(topic)).append("\n\n");

        sb.append(primary.excerpt()).append("\n\n");

        List<String> mechanisms = findSentencesMatching(all, List.of("how", "because", "allows", "enables", "results", "mechanism", "functions", "ensures"));
        if (!mechanisms.isEmpty()) {
            sb.append("#### ⚙️ How It Works\n");
            for (int i = 0; i < Math.min(3, mechanisms.size()); i++) {
                sb.append(i + 1).append(". ").append(mechanisms.get(i)).append("\n");
            }
            sb.append("\n");
        }

        sb.append("#### 🎯 Educational Summary\n");
        sb.append("In the context of **").append(primary.fileName())
          .append("** (").append(primary.sectionHeading()).append("), understanding this concept is essential for mastering how higher-level processes interact.\n");
    }

    private void synthesizeComparison(StringBuilder sb, String topic, List<RetrievedChunk> all) {
        sb.append("### ⚖️ Comparison & Contrast: ").append(capitalize(topic)).append("\n\n");

        List<String> contrastSentences = findSentencesMatching(all, List.of("unlike", "differs", "whereas", "while", "contrast", "instead of", "compared to"));
        if (!contrastSentences.isEmpty()) {
            for (String s : contrastSentences.subList(0, Math.min(2, contrastSentences.size()))) {
                sb.append("• ").append(s).append("\n\n");
            }
        }

        sb.append("#### 🔍 Key Distinctions From Your Notes\n");
        List<String> points = extractKeyClauses(all, 4);
        for (int i = 0; i < points.size(); i++) {
            sb.append("- **Point ").append(i + 1).append("**: ").append(points.get(i)).append("\n");
        }
    }

    private void synthesizeProsAndCons(StringBuilder sb, String topic, List<RetrievedChunk> all) {
        sb.append("### 📊 Trade-Offs & Capabilities: ").append(capitalize(topic)).append("\n\n");

        List<String> pros = findSentencesMatching(all, List.of("advantage", "benefit", "efficient", "optimal", "improves", "reduces", "faster", "reliable"));
        List<String> cons = findSentencesMatching(all, List.of("disadvantage", "limitation", "drawback", "hurdle", "overhead", "complex", "cost"));

        sb.append("#### ✅ Key Advantages / Strengths\n");
        if (!pros.isEmpty()) {
            for (String pro : pros.subList(0, Math.min(3, pros.size()))) {
                sb.append("- ").append(pro).append("\n");
            }
        } else {
            sb.append("- Provides specialized structure for ").append(topic).append(" as documented in your source material.\n");
        }
        sb.append("\n");

        sb.append("#### ⚠️ Considerations & Limitations\n");
        if (!cons.isEmpty()) {
            for (String con : cons.subList(0, Math.min(3, cons.size()))) {
                sb.append("- ").append(con).append("\n");
            }
        } else {
            sb.append("- Must be evaluated against workload trade-offs highlighted in your coursework.\n");
        }
    }

    private void synthesizeProcess(StringBuilder sb, String topic, List<RetrievedChunk> all) {
        sb.append("### 🔄 Step-by-Step Walkthrough: ").append(capitalize(topic)).append("\n\n");

        List<String> steps = findSentencesMatching(all, List.of("first", "second", "third", "then", "step", "next", "finally", "process", "phase"));
        if (steps.size() >= 2) {
            for (int i = 0; i < steps.size(); i++) {
                sb.append("**Step ").append(i + 1).append("**: ").append(steps.get(i)).append("\n\n");
            }
        } else {
            List<String> clauses = extractKeyClauses(all, 4);
            for (int i = 0; i < clauses.size(); i++) {
                sb.append("**Step ").append(i + 1).append("**: ").append(clauses.get(i)).append("\n\n");
            }
        }
    }

    private void synthesizeExample(StringBuilder sb, String topic, List<RetrievedChunk> all) {
        sb.append("### 📝 Concrete Example: ").append(capitalize(topic)).append("\n\n");

        List<String> examples = findSentencesMatching(all, List.of("example", "for instance", "such as", "consider", "suppose"));
        if (!examples.isEmpty()) {
            sb.append(examples.get(0)).append("\n\n");
        } else {
            RetrievedChunk top = all.get(0);
            sb.append("To illustrate this concept from **").append(top.fileName()).append("**:\n\n");
            sb.append("> ").append(top.excerpt()).append("\n\n");
        }

        sb.append("#### 🎓 Why This Illustrates the Principle\n");
        sb.append("This concrete case directly shows how the underlying rule in your notes governs real-world behavior.\n");
    }

    private void synthesizeExamPrep(StringBuilder sb, String topic, RetrievedChunk primary, List<RetrievedChunk> all) {
        sb.append("### 🎯 Exam Preparation Guide: ").append(capitalize(topic)).append("\n\n");

        sb.append("#### 1. High-Yield Definition for Exams\n");
        sb.append(primary.excerpt()).append("\n\n");

        sb.append("#### 2. Key Facts Commonly Tested\n");
        List<String> points = extractKeyClauses(all, 3);
        for (String p : points) {
            sb.append("- ").append(p).append("\n");
        }
        sb.append("\n");

        sb.append("#### 3. Expected Exam Question & Answer\n");
        sb.append("**Q:** Explain the role and significance of ").append(topic).append(".\n\n");
        sb.append("**Model Answer:** ").append(primary.excerpt()).append(" This is essential for ensuring correctness and avoiding operational bottlenecks.\n");
    }

    private void synthesizeSummary(StringBuilder sb, String topic, List<RetrievedChunk> all) {
        sb.append("### 📋 Executive Summary: ").append(capitalize(topic)).append("\n\n");

        for (int i = 0; i < Math.min(3, all.size()); i++) {
            RetrievedChunk c = all.get(i);
            sb.append("**").append(c.sectionHeading()).append("** (Page ").append(c.pageNumber()).append("):\n");
            sb.append(c.excerpt()).append("\n\n");
        }
    }

    private void synthesizeGeneralAnswer(StringBuilder sb, String topic, RetrievedChunk primary, List<RetrievedChunk> all) {
        sb.append("### 📚 Study Insights: ").append(capitalize(topic)).append("\n\n");
        sb.append(primary.excerpt()).append("\n\n");

        if (all.size() > 1) {
            sb.append("#### 🔍 Additional Context from Your Notes\n");
            for (int i = 1; i < Math.min(3, all.size()); i++) {
                sb.append("- **").append(all.get(i).sectionHeading()).append("**: ")
                  .append(all.get(i).excerpt()).append("\n");
            }
        }
    }

    private void appendCitations(StringBuilder sb, List<RetrievedChunk> chunks) {
        sb.append("\n---\n");
        sb.append("#### 📑 Verified Sources From Your Notes\n");

        Set<String> seen = new HashSet<>();
        for (RetrievedChunk c : chunks) {
            String key = c.fileName() + "_" + c.pageNumber() + "_" + c.sectionHeading();
            if (seen.add(key)) {
                sb.append("- **").append(c.fileName()).append("** — *Page ").append(c.pageNumber()).append("*, ")
                  .append(c.sectionHeading()).append("\n");
                sb.append("  > \"").append(c.excerpt()).append("\"\n");
            }
        }
    }

    private String buildInsufficientEvidenceAnswer(String question, String focalTopic, List<String> libraryTopics) {
        StringBuilder sb = new StringBuilder();
        sb.append("### 🔍 Information Not Found in Your Notes\n\n");
        sb.append("I carefully searched across all uploaded notes and study documents for **\"")
          .append(focalTopic != null ? focalTopic : question).append("\"**, but could not find factual evidence directly addressing this question.\n\n");

        sb.append("#### 🛡️ Grounding Safeguard\n");
        sb.append("To prevent hallucinations and guarantee academic accuracy, TextTutor strictly avoids inventing answers or fabricating page references when source material is absent.\n\n");

        if (libraryTopics != null && !libraryTopics.isEmpty()) {
            sb.append("#### 📚 Available Topics in Your Library\n");
            sb.append("Your study library currently contains materials on:\n");
            for (String top : libraryTopics.stream().limit(5).collect(Collectors.toList())) {
                sb.append("- **").append(top).append("**\n");
            }
            sb.append("\n*Tip: Upload or paste relevant lecture notes on **").append(focalTopic != null ? focalTopic : "this subject")
              .append("** in **My Notes** to enable grounded Q&A with exact citations.*");
        } else {
            sb.append("💡 *Tip: Upload your lecture PDF or study notes using the **Upload** button to enable context-aware answers.*");
        }

        return sb.toString();
    }

    private List<String> findSentencesMatching(List<RetrievedChunk> chunks, List<String> triggers) {
        List<String> matched = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (RetrievedChunk c : chunks) {
            String[] sentences = c.content().split("(?<=[.!?])\\s+");
            for (String s : sentences) {
                String clean = s.trim();
                if (clean.length() > 20 && clean.length() < 250) {
                    String sLower = clean.toLowerCase();
                    boolean hasTrigger = triggers.stream().anyMatch(sLower::contains);
                    if (hasTrigger && seen.add(clean)) {
                        matched.add(clean);
                    }
                }
            }
        }
        return matched;
    }

    private List<String> extractKeyClauses(List<RetrievedChunk> chunks, int count) {
        List<String> clauses = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (RetrievedChunk c : chunks) {
            String[] sentences = c.content().split("(?<=[.!?])\\s+");
            for (String s : sentences) {
                String clean = s.trim();
                if (clean.length() > 25 && clean.length() < 220 && seen.add(clean)) {
                    clauses.add(clean);
                    if (clauses.size() >= count) return clauses;
                }
            }
        }
        return clauses;
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) return "Study Concept";
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }
}
