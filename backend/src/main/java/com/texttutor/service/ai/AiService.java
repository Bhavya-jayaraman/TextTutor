package com.texttutor.service.ai;

import com.texttutor.service.rag.RetrievedChunk;

import java.util.Collections;
import java.util.List;

public interface AiService {

    AiSummaryResult summarizeNote(String title, String content, String category);

    String explainKeyword(String keyword, String contextTitle);

    List<GeneratedFlashcard> generateFlashcards(String title, String content, String category, int count);

    List<GeneratedQuestion> generateQuiz(String title, String content, String category, int count);

    ChatResult answerStudyQuestion(String question, List<StudyNoteContext> userNotes, List<ChatMessageContext> history);

    String generateStructuredNotes(String title, String extractedText, String category);

    GeminiStatusResult verifyGeminiConnection();

    default ChatResult answerStudyQuestionWithChunks(
            String question,
            List<StudyNoteContext> userNotes,
            List<RetrievedChunk> retrievedChunks,
            List<ChatMessageContext> history) {
        return answerStudyQuestion(question, userNotes, history);
    }

    record GeminiStatusResult(
            boolean configured,
            boolean connected,
            String model,
            String statusMessage
    ) {}

    record AiSummaryResult(
            String shortSummary,
            String detailedSummary,
            List<String> bulletPoints,
            List<String> keywords
    ) {}

    record GeneratedFlashcard(
            String question,
            String answer,
            String difficulty,
            String sourceReference
    ) {
        public GeneratedFlashcard(String question, String answer, String difficulty) {
            this(question, answer, difficulty, "");
        }
    }

    record GeneratedQuestion(
            String question,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer,
            String explanation,
            String sourceReference
    ) {
        public GeneratedQuestion(String question, String optionA, String optionB, String optionC, String optionD, String correctAnswer, String explanation) {
            this(question, optionA, optionB, optionC, optionD, correctAnswer, explanation, "");
        }
    }

    record StudyNoteContext(
            Long id,
            String title,
            String category,
            String content,
            List<String> tags
    ) {}

    record ChatMessageContext(
            String role,
            String content
    ) {}

    record SourceCitation(
            Long noteId,
            Long documentId,
            String title,
            String category,
            int pageNumber,
            String sectionHeading,
            String excerpt
    ) {}

    record ChatResult(
            String answer,
            List<StudyNoteContext> citedSources,
            List<SourceCitation> richCitations
    ) {
        public ChatResult(String answer, List<StudyNoteContext> citedSources) {
            this(answer, citedSources, Collections.emptyList());
        }
    }
}
