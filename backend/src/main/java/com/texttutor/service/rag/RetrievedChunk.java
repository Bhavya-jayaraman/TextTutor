package com.texttutor.service.rag;

public record RetrievedChunk(
        Long chunkId,
        Long documentId,
        Long noteId,
        String fileName,
        int pageNumber,
        String sectionHeading,
        String content,
        String excerpt,
        double relevanceScore
) {}
