package com.texttutor.controller;

import com.texttutor.dto.ApiResponse;
import com.texttutor.dto.DocumentUploadResponse;
import com.texttutor.dto.NoteDto;
import com.texttutor.dto.NoteRequest;
import com.texttutor.dto.NotesListResponse;
import com.texttutor.dto.SingleNoteResponse;
import com.texttutor.entity.User;
import com.texttutor.service.DocumentProcessingService;
import com.texttutor.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;
    private final DocumentProcessingService documentProcessingService;

    public NoteController(NoteService noteService, DocumentProcessingService documentProcessingService) {
        this.noteService = noteService;
        this.documentProcessingService = documentProcessingService;
    }

    @GetMapping
    public ResponseEntity<NotesListResponse> getNotes(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean isPinned,
            @RequestParam(required = false, defaultValue = "date_desc") String sort,
            @AuthenticationPrincipal User user) {
        List<NoteDto> notes = noteService.getUserNotes(user, q, category, tag, isPinned, sort);
        return ResponseEntity.ok(new NotesListResponse(true, notes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SingleNoteResponse> getNoteById(@PathVariable("id") Long id, @AuthenticationPrincipal User user) {
        NoteDto note = noteService.getNoteById(id, user);
        return ResponseEntity.ok(new SingleNoteResponse(true, note));
    }

    @PostMapping
    public ResponseEntity<SingleNoteResponse> createNote(@Valid @RequestBody NoteRequest request, @AuthenticationPrincipal User user) {
        NoteDto created = noteService.createNote(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SingleNoteResponse(true, "Note created successfully.", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SingleNoteResponse> updateNote(@PathVariable("id") Long id, @RequestBody NoteRequest request, @AuthenticationPrincipal User user) {
        NoteDto updated = noteService.updateNote(id, request, user);
        return ResponseEntity.ok(new SingleNoteResponse(true, "Note updated successfully.", updated));
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<SingleNoteResponse> togglePin(@PathVariable("id") Long id, @AuthenticationPrincipal User user) {
        NoteDto updated = noteService.togglePin(id, user);
        return ResponseEntity.ok(new SingleNoteResponse(true, "Note pin status updated.", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable("id") Long id, @AuthenticationPrincipal User user) {
        noteService.deleteNote(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Note deleted successfully."));
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "saveNote", required = false, defaultValue = "true") boolean saveNote,
            @AuthenticationPrincipal User user) throws IOException {

        DocumentProcessingService.DocumentResult result = documentProcessingService.processDocument(file);

        NoteDto createdNote = null;
        if (saveNote) {
            String noteTitle = (title != null && !title.isBlank()) ? title : result.fileName();
            createdNote = noteService.createFromDocument(noteTitle, result.text(), category, user);
        }

        DocumentUploadResponse response = new DocumentUploadResponse(
                true,
                "Document processed and study material extracted successfully.",
                result.fileName(),
                result.fileType(),
                result.fileSize(),
                result.wordCount(),
                result.characterCount(),
                result.text(),
                createdNote
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
