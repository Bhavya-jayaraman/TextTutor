package com.texttutor.service.document;

import java.util.List;

public record ExtractedDocument(
        String fileName,
        String fileType,
        long fileSize,
        int pageCount,
        int wordCount,
        int characterCount,
        String fullText,
        List<PageContent> pages
) {
    public record PageContent(
            int pageNumber,
            String text,
            List<String> sectionHeadings
    ) {}
}
