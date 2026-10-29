package com.texttutor.controller;

import com.texttutor.dto.DocumentDto;
import com.texttutor.dto.DocumentUploadResponse;
import com.texttutor.dto.NoteDto;
import com.texttutor.entity.Document;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import com.texttutor.repository.NoteRepository;
import com.texttutor.service.DocumentProcessingService;
import com.texttutor.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentProcessingService documentProcessingService;
    private final NoteService noteService;
    private final NoteRepository noteRepository;

    public DocumentController(
            DocumentProcessingService documentProcessingService,
            NoteService noteService,
            NoteRepository noteRepository) {
        this.documentProcessingService = documentProcessingService;
        this.noteService = noteService;
        this.noteRepository = noteRepository;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<DocumentUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "saveNote", required = false, defaultValue = "true") boolean saveNote,
            @AuthenticationPrincipal User user) throws IOException {

        // 1. Extract text and pages
        DocumentProcessingService.DocumentResult extractResult = documentProcessingService.processDocument(file);

        // 2. Create Note if requested
        NoteDto createdNoteDto = null;
        Note createdNoteEntity = null;
        if (saveNote) {
            String noteTitle = (title != null && !title.isBlank()) ? title : extractResult.fileName();
            createdNoteDto = noteService.createFromDocument(noteTitle, extractResult.text(), category, user);
            if (createdNoteDto != null) {
                createdNoteEntity = noteRepository.findById(createdNoteDto.getId()).orElse(null);
            }
        }

        // 3. Process, persist Document, and index Chunks for RAG
        Document doc = documentProcessingService.processAndIndexDocument(
                file, title, category, user, createdNoteEntity
        );

        DocumentUploadResponse response = new DocumentUploadResponse(
                true,
                "Document parsed, structured, and indexed for AI study.",
                doc.getId(),
                doc.getFileName(),
                doc.getFileType(),
                doc.getFileSize(),
                doc.getPageCount() != null ? doc.getPageCount() : 1,
                doc.getWordCount() != null ? doc.getWordCount() : extractResult.wordCount(),
                doc.getCharacterCount() != null ? doc.getCharacterCount() : extractResult.characterCount(),
                doc.getStatus().name(),
                extractResult.text(),
                createdNoteDto
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentDto>> getDocuments(@AuthenticationPrincipal User user) {
        List<Document> documents = documentProcessingService.getUserDocuments(user);
        List<DocumentDto> dtos = documents.stream()
                .map(DocumentDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDto> getDocumentById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        Document doc = documentProcessingService.getDocumentById(id, user);
        return ResponseEntity.ok(DocumentDto.fromEntity(doc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        documentProcessingService.deleteDocument(id, user);
        return ResponseEntity.noContent().build();
    }
}
