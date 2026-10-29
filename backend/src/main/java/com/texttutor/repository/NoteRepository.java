package com.texttutor.repository;

import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserOrderByCreatedAtDesc(User user);
    Optional<Note> findByIdAndUser(Long id, User user);
    List<Note> findByUserAndCategoryIgnoreCase(User user, String category);
    long countByUser(User user);
}
