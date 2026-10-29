package com.texttutor.repository;

import com.texttutor.entity.ActivityLog;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserOrderByCreatedAtDesc(User user);
    List<ActivityLog> findTop20ByUserOrderByCreatedAtDesc(User user);
}
