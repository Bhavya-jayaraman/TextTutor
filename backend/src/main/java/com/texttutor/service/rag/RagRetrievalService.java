package com.texttutor.service.rag;

import com.texttutor.entity.DocumentChunk;
import com.texttutor.entity.User;
import com.texttutor.repository.DocumentChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RagRetrievalService {

    private final DocumentChunkRepository documentChunkRepository;
    private final int defaultMaxChunks;

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

    public RagRetrievalService(
            DocumentChunkRepository documentChunkRepository,
            @Value("${texttutor.rag.max-retrieval-chunks:5}") int defaultMaxChunks) {
        this.documentChunkRepository = documentChunkRepository;
        this.defaultMaxChunks = defaultMaxChunks;
    }

    @Transactional(readOnly = true)
    public List<RetrievedChunk> retrieve(User user, String query, List<Long> filterNoteIds, int maxChunks) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        List<DocumentChunk> candidateChunks;
        if (filterNoteIds != null && !filterNoteIds.isEmpty()) {
            candidateChunks = documentChunkRepository.findByUserAndNoteIds(user, filterNoteIds);
        } else {
            candidateChunks = documentChunkRepository.findByUser(user);
        }

        if (candidateChunks.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> queryTokens = extractTokens(query);
        if (queryTokens.isEmpty()) {
            return Collections.emptyList();
        }

        // Calculate collection-level term document frequency (DF) for IDF calculation
        Map<String, Integer> docFrequencies = new HashMap<>();
        for (String token : queryTokens) {
            int df = 0;
            for (DocumentChunk chunk : candidateChunks) {
                String keywords = chunk.getTokenKeywords() != null ? chunk.getTokenKeywords() : "";
                if (keywords.contains(token)) {
                    df++;
                }
            }
            docFrequencies.put(token, Math.max(1, df));
        }

        int totalDocs = candidateChunks.size();
        List<RetrievedChunk> scored = new ArrayList<>();

        for (DocumentChunk chunk : candidateChunks) {
            double score = scoreChunk(chunk, query, queryTokens, docFrequencies, totalDocs);
            // Minimum threshold to prevent returning irrelevant noise
            if (score >= 4.0) {
                String excerpt = extractBestExcerpt(chunk.getContent(), queryTokens);
                Long docId = chunk.getDocument() != null ? chunk.getDocument().getId() : null;
                Long noteId = chunk.getNote() != null ? chunk.getNote().getId() : null;
                String fileName = chunk.getFileName() != null ? chunk.getFileName() : "Study Note";
                int pageNum = chunk.getPageNumber() != null ? chunk.getPageNumber() : 1;
                String heading = chunk.getSectionHeading() != null ? chunk.getSectionHeading() : "General";

                scored.add(new RetrievedChunk(
                        chunk.getId(),
                        docId,
                        noteId,
                        fileName,
                        pageNum,
                        heading,
                        chunk.getContent(),
                        excerpt,
                        score
                ));
            }
        }

        // Sort by relevance score descending
        scored.sort((a, b) -> Double.compare(b.relevanceScore(), a.relevanceScore()));

        int limit = maxChunks > 0 ? maxChunks : defaultMaxChunks;
        return scored.stream().limit(limit).collect(Collectors.toList());
    }

    private double scoreChunk(DocumentChunk chunk, String rawQuery, List<String> queryTokens,
                              Map<String, Integer> docFrequencies, int totalDocs) {
        String contentLower = chunk.getContent() != null ? chunk.getContent().toLowerCase() : "";
        String headingLower = chunk.getSectionHeading() != null ? chunk.getSectionHeading().toLowerCase() : "";
        String fileNameLower = chunk.getFileName() != null ? chunk.getFileName().toLowerCase() : "";

        double totalScore = 0.0;
        int matchedTokens = 0;

        for (String token : queryTokens) {
            int df = docFrequencies.getOrDefault(token, 1);
            // BM25-style IDF: log(1 + (N - df + 0.5) / (df + 0.5))
            double idf = Math.log(1.0 + ((double) totalDocs - df + 0.5) / (df + 0.5));
            if (idf < 0.2) idf = 0.2;

            int countInContent = countOccurrences(contentLower, token);
            int countInHeading = countOccurrences(headingLower, token);
            int countInFileName = countOccurrences(fileNameLower, token);

            if (countInContent > 0 || countInHeading > 0 || countInFileName > 0) {
                matchedTokens++;

                // BM25-style TF with saturation
                double tf = (double) countInContent / (countInContent + 1.2);
                totalScore += tf * idf * 8.0;

                // Section heading boost (heavily indicators of topical relevance)
                if (countInHeading > 0) {
                    totalScore += idf * 15.0;
                }

                // File name / note title boost
                if (countInFileName > 0) {
                    totalScore += idf * 10.0;
                }
            }
        }

        // Exact phrase / bigram proximity boost
        if (queryTokens.size() >= 2) {
            for (int i = 0; i < queryTokens.size() - 1; i++) {
                String bigram = queryTokens.get(i) + " " + queryTokens.get(i + 1);
                if (contentLower.contains(bigram)) {
                    totalScore += 20.0;
                }
                if (headingLower.contains(bigram)) {
                    totalScore += 30.0;
                }
            }
        }

        // Coverage multiplier: penalize matching only 1 out of 5 query words
        double coverage = (double) matchedTokens / queryTokens.size();
        totalScore *= (0.5 + (coverage * 0.5));

        return totalScore;
    }

    private int countOccurrences(String text, String term) {
        if (text.isEmpty() || term.isEmpty()) return 0;
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(term, idx)) != -1) {
            count++;
            idx += term.length();
        }
        return count;
    }

    private String extractBestExcerpt(String content, List<String> queryTokens) {
        if (content == null || content.isBlank()) return "";

        String[] sentences = content.split("(?<=[.!?])\\s+");
        String bestSentence = "";
        int maxMatches = -1;

        for (String sentence : sentences) {
            String sLower = sentence.toLowerCase();
            int matches = 0;
            for (String t : queryTokens) {
                if (sLower.contains(t)) matches++;
            }
            if (matches > maxMatches && sentence.trim().length() > 20) {
                maxMatches = matches;
                bestSentence = sentence.trim();
            }
        }

        if (bestSentence.isEmpty() && sentences.length > 0) {
            bestSentence = sentences[0].trim();
        }

        if (bestSentence.length() > 200) {
            return bestSentence.substring(0, 197) + "...";
        }
        return bestSentence;
    }

    public List<String> extractTokens(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String cleaned = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
        return Arrays.stream(cleaned.split("\\s+"))
                .map(String::trim)
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w))
                .collect(Collectors.toList());
    }
}
