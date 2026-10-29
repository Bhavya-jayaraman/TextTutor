package com.texttutor.service.document;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class DocumentChunker {

    private final int chunkSize;
    private final int chunkOverlap;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
            "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for",
            "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
            "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
            "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
            "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
            "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
            "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
            "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
            "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    );

    public record ChunkResult(
            int chunkIndex,
            int pageNumber,
            String sectionHeading,
            String content,
            String tokenKeywords
    ) {}

    public DocumentChunker(
            @Value("${texttutor.rag.chunk-size:600}") int chunkSize,
            @Value("${texttutor.rag.chunk-overlap:120}") int chunkOverlap) {
        this.chunkSize = Math.max(200, chunkSize);
        this.chunkOverlap = Math.min(this.chunkSize / 2, Math.max(0, chunkOverlap));
    }

    public List<ChunkResult> chunkDocument(ExtractedDocument doc) {
        List<ChunkResult> allChunks = new ArrayList<>();
        int globalChunkIndex = 0;

        for (ExtractedDocument.PageContent page : doc.pages()) {
            String activeHeading = !page.sectionHeadings().isEmpty() ? page.sectionHeadings().get(0) : "General";
            List<String> textChunks = splitIntoOverlappingChunks(page.text());

            for (String chunkText : textChunks) {
                // If the chunk itself contains a specific heading, use it
                for (String heading : page.sectionHeadings()) {
                    if (chunkText.contains(heading)) {
                        activeHeading = heading;
                        break;
                    }
                }

                String keywords = extractKeywords(chunkText, activeHeading);
                allChunks.add(new ChunkResult(
                        globalChunkIndex++,
                        page.pageNumber(),
                        activeHeading,
                        chunkText,
                        keywords
                ));
            }
        }

        return allChunks;
    }

    public List<ChunkResult> chunkText(String rawText, String title, String category) {
        if (rawText == null || rawText.isBlank()) return Collections.emptyList();

        List<ChunkResult> results = new ArrayList<>();
        List<String> textChunks = splitIntoOverlappingChunks(rawText.trim());
        int index = 0;
        String defaultHeading = (title != null && !title.isBlank()) ? title : (category != null ? category : "General");

        for (String chunk : textChunks) {
            String keywords = extractKeywords(chunk, defaultHeading);
            results.add(new ChunkResult(
                    index++,
                    1,
                    defaultHeading,
                    chunk,
                    keywords
            ));
        }

        return results;
    }

    private List<String> splitIntoOverlappingChunks(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        // If smaller than chunkSize, return single chunk
        if (text.length() <= chunkSize) {
            chunks.add(text.trim());
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());

            // Try to break at a sentence boundary (. ! ? \n\n)
            if (end < text.length()) {
                int sentenceBreak = findSentenceBreak(text, start, end);
                if (sentenceBreak > start + (chunkSize / 2)) {
                    end = sentenceBreak;
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }

            if (end >= text.length()) break;

            // Slide window forward with overlap
            int step = Math.max(1, (end - start) - chunkOverlap);
            start += step;
        }

        return chunks;
    }

    private int findSentenceBreak(String text, int start, int end) {
        for (int i = end - 1; i >= start + (chunkSize / 3); i--) {
            char c = text.charAt(i);
            if ((c == '.' || c == '!' || c == '?' || c == '\n') && i + 1 < text.length() && Character.isWhitespace(text.charAt(i + 1))) {
                return i + 1;
            }
        }
        return end;
    }

    public String extractKeywords(String content, String heading) {
        String combined = (heading != null ? heading + " " : "") + (content != null ? content : "");
        String cleaned = combined.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");

        return Arrays.stream(cleaned.split("\\s+"))
                .map(String::trim)
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w))
                .distinct()
                .collect(Collectors.joining(" "));
    }
}
