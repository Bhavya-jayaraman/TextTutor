package com.texttutor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 50)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "page_count")
    private Integer pageCount = 1;

    @Column(name = "word_count")
    private Integer wordCount = 0;

    @Column(name = "character_count")
    private Integer characterCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status = DocumentStatus.UPLOADING;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Document() {}

    public Document(User user, String fileName, String fileType, Long fileSize) {
        this.user = user;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.status = DocumentStatus.UPLOADING;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public Integer getPageCount() { return pageCount; }
    public void setPageCount(Integer pageCount) { this.pageCount = pageCount; }

    public Integer getWordCount() { return wordCount; }
    public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }

    public Integer getCharacterCount() { return characterCount; }
    public void setCharacterCount(Integer characterCount) { this.characterCount = characterCount; }

    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
