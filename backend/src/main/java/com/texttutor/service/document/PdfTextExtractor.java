package com.texttutor.service.document;

import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.Inflater;

@Component
public class PdfTextExtractor {

    private static final byte[] PDF_HEADER = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] STREAM_START = "stream".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] STREAM_END = "endstream".getBytes(StandardCharsets.US_ASCII);

    private static final Pattern HEADING_PATTERN = Pattern.compile(
            "^(?:(?:Chapter|Section|Unit|Part|Module|Topic)\\s+\\d+|\\d+(?:\\.\\d+)*\\s+[A-Z]|(?:[A-Z0-9\\s]{4,60}:?))$",
            Pattern.MULTILINE
    );

    public ExtractedDocument extract(String fileName, byte[] bytes) {
        if (bytes == null || bytes.length < 5) {
            throw new IllegalArgumentException("The PDF file is empty or corrupted (file size is 0 bytes).");
        }

        // 1. Verify %PDF- header
        if (!hasPrefix(bytes, PDF_HEADER)) {
            // Also check for leading whitespace/BOM before %PDF-
            int headerIdx = indexOf(bytes, PDF_HEADER, 0, Math.min(bytes.length, 1024));
            if (headerIdx == -1) {
                throw new IllegalArgumentException("Invalid PDF format. The file is missing a valid '%PDF-' header.");
            }
        }

        // 2. Detect Password Protection / Encryption
        String latinContent = new String(bytes, StandardCharsets.ISO_8859_1);
        if (latinContent.contains("/Encrypt")) {
            throw new IllegalArgumentException("This PDF document is password-protected or encrypted. Please upload an unencrypted document.");
        }

        // 3. Estimate or scan total page count
        int pageCount = countPdfPages(latinContent);
        if (pageCount <= 0) {
            pageCount = 1;
        }

        // 4. Extract text from stream blocks
        List<ExtractedDocument.PageContent> pages = new ArrayList<>();
        List<String> pageTexts = extractPageTexts(bytes, pageCount);

        StringBuilder fullTextBuilder = new StringBuilder();
        int actualPageNum = 1;

        for (String pageText : pageTexts) {
            String trimmed = pageText.trim();
            if (!trimmed.isEmpty()) {
                List<String> headings = detectHeadings(trimmed);
                pages.add(new ExtractedDocument.PageContent(actualPageNum, trimmed, headings));
                if (fullTextBuilder.length() > 0) {
                    fullTextBuilder.append("\n\n--- Page ").append(actualPageNum).append(" ---\n\n");
                }
                fullTextBuilder.append(trimmed);
                actualPageNum++;
            }
        }

        String fullText = fullTextBuilder.toString().trim();

        // 5. Scanned PDF Detection: If PDF has pages but 0 or negligible extracted text (< 25 chars)
        if (fullText.length() < 25) {
            throw new IllegalArgumentException("This PDF appears to be a scanned image or photo document with no selectable digital text layer. TextTutor requires a document with digital text (or OCR-processed text) to analyze your notes.");
        }

        int wordCount = fullText.split("\\s+").length;
        int characterCount = fullText.length();
        int finalPageCount = Math.max(pageCount, pages.size());

        return new ExtractedDocument(
                fileName,
                "pdf",
                bytes.length,
                finalPageCount,
                wordCount,
                characterCount,
                fullText,
                pages
        );
    }

    private int countPdfPages(String content) {
        // Look for /Type /Page (excluding /Pages)
        Pattern pagePattern = Pattern.compile("/Type\\s*/Page\\b");
        Matcher matcher = pagePattern.matcher(content);
        int count = 0;
        while (matcher.find()) {
            count++;
        }

        if (count == 0) {
            // Check /Count inside /Pages catalog
            Pattern countPattern = Pattern.compile("/Type\\s*/Pages.*?/Count\\s+(\\d+)", Pattern.DOTALL);
            Matcher countMatcher = countPattern.matcher(content);
            if (countMatcher.find()) {
                try {
                    count = Integer.parseInt(countMatcher.group(1));
                } catch (NumberFormatException ignored) {}
            }
        }
        return count;
    }

    private List<String> extractPageTexts(byte[] bytes, int estimatedPages) {
        List<String> streamsText = new ArrayList<>();
        int index = 0;

        while (index < bytes.length) {
            int streamStart = indexOf(bytes, STREAM_START, index, bytes.length);
            if (streamStart == -1) break;

            // Check dictionary preceding stream for FlateDecode
            int dictStart = Math.max(0, streamStart - 400);
            String dictText = new String(bytes, dictStart, streamStart - dictStart, StandardCharsets.ISO_8859_1);
            boolean isFlate = dictText.contains("/FlateDecode") || dictText.contains("/Fl");

            int dataStart = streamStart + STREAM_START.length;
            if (dataStart < bytes.length && bytes[dataStart] == '\r') dataStart++;
            if (dataStart < bytes.length && bytes[dataStart] == '\n') dataStart++;

            int streamEnd = indexOf(bytes, STREAM_END, dataStart, bytes.length);
            if (streamEnd == -1) break;

            int dataEnd = streamEnd;
            if (dataEnd > dataStart && bytes[dataEnd - 1] == '\n') dataEnd--;
            if (dataEnd > dataStart && bytes[dataEnd - 1] == '\r') dataEnd--;

            byte[] streamData = Arrays.copyOfRange(bytes, dataStart, dataEnd);
            byte[] decoded = isFlate ? inflate(streamData) : streamData;

            if (decoded != null && decoded.length > 0) {
                String extracted = parsePdfTextStream(decoded);
                if (extracted != null && !extracted.isBlank()) {
                    streamsText.add(extracted.trim());
                }
            }

            index = streamEnd + STREAM_END.length;
        }

        // If streamsText corresponds to pages or chunks, group or distribute them
        if (streamsText.isEmpty()) {
            return Collections.emptyList();
        }

        // Group into estimated pages or return directly
        return streamsText;
    }

    private String parsePdfTextStream(byte[] raw) {
        String content = new String(raw, StandardCharsets.ISO_8859_1);
        StringBuilder sb = new StringBuilder();

        // Match BT ... ET blocks
        Pattern btPattern = Pattern.compile("BT\\s+(.*?)\\s+ET", Pattern.DOTALL);
        Matcher btMatcher = btPattern.matcher(content);

        while (btMatcher.find()) {
            String block = btMatcher.group(1);
            parseTextOperators(block, sb);
            sb.append("\n");
        }

        // If no BT...ET blocks found, check for standalone Tj or TJ
        if (sb.length() == 0) {
            parseTextOperators(content, sb);
        }

        return cleanExtractedText(sb.toString());
    }

    private void parseTextOperators(String block, StringBuilder sb) {
        // Matches literal strings ( ... ) Tj, hex strings < ... > Tj, or arrays [ ... ] TJ
        Pattern opPattern = Pattern.compile("(\\((?:[^()\\\\]|\\\\.)*\\)|<[0-9a-fA-F\\s]+>|\\[.*?\\])\\s*(Tj|TJ|'|\")", Pattern.DOTALL);
        Matcher m = opPattern.matcher(block);

        while (m.find()) {
            String operand = m.group(1);
            String operator = m.group(2);

            if ("Tj".equals(operator) || "'".equals(operator) || "\"".equals(operator)) {
                if (operand.startsWith("(") && operand.endsWith(")")) {
                    sb.append(unescapePdfString(operand.substring(1, operand.length() - 1))).append(" ");
                } else if (operand.startsWith("<") && operand.endsWith(">")) {
                    sb.append(decodeHexString(operand.substring(1, operand.length() - 1))).append(" ");
                }
            } else if ("TJ".equals(operator)) {
                // Array of strings and kerning offsets
                Pattern arrayItem = Pattern.compile("(\\((?:[^()\\\\]|\\\\.)*\\)|<[0-9a-fA-F\\s]+>)");
                Matcher arrMatcher = arrayItem.matcher(operand);
                while (arrMatcher.find()) {
                    String item = arrMatcher.group(1);
                    if (item.startsWith("(") && item.endsWith(")")) {
                        sb.append(unescapePdfString(item.substring(1, item.length() - 1)));
                    } else if (item.startsWith("<") && item.endsWith(">")) {
                        sb.append(decodeHexString(item.substring(1, item.length() - 1)));
                    }
                }
                sb.append(" ");
            }
        }
    }

    private String unescapePdfString(String s) {
        StringBuilder sb = new StringBuilder();
        int len = s.length();
        for (int i = 0; i < len; i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < len) {
                char next = s.charAt(i + 1);
                switch (next) {
                    case 'n' -> { sb.append('\n'); i++; }
                    case 'r' -> { sb.append('\r'); i++; }
                    case 't' -> { sb.append('\t'); i++; }
                    case 'b' -> { sb.append('\b'); i++; }
                    case 'f' -> { sb.append('\f'); i++; }
                    case '(', ')', '\\' -> { sb.append(next); i++; }
                    default -> {
                        // Octal digits e.g. \123
                        if (Character.isDigit(next)) {
                            int octal = 0;
                            int count = 0;
                            while (i + 1 < len && Character.isDigit(s.charAt(i + 1)) && count < 3) {
                                octal = octal * 8 + (s.charAt(i + 1) - '0');
                                i++;
                                count++;
                            }
                            sb.append((char) octal);
                        } else {
                            sb.append(next);
                            i++;
                        }
                    }
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String decodeHexString(String hex) {
        String clean = hex.replaceAll("\\s+", "");
        if (clean.length() % 2 != 0) {
            clean += "0";
        }
        byte[] bytes = new byte[clean.length() / 2];
        for (int i = 0; i < clean.length(); i += 2) {
            try {
                bytes[i / 2] = (byte) Integer.parseInt(clean.substring(i, i + 2), 16);
            } catch (Exception e) {
                return "";
            }
        }
        return new String(bytes, StandardCharsets.ISO_8859_1);
    }

    private byte[] inflate(byte[] data) {
        try {
            Inflater inflater = new Inflater();
            inflater.setInput(data);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length * 2);
            byte[] buffer = new byte[4096];
            while (!inflater.finished()) {
                int count = inflater.inflate(buffer);
                if (count == 0 && inflater.needsInput()) break;
                outputStream.write(buffer, 0, count);
            }
            inflater.end();
            return outputStream.toByteArray();
        } catch (Exception e) {
            return data; // Return original if already uncompressed or invalid
        }
    }

    private List<String> detectHeadings(String text) {
        List<String> headings = new ArrayList<>();
        Matcher m = HEADING_PATTERN.matcher(text);
        while (m.find()) {
            String heading = m.group().trim();
            if (heading.length() > 3 && heading.length() < 70) {
                headings.add(heading);
            }
        }
        return headings;
    }

    private String cleanExtractedText(String text) {
        if (text == null) return "";
        return text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                .replaceAll("[ \t]+", " ")
                .replaceAll("(\r\n|\r|\n){3,}", "\n\n")
                .trim();
    }

    private boolean hasPrefix(byte[] array, byte[] prefix) {
        if (array.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (array[i] != prefix[i]) return false;
        }
        return true;
    }

    private int indexOf(byte[] array, byte[] target, int start, int end) {
        if (target.length == 0) return start;
        int max = Math.min(array.length - target.length, end - target.length);
        for (int i = start; i <= max; i++) {
            boolean match = true;
            for (int j = 0; j < target.length; j++) {
                if (array[i + j] != target[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }
}
