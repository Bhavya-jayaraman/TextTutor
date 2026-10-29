package com.texttutor.repository;

import com.texttutor.entity.Document;
import com.texttutor.entity.DocumentStatus;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserOrderByCreatedAtDesc(User user);
    List<Document> findByUserAndStatus(User user, DocumentStatus status);
    Optional<Document> findByIdAndUser(Long id, User user);
    long countByUser(User user);
}
