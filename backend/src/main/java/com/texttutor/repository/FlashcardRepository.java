package com.texttutor.repository;

import com.texttutor.entity.Flashcard;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByUserOrderByCreatedAtDesc(User user);
    Optional<Flashcard> findByIdAndUser(Long id, User user);
    List<Flashcard> findByUserAndNoteIdOrderByCreatedAtDesc(User user, Long noteId);
    long countByUser(User user);
    long countByUserAndMasteredTrue(User user);
}
