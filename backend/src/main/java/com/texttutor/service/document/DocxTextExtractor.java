package com.texttutor.service.document;

import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class DocxTextExtractor {

    private static final Pattern P_PATTERN = Pattern.compile("<w:p[ >](.*?)</w:p>", Pattern.DOTALL);
    private static final Pattern T_PATTERN = Pattern.compile("<w:t(?:\\s+[^>]*)?>([^<]*)</w:t>");
    private static final Pattern HEADING_STYLE_PATTERN = Pattern.compile("<w:pStyle\\s+w:val=\"(Heading\\d|Title|Subtitle)\"/>", Pattern.CASE_INSENSITIVE);
    private static final Pattern TAB_PATTERN = Pattern.compile("<w:tab/>");
    private static final Pattern BR_PATTERN = Pattern.compile("<w:br/>");

    public ExtractedDocument extract(String fileName, byte[] bytes) throws IOException {
        if (bytes == null || bytes.length < 4) {
            throw new IllegalArgumentException("The Word document file is empty or corrupted (0 bytes).");
        }

        // Verify PK zip header: 0x50, 0x4B
        if (bytes[0] != 0x50 || bytes[1] != 0x4B) {
            throw new IllegalArgumentException("Invalid Word document format. The file is not a valid .docx archive.");
        }

        boolean documentFound = false;
        String xmlContent = null;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("word/document.xml".equalsIgnoreCase(entry.getName())) {
                    documentFound = true;
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    byte[] temp = new byte[8192];
                    int len;
                    while ((len = zis.read(temp)) > 0) {
                        buffer.write(temp, 0, len);
                    }
                    xmlContent = buffer.toString(StandardCharsets.UTF_8);
                    break;
                }
            }
        }

        if (!documentFound || xmlContent == null) {
            throw new IllegalArgumentException("Corrupted Word document structure: missing word/document.xml.");
        }

        List<String> paragraphs = new ArrayList<>();
        List<String> allHeadings = new ArrayList<>();
        StringBuilder fullTextBuilder = new StringBuilder();

        Matcher pMatcher = P_PATTERN.matcher(xmlContent);
        while (pMatcher.find()) {
            String pXml = pMatcher.group(1);
            boolean isHeading = HEADING_STYLE_PATTERN.matcher(pXml).find();

            pXml = TAB_PATTERN.matcher(pXml).replaceAll("\t");
            pXml = BR_PATTERN.matcher(pXml).replaceAll("\n");

            StringBuilder pText = new StringBuilder();
            Matcher tMatcher = T_PATTERN.matcher(pXml);
            while (tMatcher.find()) {
                pText.append(unescapeXml(tMatcher.group(1)));
            }

            String paragraph = pText.toString().trim();
            if (!paragraph.isEmpty()) {
                paragraphs.add(paragraph);
                if (isHeading) {
                    allHeadings.add(paragraph);
                }
                if (fullTextBuilder.length() > 0) {
                    fullTextBuilder.append("\n\n");
                }
                fullTextBuilder.append(paragraph);
            }
        }

        String fullText = fullTextBuilder.toString().trim();
        if (fullText.length() < 10) {
            throw new IllegalArgumentException("The Word document contains no readable text or is empty.");
        }

        int wordCount = fullText.split("\\s+").length;
        int characterCount = fullText.length();
        int estimatedPages = Math.max(1, (int) Math.ceil((double) wordCount / 350.0));

        // Group paragraphs into pages
        List<ExtractedDocument.PageContent> pages = new ArrayList<>();
        int parasPerPage = Math.max(1, (int) Math.ceil((double) paragraphs.size() / estimatedPages));

        for (int p = 0; p < estimatedPages; p++) {
            int startIdx = p * parasPerPage;
            if (startIdx >= paragraphs.size()) break;
            int endIdx = Math.min(paragraphs.size(), (p + 1) * parasPerPage);
            List<String> pageParas = paragraphs.subList(startIdx, endIdx);
            String pageText = String.join("\n\n", pageParas);

            List<String> pageHeadings = new ArrayList<>();
            for (String h : allHeadings) {
                if (pageText.contains(h)) {
                    pageHeadings.add(h);
                }
            }

            pages.add(new ExtractedDocument.PageContent(p + 1, pageText, pageHeadings));
        }

        return new ExtractedDocument(
                fileName,
                "docx",
                bytes.length,
                pages.size(),
                wordCount,
                characterCount,
                fullText,
                pages
        );
    }

    private String unescapeXml(String text) {
        if (text == null) return "";
        return text.replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'");
    }
}
