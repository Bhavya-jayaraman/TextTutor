package com.texttutor.dto;

import com.texttutor.entity.Document;
import com.texttutor.entity.DocumentStatus;

import java.time.LocalDateTime;

public record DocumentDto(
        Long id,
        String fileName,
        String fileType,
        Long fileSize,
        Integer pageCount,
        Integer wordCount,
        Integer characterCount,
        DocumentStatus status,
        String errorMessage,
        Long noteId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DocumentDto fromEntity(Document doc) {
        if (doc == null) return null;
        Long noteId = doc.getNote() != null ? doc.getNote().getId() : null;
        return new DocumentDto(
                doc.getId(),
                doc.getFileName(),
                doc.getFileType(),
                doc.getFileSize(),
                doc.getPageCount(),
                doc.getWordCount(),
                doc.getCharacterCount(),
                doc.getStatus(),
                doc.getErrorMessage(),
                noteId,
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
