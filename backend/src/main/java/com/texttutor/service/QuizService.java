package com.texttutor.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.texttutor.dto.*;
import com.texttutor.entity.*;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.*;
import com.texttutor.service.ai.AiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final NoteRepository noteRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public QuizService(QuizRepository quizRepository,
                       QuizAttemptRepository quizAttemptRepository,
                       NoteRepository noteRepository,
                       ActivityLogRepository activityLogRepository,
                       AiService aiService,
                       ObjectMapper objectMapper) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.noteRepository = noteRepository;
        this.activityLogRepository = activityLogRepository;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<QuizDto> getUserQuizzes(User user, String category) {
        List<Quiz> quizzes = quizRepository.findByUserOrderByCreatedAtDesc(user);
        return quizzes.stream()
                .filter(q -> {
                    if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                        return q.getCategory() != null && q.getCategory().equalsIgnoreCase(category.trim());
                    }
                    return true;
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDto getQuizById(Long id, User user) {
        Quiz quiz = quizRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied."));
        return toDto(quiz);
    }

    @Transactional(readOnly = true)
    public QuizStatsDto getStats(User user) {
        long totalQuizzes = quizRepository.countByUser(user);
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserOrderByCompletedAtDesc(user);
        long totalAttempts = attempts.size();

        int averageScore = 0;
        int bestScore = 0;
        if (!attempts.isEmpty()) {
            double avg = attempts.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0.0);
            averageScore = (int) Math.round(avg);
            bestScore = attempts.stream().mapToInt(QuizAttempt::getPercentage).max().orElse(0);
        }

        return new QuizStatsDto(totalQuizzes, totalAttempts, averageScore, bestScore);
    }

    @Transactional(readOnly = true)
    public List<QuizAttemptDto> getHistory(User user) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserOrderByCompletedAtDesc(user);
        return attempts.stream().map(this::toAttemptDto).collect(Collectors.toList());
    }

    @Transactional
    public QuizDto generateQuiz(GenerateStudyMaterialRequest req, User user) {
        String title = req.getTitle();
        String content = req.getContent();
        String category = req.getCategory();
        Long noteId = req.getNoteId();

        if (noteId != null) {
            Optional<Note> noteOpt = noteRepository.findByIdAndUser(noteId, user);
            if (noteOpt.isPresent()) {
                Note note = noteOpt.get();
                if (title == null || title.isBlank()) title = note.getTitle();
                if (content == null || content.isBlank()) content = note.getContent();
                if (category == null || category.isBlank()) category = note.getCategory();
            }
        }

        if ((content == null || content.isBlank()) && (title == null || title.isBlank())) {
            throw new IllegalArgumentException("Study material title or content is required to generate a quiz.");
        }

        int count = req.getCount() != null ? req.getCount() : 3;
        List<AiService.GeneratedQuestion> generated = aiService.generateQuiz(title, content, category, count);

        Quiz quiz = new Quiz(user, noteId, (title != null ? title : "Practice Quiz") + " Quiz", category);

        for (AiService.GeneratedQuestion g : generated) {
            QuizQuestion qq = new QuizQuestion(
                    g.question(),
                    g.optionA(),
                    g.optionB(),
                    g.optionC(),
                    g.optionD(),
                    g.correctAnswer(),
                    g.explanation()
            );
            qq.setSourceReference(g.sourceReference());
            quiz.addQuestion(qq);
        }

        Quiz saved = quizRepository.save(quiz);
        activityLogRepository.save(new ActivityLog(user, "quiz_generated", "Generated practice quiz with " + saved.getQuestions().size() + " questions for \"" + title + "\""));
        return toDto(saved);
    }

    @Transactional
    public QuizAttemptDto submitQuiz(Long quizId, QuizSubmitRequest submission, User user) {
        Quiz quiz = quizRepository.findByIdAndUser(quizId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied."));

        Map<String, String> userAnswers = (submission != null && submission.getAnswers() != null)
                ? submission.getAnswers()
                : Collections.emptyMap();

        List<QuizQuestion> questions = quiz.getQuestions();
        if (questions == null || questions.isEmpty()) {
            throw new IllegalArgumentException("This quiz has no questions to evaluate.");
        }

        int correctCount = 0;
        List<QuizAttemptDto.QuestionResultDetail> details = new ArrayList<>();

        for (QuizQuestion q : questions) {
            String qIdStr = String.valueOf(q.getId());
            String selected = userAnswers.get(qIdStr);
            if (selected == null) {
                // Also check index-based key if frontend used 0-based index
                int idx = questions.indexOf(q);
                selected = userAnswers.get(String.valueOf(idx));
            }
            if (selected != null) {
                selected = selected.trim().toUpperCase();
            } else {
                selected = "UNANSWERED";
            }

            String correct = q.getCorrectAnswer() != null ? q.getCorrectAnswer().trim().toUpperCase() : "A";
            boolean isCorrect = selected.equalsIgnoreCase(correct);
            if (isCorrect) {
                correctCount++;
            }

            details.add(new QuizAttemptDto.QuestionResultDetail(
                    q.getId(),
                    q.getQuestion(),
                    selected,
                    correct,
                    isCorrect,
                    q.getExplanation()
            ));
        }

        int total = questions.size();
        int percentage = (int) Math.round(((double) correctCount / total) * 100);

        String feedback;
        if (percentage == 100) {
            feedback = "Outstanding! Perfect score — full mastery demonstrated!";
        } else if (percentage >= 80) {
            feedback = "Excellent! You have a solid grasp of this study topic.";
        } else if (percentage >= 60) {
            feedback = "Good effort! Review the explanations for questions you missed.";
        } else {
            feedback = "Keep studying! Active recall practice with flashcards will help solidify these facts.";
        }

        String answersJson = "";
        try {
            answersJson = objectMapper.writeValueAsString(userAnswers);
        } catch (Exception e) {
            answersJson = "{}";
        }

        QuizAttempt attempt = new QuizAttempt(user, quiz, correctCount, total, percentage, answersJson);
        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        activityLogRepository.save(new ActivityLog(user, "quiz_completed", "Scored " + percentage + "% (" + correctCount + "/" + total + ") on \"" + quiz.getTitle() + "\""));

        QuizAttemptDto dto = toAttemptDto(savedAttempt);
        dto.setFeedback(feedback);
        dto.setDetails(details);
        return dto;
    }

    @Transactional
    public void deleteQuiz(Long id, User user) {
        Quiz quiz = quizRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied."));
        quizRepository.delete(quiz);
    }

    public QuizDto toDto(Quiz quiz) {
        QuizDto dto = new QuizDto();
        dto.setId(quiz.getId());
        dto.setUser_id(quiz.getUser().getId());
        dto.setNote_id(quiz.getNoteId());
        dto.setTitle(quiz.getTitle());
        dto.setCategory(quiz.getCategory());
        dto.setCreated_at(quiz.getCreatedAt());

        if (quiz.getQuestions() != null) {
            List<QuizQuestionDto> qDtos = quiz.getQuestions().stream()
                    .map(q -> new QuizQuestionDto(
                            q.getId(),
                            q.getQuestion(),
                            q.getOptionA(),
                            q.getOptionB(),
                            q.getOptionC(),
                            q.getOptionD(),
                            q.getCorrectAnswer(),
                            q.getExplanation(),
                            q.getSourceReference()
                    ))
                    .collect(Collectors.toList());
            dto.setQuestions(qDtos);
        } else {
            dto.setQuestions(Collections.emptyList());
        }

        return dto;
    }

    public QuizAttemptDto toAttemptDto(QuizAttempt attempt) {
        QuizAttemptDto dto = new QuizAttemptDto();
        dto.setId(attempt.getId());
        dto.setQuiz_id(attempt.getQuiz().getId());
        dto.setQuiz_title(attempt.getQuiz().getTitle());
        dto.setScore(attempt.getScore());
        dto.setTotal_questions(attempt.getTotalQuestions());
        dto.setPercentage(attempt.getPercentage());
        dto.setCompleted_at(attempt.getCompletedAt());
        return dto;
    }
}
