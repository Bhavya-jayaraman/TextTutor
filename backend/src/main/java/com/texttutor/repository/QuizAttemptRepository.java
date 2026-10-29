package com.texttutor.repository;

import com.texttutor.entity.QuizAttempt;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserOrderByCompletedAtDesc(User user);
    long countByUser(User user);
}
