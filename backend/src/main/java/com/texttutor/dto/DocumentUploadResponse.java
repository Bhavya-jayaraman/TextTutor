package com.texttutor.dto;

public class DocumentUploadResponse {

    private boolean success;
    private String message;
    private Long documentId;
    private String fileName;
    private String fileType;
    private long fileSize;
    private int pageCount = 1;
    private int wordCount;
    private int characterCount;
    private String status = "READY";
    private String extractedText;
    private NoteDto note;

    public DocumentUploadResponse() {}

    public DocumentUploadResponse(boolean success, String message, String fileName, String fileType,
                                  long fileSize, int wordCount, int characterCount, String extractedText, NoteDto note) {
        this.success = success;
        this.message = message;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.wordCount = wordCount;
        this.characterCount = characterCount;
        this.extractedText = extractedText;
        this.note = note;
    }

    public DocumentUploadResponse(boolean success, String message, Long documentId, String fileName, String fileType,
                                  long fileSize, int pageCount, int wordCount, int characterCount, String status,
                                  String extractedText, NoteDto note) {
        this.success = success;
        this.message = message;
        this.documentId = documentId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.pageCount = pageCount;
        this.wordCount = wordCount;
        this.characterCount = characterCount;
        this.status = status;
        this.extractedText = extractedText;
        this.note = note;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    public int getPageCount() { return pageCount; }
    public void setPageCount(int pageCount) { this.pageCount = pageCount; }

    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }

    public int getCharacterCount() { return characterCount; }
    public void setCharacterCount(int characterCount) { this.characterCount = characterCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public NoteDto getNote() { return note; }
    public void setNote(NoteDto note) { this.note = note; }
}
