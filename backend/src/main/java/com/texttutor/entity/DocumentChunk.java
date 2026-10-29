package com.texttutor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "document_chunks", indexes = {
        @Index(name = "idx_chunk_doc_id", columnList = "document_id"),
        @Index(name = "idx_chunk_note_id", columnList = "note_id"),
        @Index(name = "idx_chunk_user_id", columnList = "user_id")
})
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "page_number")
    private Integer pageNumber = 1;

    @Column(name = "section_heading", length = 255)
    private String sectionHeading;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex = 0;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "token_keywords", columnDefinition = "TEXT")
    private String tokenKeywords;

    public DocumentChunk() {}

    public DocumentChunk(User user, Document document, Note note, String fileName,
                         Integer pageNumber, String sectionHeading, Integer chunkIndex,
                         String content, String tokenKeywords) {
        this.user = user;
        this.document = document;
        this.note = note;
        this.fileName = fileName;
        this.pageNumber = pageNumber != null ? pageNumber : 1;
        this.sectionHeading = sectionHeading;
        this.chunkIndex = chunkIndex != null ? chunkIndex : 0;
        this.content = content;
        this.tokenKeywords = tokenKeywords;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public String getSectionHeading() { return sectionHeading; }
    public void setSectionHeading(String sectionHeading) { this.sectionHeading = sectionHeading; }

    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTokenKeywords() { return tokenKeywords; }
    public void setTokenKeywords(String tokenKeywords) { this.tokenKeywords = tokenKeywords; }
}
