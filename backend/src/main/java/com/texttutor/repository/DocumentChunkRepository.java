package com.texttutor.repository;

import com.texttutor.entity.Document;
import com.texttutor.entity.DocumentChunk;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByUser(User user);

    List<DocumentChunk> findByUserAndNote(User user, Note note);

    List<DocumentChunk> findByUserAndDocument(User user, Document document);

    @Query("SELECT c FROM DocumentChunk c WHERE c.user = :user AND c.note.id IN :noteIds")
    List<DocumentChunk> findByUserAndNoteIds(@Param("user") User user, @Param("noteIds") List<Long> noteIds);

    @Modifying
    @Query("DELETE FROM DocumentChunk c WHERE c.note = :note")
    void deleteByNote(@Param("note") Note note);

    @Modifying
    @Query("DELETE FROM DocumentChunk c WHERE c.document = :document")
    void deleteByDocument(@Param("document") Document document);
}
