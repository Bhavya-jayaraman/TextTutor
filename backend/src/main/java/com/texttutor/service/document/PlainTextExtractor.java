package com.texttutor.service.document;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PlainTextExtractor {

    private static final Pattern HEADING_PATTERN = Pattern.compile(
            "^(?:#{1,4}\\s+(.+)|(?:Chapter|Section|Part|Topic)\\s+\\d+[:\\-\\s]+(.+)|[A-Z0-9\\s]{4,50}:)$",
            Pattern.MULTILINE
    );

    public ExtractedDocument extract(String fileName, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("The plain text file is empty (0 bytes).");
        }

        // Check and strip UTF-8 BOM if present
        int offset = 0;
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
            offset = 3;
        }

        String raw = new String(bytes, offset, bytes.length - offset, StandardCharsets.UTF_8);
        String normalized = raw.replace("\r\n", "\n").replace('\r', '\n').trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("The text file contains only whitespace and no readable study content.");
        }

        int wordCount = normalized.split("\\s+").length;
        int characterCount = normalized.length();

        // Check if explicit page markers exist (e.g. form feeds \f or --- Page X ---)
        String[] rawPages = normalized.split("(?:\\f|\\n-{3,}\\s*Page\\s+\\d+\\s*-{3,}\\n)");
        List<ExtractedDocument.PageContent> pages = new ArrayList<>();

        if (rawPages.length > 1) {
            for (int i = 0; i < rawPages.length; i++) {
                String pText = rawPages[i].trim();
                if (!pText.isEmpty()) {
                    List<String> headings = detectHeadings(pText);
                    pages.add(new ExtractedDocument.PageContent(i + 1, pText, headings));
                }
            }
        } else {
            // Group by paragraphs or ~2500 characters (~400 words per page)
            int estimatedPages = Math.max(1, (int) Math.ceil((double) characterCount / 2200.0));
            String[] paragraphs = normalized.split("\n\n+");
            int parasPerPage = Math.max(1, (int) Math.ceil((double) paragraphs.length / estimatedPages));

            for (int p = 0; p < estimatedPages; p++) {
                int start = p * parasPerPage;
                if (start >= paragraphs.length) break;
                int end = Math.min(paragraphs.length, (p + 1) * parasPerPage);
                String pageText = String.join("\n\n", Arrays.copyOfRange(paragraphs, start, end)).trim();
                List<String> headings = detectHeadings(pageText);
                pages.add(new ExtractedDocument.PageContent(p + 1, pageText, headings));
            }
        }

        if (pages.isEmpty()) {
            pages.add(new ExtractedDocument.PageContent(1, normalized, detectHeadings(normalized)));
        }

        return new ExtractedDocument(
                fileName,
                "txt",
                bytes.length,
                pages.size(),
                wordCount,
                characterCount,
                normalized,
                pages
        );
    }

    private List<String> detectHeadings(String text) {
        List<String> headings = new ArrayList<>();
        Matcher m = HEADING_PATTERN.matcher(text);
        while (m.find()) {
            String heading = m.group().trim().replaceAll("^#+\\s*", "");
            if (heading.length() > 3 && heading.length() < 70) {
                headings.add(heading);
            }
        }
        return headings;
    }
}
