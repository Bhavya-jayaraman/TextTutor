package com.texttutor.repository;

import com.texttutor.entity.Conversation;
import com.texttutor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Conversation> findByIdAndUser(Long id, User user);
    long countByUser(User user);
}
