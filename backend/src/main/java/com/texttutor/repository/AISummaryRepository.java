package com.texttutor.repository;

import com.texttutor.entity.AISummary;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AISummaryRepository extends JpaRepository<AISummary, Long> {
    List<AISummary> findByUserAndNoteIdOrderByCreatedAtDesc(User user, Long noteId);
    List<AISummary> findByUserOrderByCreatedAtDesc(User user);
    Optional<AISummary> findTopByUserAndNoteIdOrderByCreatedAtDesc(User user, Long noteId);
    long countByUser(User user);
}
