package com.texttutor.repository;

import com.texttutor.entity.StudyPlan;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    List<StudyPlan> findByUserOrderByCreatedAtDesc(User user);
    Optional<StudyPlan> findByIdAndUser(Long id, User user);
    long countByUser(User user);
}
