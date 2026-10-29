package com.texttutor.service;

import com.texttutor.dto.NoteDto;
import com.texttutor.entity.Document;
import com.texttutor.entity.DocumentChunk;
import com.texttutor.entity.DocumentStatus;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.DocumentChunkRepository;
import com.texttutor.repository.DocumentRepository;
import com.texttutor.repository.NoteRepository;
import com.texttutor.service.document.DocxTextExtractor;
import com.texttutor.service.document.DocumentChunker;
import com.texttutor.service.document.ExtractedDocument;
import com.texttutor.service.document.PdfTextExtractor;
import com.texttutor.service.document.PlainTextExtractor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentProcessingService {

    private final PdfTextExtractor pdfTextExtractor;
    private final DocxTextExtractor docxTextExtractor;
    private final PlainTextExtractor plainTextExtractor;
    private final DocumentChunker documentChunker;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final NoteRepository noteRepository;

    @Value("${texttutor.upload.max-file-size-mb:50}")
    private long maxFileSizeMb;

    public record DocumentResult(
            String fileName,
            String fileType,
            long fileSize,
            int wordCount,
            int characterCount,
            String text
    ) {}

    public DocumentProcessingService(
            PdfTextExtractor pdfTextExtractor,
            DocxTextExtractor docxTextExtractor,
            PlainTextExtractor plainTextExtractor,
            DocumentChunker documentChunker,
            DocumentRepository documentRepository,
            DocumentChunkRepository documentChunkRepository,
            NoteRepository noteRepository) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.docxTextExtractor = docxTextExtractor;
        this.plainTextExtractor = plainTextExtractor;
        this.documentChunker = documentChunker;
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.noteRepository = noteRepository;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeMb * 1024 * 1024;
    }

    /**
     * Backward-compatible synchronous processing method.
     */
    public DocumentResult processDocument(MultipartFile file) throws IOException {
        validateFile(file);
        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        byte[] bytes = file.getBytes();

        ExtractedDocument extracted = extractDocument(originalFilename, bytes);
        return new DocumentResult(
                extracted.fileName(),
                extracted.fileType(),
                extracted.fileSize(),
                extracted.wordCount(),
                extracted.characterCount(),
                extracted.fullText()
        );
    }

    /**
     * Complete lifecycle method: validates, extracts, creates Document entity,
     * links Note, and indexes chunks for RAG.
     */
    @Transactional
    public Document processAndIndexDocument(MultipartFile file, String customTitle, String category, User user, Note note) throws IOException {
        validateFile(file);
        String fileName = sanitizeFilename(file.getOriginalFilename());
        String extension = getFileExtension(fileName).toLowerCase();

        // 1. Create Document record in PROCESSING state
        Document doc = new Document(user, fileName, extension, file.getSize());
        doc.setStatus(DocumentStatus.PROCESSING);
        if (note != null) {
            doc.setNote(note);
        }
        doc = documentRepository.save(doc);

        try {
            byte[] bytes = file.getBytes();
            ExtractedDocument extracted = extractDocument(fileName, bytes);

            doc.setPageCount(extracted.pageCount());
            doc.setWordCount(extracted.wordCount());
            doc.setCharacterCount(extracted.characterCount());
            doc.setStatus(DocumentStatus.READY);

            // 2. Generate and persist chunks for RAG
            List<DocumentChunker.ChunkResult> chunkResults = documentChunker.chunkDocument(extracted);
            for (DocumentChunker.ChunkResult cr : chunkResults) {
                DocumentChunk chunk = new DocumentChunk(
                        user,
                        doc,
                        note,
                        fileName,
                        cr.pageNumber(),
                        cr.sectionHeading(),
                        cr.chunkIndex(),
                        cr.content(),
                        cr.tokenKeywords()
                );
                documentChunkRepository.save(chunk);
            }

            return documentRepository.save(doc);

        } catch (Exception e) {
            doc.setStatus(DocumentStatus.FAILED);
            String error = e.getMessage() != null ? e.getMessage() : "Document extraction failed.";
            if (error.length() > 950) {
                error = error.substring(0, 950) + "...";
            }
            doc.setErrorMessage(error);
            documentRepository.save(doc);
            throw e;
        }
    }

    public ExtractedDocument extractDocument(String fileName, byte[] bytes) throws IOException {
        String ext = getFileExtension(fileName).toLowerCase();
        return switch (ext) {
            case "txt", "text", "md" -> plainTextExtractor.extract(fileName, bytes);
            case "docx" -> docxTextExtractor.extract(fileName, bytes);
            case "pdf" -> pdfTextExtractor.extract(fileName, bytes);
            default -> throw new IllegalArgumentException("Unsupported file format '." + ext +
                    "'. TextTutor currently supports .pdf, .docx, and .txt files.");
        };
    }

    public String extractText(String fileName, byte[] bytes) throws IOException {
        return extractDocument(fileName, bytes).fullText();
    }

    @Transactional(readOnly = true)
    public List<Document> getUserDocuments(User user) {
        return documentRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public Document getDocumentById(Long id, User user) {
        return documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document doc = documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        documentChunkRepository.deleteByDocument(doc);
        documentRepository.delete(doc);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new IllegalArgumentException("The uploaded file is empty. Please select a valid document.");
        }

        long maxBytes = getMaxFileSizeBytes();
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File size (" + (file.getSize() / (1024 * 1024)) +
                    " MB) exceeds the configured maximum limit of " + maxFileSizeMb + " MB.");
        }

        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Filename cannot be blank.");
        }

        String ext = getFileExtension(name).toLowerCase();
        if (!List.of("pdf", "docx", "txt", "md").contains(ext)) {
            throw new IllegalArgumentException("Unsupported file format '." + ext +
                    "'. TextTutor currently supports .pdf, .docx, and .txt files.");
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "study-document";
        // Strip path traversal characters
        String clean = filename.replace("\\", "/");
        int lastSlash = clean.lastIndexOf('/');
        if (lastSlash >= 0) {
            clean = clean.substring(lastSlash + 1);
        }
        return clean.replaceAll("[^a-zA-Z0-9._\\-\\s]", "_").trim();
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot + 1) : "";
    }
}
