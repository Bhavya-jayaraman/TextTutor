package com.texttutor.repository;

import com.texttutor.entity.ChatMessage;
import com.texttutor.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation);
}
