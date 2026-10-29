package com.texttutor.repository;

import com.texttutor.entity.Quiz;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByUserOrderByCreatedAtDesc(User user);
    Optional<Quiz> findByIdAndUser(Long id, User user);
    long countByUser(User user);
}
