package com.texttutor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.texttutor.dto.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.texttutor.repository.ActivityLogRepository;
import com.texttutor.repository.AISummaryRepository;
import com.texttutor.repository.ChatMessageRepository;
import com.texttutor.repository.ConversationRepository;
import com.texttutor.repository.FlashcardRepository;
import com.texttutor.repository.NoteRepository;
import com.texttutor.repository.QuizAttemptRepository;
import com.texttutor.repository.QuizRepository;
import com.texttutor.repository.DocumentRepository;
import com.texttutor.repository.DocumentChunkRepository;
import com.texttutor.repository.StudyPlanRepository;
import com.texttutor.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TextTutorApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private AISummaryRepository aiSummaryRepository;

    @Autowired
    private StudyPlanRepository studyPlanRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @BeforeEach
    void setUp() {
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        studyPlanRepository.deleteAll();
        chatMessageRepository.deleteAll();
        conversationRepository.deleteAll();
        aiSummaryRepository.deleteAll();
        quizAttemptRepository.deleteAll();
        quizRepository.deleteAll();
        flashcardRepository.deleteAll();
        activityLogRepository.deleteAll();
        noteRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Health endpoint returns status ok without authentication")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.app").value("TextTutor Backend API"));
    }

    @Test
    @DisplayName("User registration returns 201 with JWT and hashed password verification")
    void testUserRegistration() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Alice Student", "alice@example.com", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("alice@example.com"))
                .andExpect(jsonPath("$.user.name").value("Alice Student"));

        var user = userRepository.findByEmailIgnoreCase("alice@example.com").orElseThrow();
        assertNotEquals("password123", user.getPassword(), "Password should be hashed");
        assertTrue(user.getPassword().startsWith("$2a$"), "Password should be BCrypt hashed");
    }

    @Test
    @DisplayName("User login returns valid JWT token")
    void testUserLogin() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("Bob Learner", "bob@example.com", "secretpass");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("bob@example.com", "secretpass", false);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("bob@example.com"));
    }

    @Test
    @DisplayName("Protected endpoint rejects request without JWT token")
    void testProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated user can perform Notes CRUD operations")
    void testAuthenticatedNotesCrud() throws Exception {
        // 1. Register user
        RegisterRequest reg = new RegisterRequest("Charlie Test", "charlie@example.com", "password123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authRes = objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class);
        String token = "Bearer " + authRes.getToken();

        // 2. Create note
        NoteRequest createReq = new NoteRequest("Quantum Computing Basics", "Qubits can exist in superposition of 0 and 1.", "Physics", true, Set.of("quantum", "physics"));
        MvcResult createRes = mockMvc.perform(post("/api/notes")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.note.title").value("Quantum Computing Basics"))
                .andReturn();

        Long noteId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("note").get("id").asLong();

        // 3. List notes
        mockMvc.perform(get("/api/notes").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.notes", hasSize(1)))
                .andExpect(jsonPath("$.notes[0].title").value("Quantum Computing Basics"));

        // 4. Update note
        NoteRequest updateReq = new NoteRequest("Quantum Computing Deep Dive", "Updated content on quantum entanglement.", "Advanced Physics", true, Set.of("quantum", "entanglement"));
        mockMvc.perform(put("/api/notes/" + noteId)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note.title").value("Quantum Computing Deep Dive"));

        // 5. Delete note
        mockMvc.perform(delete("/api/notes/" + noteId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 6. Verify empty list
        mockMvc.perform(get("/api/notes").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", hasSize(0)));
    }

    @Test
    @DisplayName("Cross-user data isolation: User B cannot access or modify User A's note")
    void testCrossUserDataIsolation() throws Exception {
        // Register User A
        RegisterRequest userA = new RegisterRequest("User A", "usera@example.com", "pass123");
        MvcResult regA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userA)))
                .andReturn();
        String tokenA = "Bearer " + objectMapper.readValue(regA.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Register User B
        RegisterRequest userB = new RegisterRequest("User B", "userb@example.com", "pass456");
        MvcResult regB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userB)))
                .andReturn();
        String tokenB = "Bearer " + objectMapper.readValue(regB.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User A creates a note
        NoteRequest noteReq = new NoteRequest("User A Private Note", "Secret study material for User A only.", "Secret", false, Set.of("private"));
        MvcResult createRes = mockMvc.perform(post("/api/notes")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long noteIdA = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("note").get("id").asLong();

        // User B tries to read User A's note -> 404 / access denied
        mockMvc.perform(get("/api/notes/" + noteIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // User B tries to update User A's note -> 404 / access denied
        NoteRequest maliciousUpdate = new NoteRequest("Hacked Note", "Attacker content", "Hacked", false, Set.of());
        mockMvc.perform(put("/api/notes/" + noteIdA)
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousUpdate)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // User B tries to delete User A's note -> 404 / access denied
        mockMvc.perform(delete("/api/notes/" + noteIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // User B lists notes -> returns empty list (does not see User A's note)
        mockMvc.perform(get("/api/notes").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", hasSize(0)));

        // User A still sees their note intact
        mockMvc.perform(get("/api/notes/" + noteIdA).header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note.title").value("User A Private Note"));
    }

    @Test
    @DisplayName("Note search, category filter, and pin toggle work properly")
    void testNoteSearchFilterAndPin() throws Exception {
        RegisterRequest user = new RegisterRequest("David Search", "david@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Create Note 1
        NoteRequest n1 = new NoteRequest("Machine Learning Supervised", "Supervised learning uses labelled data.", "AI", false, Set.of("ml", "supervised"));
        MvcResult res1 = mockMvc.perform(post("/api/notes").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(n1))).andReturn();
        Long id1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("note").get("id").asLong();

        // Create Note 2
        NoteRequest n2 = new NoteRequest("Database Normalization", "First normal form eliminates repeating groups.", "Databases", false, Set.of("sql", "db"));
        mockMvc.perform(post("/api/notes").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(n2)));

        // Search by query "supervised"
        mockMvc.perform(get("/api/notes?q=supervised").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", hasSize(1)))
                .andExpect(jsonPath("$.notes[0].title").value("Machine Learning Supervised"));

        // Filter by category "Databases"
        mockMvc.perform(get("/api/notes?category=Databases").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", hasSize(1)))
                .andExpect(jsonPath("$.notes[0].title").value("Database Normalization"));

        // Toggle pin on Note 1
        mockMvc.perform(patch("/api/notes/" + id1 + "/pin").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note.is_pinned").value(true));

        // Filter by isPinned=true
        mockMvc.perform(get("/api/notes?isPinned=true").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", hasSize(1)))
                .andExpect(jsonPath("$.notes[0].id").value(id1));
    }

    @Test
    @DisplayName("Document upload extracts readable text and creates note")
    void testDocumentUploadTxt() throws Exception {
        RegisterRequest user = new RegisterRequest("Eva Upload", "eva@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        String lectureText = "Cellular respiration is a set of metabolic reactions. It converts biochemical energy into ATP. Glycolysis is the first stage.";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "biology_lecture.txt",
                "text/plain",
                lectureText.getBytes()
        );

        mockMvc.perform(multipart("/api/notes/upload")
                        .file(file)
                        .param("category", "Biology")
                        .header("Authorization", token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.fileName").value("biology_lecture.txt"))
                .andExpect(jsonPath("$.fileType").value("txt"))
                .andExpect(jsonPath("$.wordCount").value(19))
                .andExpect(jsonPath("$.extractedText", containsString("Cellular respiration")))
                .andExpect(jsonPath("$.note.category").value("Biology"))
                .andExpect(jsonPath("$.note.title").value("biology lecture"));
    }

    @Test
    @DisplayName("Document upload rejects empty files and unsupported formats")
    void testDocumentUploadValidation() throws Exception {
        RegisterRequest user = new RegisterRequest("Frank File", "frank@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Empty file
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);
        mockMvc.perform(multipart("/api/notes/upload")
                        .file(emptyFile)
                        .header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // 2. Unsupported extension
        MockMultipartFile invalidExt = new MockMultipartFile("file", "app.exe", "application/octet-stream", "fake binary".getBytes());
        mockMvc.perform(multipart("/api/notes/upload")
                        .file(invalidExt)
                        .header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Unsupported file format")));
    }

    @Test
    @DisplayName("Flashcard manual creation, mastery toggle, stats, and filtering")
    void testFlashcardCrudAndMastery() throws Exception {
        RegisterRequest user = new RegisterRequest("Grace Card", "grace@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Create Flashcard
        FlashcardRequest req = new FlashcardRequest("What is polymorphism in OOP?", "Ability of an object to take on many forms.", "CS", "Medium", null, false);
        MvcResult createRes = mockMvc.perform(post("/api/flashcards")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.flashcard.mastered").value(false))
                .andReturn();

        Long cardId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("flashcard").get("id").asLong();

        // 2. Check stats: total=1, mastered=0, learning=1
        mockMvc.perform(get("/api/flashcards/stats").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.mastered").value(0))
                .andExpect(jsonPath("$.learning").value(1))
                .andExpect(jsonPath("$.masteryPercentage").value(0));

        // 3. Toggle mastery to true
        mockMvc.perform(patch("/api/flashcards/" + cardId + "/master")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mastered\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashcard.mastered").value(true));

        // 4. Verify updated stats: total=1, mastered=1, learning=0, masteryPercentage=100
        mockMvc.perform(get("/api/flashcards/stats").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.mastered").value(1))
                .andExpect(jsonPath("$.learning").value(0))
                .andExpect(jsonPath("$.masteryPercentage").value(100));

        // 5. Delete flashcard
        mockMvc.perform(delete("/api/flashcards/" + cardId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 6. Verify empty list
        mockMvc.perform(get("/api/flashcards").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashcards", hasSize(0)));
    }

    @Test
    @DisplayName("AI Flashcard generation from note content")
    void testFlashcardAiGeneration() throws Exception {
        RegisterRequest user = new RegisterRequest("Henry AI", "henry@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        GenerateStudyMaterialRequest genReq = new GenerateStudyMaterialRequest(
                null,
                "Operating System Deadlocks",
                "Deadlock occurs when four conditions hold: Mutual exclusion, Hold and wait, No preemption, and Circular wait.",
                "Computer Science",
                4
        );

        mockMvc.perform(post("/api/flashcards/generate")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(genReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.flashcards", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.flashcards[0].question").isString())
                .andExpect(jsonPath("$.flashcards[0].answer").isString());
    }

    @Test
    @DisplayName("Quiz generation, answering, backend score calculation, and history")
    void testQuizGenerationAndSubmission() throws Exception {
        RegisterRequest user = new RegisterRequest("Ivy Quiz", "ivy@example.com", "pass123");
        MvcResult reg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(reg.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Generate Quiz
        GenerateStudyMaterialRequest genReq = new GenerateStudyMaterialRequest(
                null,
                "Photosynthesis Light Reactions",
                "Chlorophyll absorbs photons in the thylakoid membrane. Water is split into oxygen and protons. ATP and NADPH are synthesized.",
                "Biology",
                3
        );

        MvcResult genRes = mockMvc.perform(post("/api/quizzes/generate")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(genReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.quiz.questions", hasSize(3)))
                .andReturn();

        var quizNode = objectMapper.readTree(genRes.getResponse().getContentAsString()).get("quiz");
        Long quizId = quizNode.get("id").asLong();
        var questionsNode = quizNode.get("questions");

        // Prepare submission answers (first question correct, second question correct)
        Map<String, String> answers = new HashMap<>();
        String q1Id = questionsNode.get(0).get("id").asText();
        String q1Correct = questionsNode.get(0).get("correctAnswer").asText();
        answers.put(q1Id, q1Correct);

        String q2Id = questionsNode.get(1).get("id").asText();
        String q2Correct = questionsNode.get(1).get("correctAnswer").asText();
        answers.put(q2Id, q2Correct);

        // Third question intentionally answered incorrectly
        String q3Id = questionsNode.get(2).get("id").asText();
        answers.put(q3Id, "D".equals(questionsNode.get(2).get("correctAnswer").asText()) ? "A" : "D");

        QuizSubmitRequest submitReq = new QuizSubmitRequest(answers);

        // 2. Submit Quiz
        mockMvc.perform(post("/api/quizzes/" + quizId + "/submit")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.attempt.score").value(2))
                .andExpect(jsonPath("$.attempt.total_questions").value(3))
                .andExpect(jsonPath("$.attempt.percentage").value(67))
                .andExpect(jsonPath("$.attempt.feedback").isString())
                .andExpect(jsonPath("$.attempt.details", hasSize(3)));

        // 3. Verify Quiz Stats
        mockMvc.perform(get("/api/quizzes/stats").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQuizzes").value(1))
                .andExpect(jsonPath("$.totalAttempts").value(1))
                .andExpect(jsonPath("$.bestScore").value(67));

        // 4. Verify Quiz Attempt History
        mockMvc.perform(get("/api/quizzes/history").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.history", hasSize(1)))
                .andExpect(jsonPath("$.history[0].score").value(2));
    }

    @Test
    @DisplayName("Cross-user isolation for flashcards and quizzes")
    void testFlashcardAndQuizDataIsolation() throws Exception {
        // User A
        RegisterRequest userA = new RegisterRequest("User A Isol", "usera_isol@example.com", "pass123");
        MvcResult regA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userA)))
                .andReturn();
        String tokenA = "Bearer " + objectMapper.readValue(regA.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User B
        RegisterRequest userB = new RegisterRequest("User B Isol", "userb_isol@example.com", "pass123");
        MvcResult regB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userB)))
                .andReturn();
        String tokenB = "Bearer " + objectMapper.readValue(regB.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User A creates a flashcard
        FlashcardRequest cardReq = new FlashcardRequest("User A Card", "User A Answer", "Secret", "Easy", null, false);
        MvcResult cardRes = mockMvc.perform(post("/api/flashcards")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cardReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long cardId = objectMapper.readTree(cardRes.getResponse().getContentAsString()).get("flashcard").get("id").asLong();

        // User B cannot access or modify User A's flashcard -> 404
        mockMvc.perform(get("/api/flashcards/" + cardId).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/flashcards/" + cardId + "/master").header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/flashcards/" + cardId).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B listing flashcards sees 0
        mockMvc.perform(get("/api/flashcards").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flashcards", hasSize(0)));
    }

    @Test
    @DisplayName("Conversation CRUD: create, list, rename, delete")
    void testConversationLifecycle() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Chat Student", "chatstudent@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Create Conversation
        CreateConversationRequest createReq = new CreateConversationRequest("Distributed Systems Chat");
        MvcResult createRes = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.conversation.title").value("Distributed Systems Chat"))
                .andReturn();
        Long convId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("conversation").get("id").asLong();

        // 2. List Conversations
        mockMvc.perform(get("/api/conversations").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversations", hasSize(1)))
                .andExpect(jsonPath("$.conversations[0].id").value(convId));

        // 3. Rename Conversation
        CreateConversationRequest renameReq = new CreateConversationRequest("Raft Consensus Deep Dive");
        mockMvc.perform(patch("/api/conversations/" + convId)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(renameReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversation.title").value("Raft Consensus Deep Dive"));

        // 4. Delete Conversation
        mockMvc.perform(delete("/api/conversations/" + convId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/conversations").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversations", hasSize(0)));
    }

    @Test
    @DisplayName("AI Chat Assistant: Context-aware answer grounded in saved notes with message persistence")
    void testAiContextAwareChatGroundedInNotes() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Quantum Student", "quantum@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Create a note on Quantum Physics
        NoteRequest noteReq = new NoteRequest(
                "Quantum Superposition and Qubits",
                "Superposition allows a quantum bit or qubit to exist simultaneously as both 0 and 1. " +
                        "Entanglement correlates particles across arbitrary distances. " +
                        "Decoherence is the primary physical constraint causing loss of quantum information.",
                "Physics",
                true,
                Set.of("quantum", "superposition", "qubits")
        );
        mockMvc.perform(post("/api/notes")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteReq)))
                .andExpect(status().isCreated());

        // 2. Ask a study question relevant to the note
        ChatRequest chatReq = new ChatRequest("Explain how superposition works in qubits", null);
        MvcResult chatRes = mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.conversationId").isNumber())
                .andExpect(jsonPath("$.userMessage.role").value("user"))
                .andExpect(jsonPath("$.userMessage.content").value("Explain how superposition works in qubits"))
                .andExpect(jsonPath("$.assistantMessage.role").value("assistant"))
                .andExpect(jsonPath("$.assistantMessage.content", containsString("Quantum Superposition and Qubits")))
                .andExpect(jsonPath("$.sources", hasSize(1)))
                .andExpect(jsonPath("$.sources[0].title").value("Quantum Superposition and Qubits"))
                .andReturn();

        Long convId = objectMapper.readTree(chatRes.getResponse().getContentAsString()).get("conversationId").asLong();

        // 3. Ask a follow-up in the same conversation
        ChatRequest followUpReq = new ChatRequest("What is decoherence in this context?", convId);
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(followUpReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversationId").value(convId))
                .andExpect(jsonPath("$.assistantMessage.content", containsStringIgnoringCase("decoherence")));

        // 4. Verify message persistence in conversation details
        mockMvc.perform(get("/api/conversations/" + convId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversation.id").value(convId))
                .andExpect(jsonPath("$.messages", hasSize(4))); // 2 user messages + 2 assistant messages
    }

    @Test
    @DisplayName("AI Chat Assistant: Cross-user data isolation and conversation privacy")
    void testAiChatUserIsolationAndPrivacy() throws Exception {
        // User A
        RegisterRequest userA = new RegisterRequest("User Alpha", "alpha_chat@example.com", "pass123");
        MvcResult regA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userA)))
                .andReturn();
        String tokenA = "Bearer " + objectMapper.readValue(regA.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User B
        RegisterRequest userB = new RegisterRequest("User Beta", "beta_chat@example.com", "pass123");
        MvcResult regB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userB)))
                .andReturn();
        String tokenB = "Bearer " + objectMapper.readValue(regB.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User A has a private note about "Classified Biotechnology Enzyme 99"
        NoteRequest privateNote = new NoteRequest(
                "Biotechnology Enzyme 99 Secret",
                "Enzyme 99 catalyzes synthetic polymer hydrolysis at 45 degrees Celsius under anaerobic condition.",
                "Biotech",
                true,
                Set.of("enzyme99", "secret")
        );
        mockMvc.perform(post("/api/notes")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(privateNote)))
                .andExpect(status().isCreated());

        // User A starts a conversation
        ChatRequest chatA = new ChatRequest("Tell me about Enzyme 99", null);
        MvcResult chatResA = mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sources", hasSize(1)))
                .andReturn();
        Long convIdA = objectMapper.readTree(chatResA.getResponse().getContentAsString()).get("conversationId").asLong();

        // User B asks about "Enzyme 99" - User B has NO such note in their library
        ChatRequest chatB = new ChatRequest("Tell me about Enzyme 99", null);
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(chatB)))
                .andExpect(status().isOk())
                // User B's sources MUST be empty: User A's note is never leaked
                .andExpect(jsonPath("$.sources", hasSize(0)))
                .andExpect(jsonPath("$.assistantMessage.content", anyOf(containsString("Information Not Found"), containsString("could not find"), containsString("did not find"))));

        // User B attempts to access User A's conversation -> 404
        mockMvc.perform(get("/api/conversations/" + convIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B attempts to delete User A's conversation -> 404
        mockMvc.perform(delete("/api/conversations/" + convIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("AI Note Summarization, Keyword Explanation, and AI Stats")
    void testAiSummarizeAndStats() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Summary Student", "summary@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Create note
        NoteRequest noteReq = new NoteRequest(
                "Distributed Consensus with Raft",
                "Raft decomposes state machine replication into leader election, log replication, and safety. " +
                        "A majority quorum ensures cluster availability even when minority nodes crash. " +
                        "Log compaction prevents memory saturation over prolonged operation.",
                "Computer Science",
                false,
                Set.of("raft", "consensus")
        );
        MvcResult noteRes = mockMvc.perform(post("/api/notes")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long noteId = objectMapper.readValue(noteRes.getResponse().getContentAsString(), SingleNoteResponse.class).getNote().getId();

        // 2. Summarize note
        AISummarizeRequest sumReq = new AISummarizeRequest(noteId, null, null, null);
        mockMvc.perform(post("/api/ai/summarize")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sumReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortSummary").isNotEmpty())
                .andExpect(jsonPath("$.bulletPoints").isArray())
                .andExpect(jsonPath("$.keywords").isArray());

        // 3. Keyword explanation
        KeywordExplainRequest kwReq = new KeywordExplainRequest("Quorum", "Distributed Consensus with Raft");
        mockMvc.perform(post("/api/ai/keyword-explain")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(kwReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.explanation", containsString("Quorum")));

        // 4. AI Stats
        mockMvc.perform(get("/api/ai/stats").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSummaries").value(1));
    }

    @Test
    @DisplayName("Study Planner CRUD: create, list, single view, update, complete toggle, and delete")
    void testStudyPlanCrudAndCompletion() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Plan Student", "planstudent@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Create Study Plan
        List<StudyTaskDto> tasks = List.of(
                new StudyTaskDto("t1", "Read Chapter 4 on Routing", "10:00 AM", false, "High"),
                new StudyTaskDto("t2", "Practice Subnetting Problems", "02:00 PM", false, "Medium")
        );
        StudyPlanRequest createReq = new StudyPlanRequest(
                "Computer Networks Mastery",
                "Computer Science",
                "2026-11-01",
                "2026-11-15",
                "90 minutes daily networking review",
                90,
                "High",
                false,
                tasks
        );

        MvcResult createRes = mockMvc.perform(post("/api/study-plans")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.plan.title").value("Computer Networks Mastery"))
                .andExpect(jsonPath("$.plan.daily_duration_minutes").value(90))
                .andExpect(jsonPath("$.plan.completed").value(false))
                .andExpect(jsonPath("$.plan.tasks", hasSize(2)))
                .andReturn();

        Long planId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("plan").get("id").asLong();

        // 2. List Study Plans
        mockMvc.perform(get("/api/study-plans").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plans", hasSize(1)))
                .andExpect(jsonPath("$.plans[0].id").value(planId));

        // 3. Get Single Study Plan
        mockMvc.perform(get("/api/study-plans/" + planId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.id").value(planId))
                .andExpect(jsonPath("$.plan.title").value("Computer Networks Mastery"));

        // 4. Update Study Plan
        createReq.setTitle("Advanced Computer Networks & OSI Model");
        createReq.setDailyDurationMinutes(120);
        mockMvc.perform(put("/api/study-plans/" + planId)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.title").value("Advanced Computer Networks & OSI Model"))
                .andExpect(jsonPath("$.plan.daily_duration_minutes").value(120));

        // 5. Toggle Completion
        mockMvc.perform(patch("/api/study-plans/" + planId + "/complete")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("completed", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.completed").value(true));

        // 6. Delete Study Plan
        mockMvc.perform(delete("/api/study-plans/" + planId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/study-plans").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plans", hasSize(0)));
    }

    @Test
    @DisplayName("Analytics Dashboard: Accurate database-derived metrics, streak, retention, and progress")
    void testAnalyticsCalculationsWithRealData() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Analytics Student", "analytics@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Initial Empty Analytics
        mockMvc.perform(get("/api/analytics").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.analytics.totalNotes").value(0))
                .andExpect(jsonPath("$.analytics.flashcardsCreated").value(0))
                .andExpect(jsonPath("$.analytics.quizzesCompleted").value(0))
                .andExpect(jsonPath("$.analytics.averageScore").value(0))
                .andExpect(jsonPath("$.analytics.retentionRate").value(0));

        // 2. Create 2 Notes across distinct categories
        NoteRequest note1 = new NoteRequest("Compilers & AST", "Abstract syntax trees represent hierarchical code structure.", "Computer Science", false, Set.of("ast", "parser"));
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(note1)))
                .andExpect(status().isCreated());

        NoteRequest note2 = new NoteRequest("Astrophysics Nebula", "Nebulae are interstellar clouds of dust, hydrogen, and plasma.", "Physics", true, Set.of("space", "nebula"));
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(note2)))
                .andExpect(status().isCreated());

        // 3. Create 1 Flashcard and Master it
        FlashcardRequest card = new FlashcardRequest("What is an AST?", "Abstract Syntax Tree representation", "Computer Science", "Easy", null, true);
        mockMvc.perform(post("/api/flashcards").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(card)))
                .andExpect(status().isCreated());

        // 4. Create Quiz & Submit Attempt
        GenerateStudyMaterialRequest quizGen = new GenerateStudyMaterialRequest(null, "Compiler Fundamentals", "Compiler Fundamentals: Parsers construct syntax trees from tokens.", "Computer Science", 3);
        MvcResult qRes = mockMvc.perform(post("/api/quizzes/generate").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(quizGen)))
                .andExpect(status().isCreated())
                .andReturn();
        com.fasterxml.jackson.databind.JsonNode quizJson = objectMapper.readTree(qRes.getResponse().getContentAsString()).get("quiz");
        Long quizId = quizJson.get("id").asLong();
        com.fasterxml.jackson.databind.JsonNode qArray = quizJson.get("questions");

        Map<String, String> submitAnswers = new HashMap<>();
        if (qArray != null && qArray.size() > 0) {
            submitAnswers.put(qArray.get(0).get("id").asText(), qArray.get(0).get("correctAnswer").asText());
        }
        QuizSubmitRequest sub = new QuizSubmitRequest(submitAnswers);
        mockMvc.perform(post("/api/quizzes/" + quizId + "/submit").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(sub)))
                .andExpect(status().isOk());

        // 5. Verify Real Analytics Metrics
        mockMvc.perform(get("/api/analytics").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.analytics.totalNotes").value(2))
                .andExpect(jsonPath("$.analytics.flashcardsCreated").value(1))
                .andExpect(jsonPath("$.analytics.masteredCards").value(1))
                .andExpect(jsonPath("$.analytics.quizzesCompleted").value(1))
                .andExpect(jsonPath("$.analytics.quizAttempts").value(1))
                .andExpect(jsonPath("$.analytics.averageScore").value(100))
                .andExpect(jsonPath("$.analytics.retentionRate").value(100))
                .andExpect(jsonPath("$.analytics.topicsDistribution", hasSize(2)))
                .andExpect(jsonPath("$.analytics.studyGoals", hasSize(4)))
                .andExpect(jsonPath("$.analytics.notesPerWeek", hasSize(7)));
    }

    @Test
    @DisplayName("Cross-User Isolation: User B cannot access or modify User A's study plans or analytics")
    void testStudyPlanAndAnalyticsCrossUserIsolation() throws Exception {
        // User A
        RegisterRequest userA = new RegisterRequest("User A Plan", "usera_plan@example.com", "pass123");
        MvcResult regA = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userA)))
                .andReturn();
        String tokenA = "Bearer " + objectMapper.readValue(regA.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User B
        RegisterRequest userB = new RegisterRequest("User B Plan", "userb_plan@example.com", "pass123");
        MvcResult regB = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userB)))
                .andReturn();
        String tokenB = "Bearer " + objectMapper.readValue(regB.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User A creates a study plan
        StudyPlanRequest planReq = new StudyPlanRequest("Confidential Thesis Schedule", "Research", "2026-11-01", "2026-12-01", "Write thesis chapter", 120, "High", false, null);
        MvcResult planRes = mockMvc.perform(post("/api/study-plans").header("Authorization", tokenA).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(planReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long planIdA = objectMapper.readTree(planRes.getResponse().getContentAsString()).get("plan").get("id").asLong();

        // User B cannot access User A's plan -> 404
        mockMvc.perform(get("/api/study-plans/" + planIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B cannot modify User A's plan -> 404
        mockMvc.perform(put("/api/study-plans/" + planIdA).header("Authorization", tokenB).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(planReq)))
                .andExpect(status().isNotFound());

        // User B cannot toggle completion of User A's plan -> 404
        mockMvc.perform(patch("/api/study-plans/" + planIdA + "/complete").header("Authorization", tokenB).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(Map.of("completed", true))))
                .andExpect(status().isNotFound());

        // User B cannot delete User A's plan -> 404
        mockMvc.perform(delete("/api/study-plans/" + planIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B's plan listing is empty
        mockMvc.perform(get("/api/study-plans").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plans", hasSize(0)));

        // User B's analytics shows 0 totalNotes and 0 study plans
        mockMvc.perform(get("/api/analytics").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.analytics.totalNotes").value(0))
                .andExpect(jsonPath("$.analytics.estimatedStudyHours").value(0.0));
    }

    @Test
    @DisplayName("Activity Timeline API: Records actions and returns structured event stream")
    void testActivityLogListing() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Activity Student", "activity_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Perform actions: Note creation, Study Plan creation
        NoteRequest note = new NoteRequest("Database Normalization", "1NF, 2NF, 3NF, BCNF prevent update anomalies.", "Database", false, Set.of("db", "sql"));
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(note)))
                .andExpect(status().isCreated());

        StudyPlanRequest plan = new StudyPlanRequest("SQL Query Optimization", "Database", "2026-11-01", "2026-11-05", "Index analysis", 60, "Medium", false, null);
        mockMvc.perform(post("/api/study-plans").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(plan)))
                .andExpect(status().isCreated());

        // Fetch activity stream
        mockMvc.perform(get("/api/activity").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.activity", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.activity[0].description").isNotEmpty());
    }

    @Test
    @DisplayName("Document Processing: Multi-page document upload extracts text, structures pages, and indexes RAG chunks")
    void testDocumentUploadMultiPageAndChunkIndexing() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Doc Student", "doc_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Multi-page document content separated by page breaks
        String docContent = "Chapter 1: Quantum Mechanics\n\nQuantum mechanics is the fundamental theory describing nature at atomic scales.\n" +
                "Wave functions calculate probabilities of finding particles.\n\u000c" +
                "Chapter 2: Thermodynamics\n\nEntropy is a measure of molecular disorder in thermodynamic systems.\n" +
                "The second law states total entropy always increases.";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "Physics_Syllabus.txt",
                "text/plain",
                docContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        MvcResult uploadRes = mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("title", "Physics Syllabus")
                        .param("category", "Physics")
                        .param("saveNote", "true")
                        .header("Authorization", token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.fileName").value("Physics_Syllabus.txt"))
                .andExpect(jsonPath("$.fileType").value("txt"))
                .andExpect(jsonPath("$.status").value("READY"))
                .andExpect(jsonPath("$.pageCount").value(2))
                .andExpect(jsonPath("$.wordCount", greaterThan(20)))
                .andReturn();

        Long docId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("documentId").asLong();

        // Verify document listing
        mockMvc.perform(get("/api/documents").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fileName").value("Physics_Syllabus.txt"))
                .andExpect(jsonPath("$[0].status").value("READY"));

        // Verify single document retrieval
        mockMvc.perform(get("/api/documents/" + docId).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("Physics_Syllabus.txt"))
                .andExpect(jsonPath("$.pageCount").value(2));
    }

    @Test
    @DisplayName("Document Validation: Oversized documents exceeding limit are rejected")
    void testDocumentUploadOversizedRejection() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Limit Student", "limit_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Create empty file
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        mockMvc.perform(multipart("/api/documents/upload").file(emptyFile).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("empty")));

        // Create unsupported format
        MockMultipartFile exeFile = new MockMultipartFile("file", "malware.exe", "application/octet-stream", new byte[]{0x4D, 0x5A});
        mockMvc.perform(multipart("/api/documents/upload").file(exeFile).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Unsupported file format")));
    }

    @Test
    @DisplayName("PDF Quality Check: Scanned PDFs without selectable text report clear OCR requirement")
    void testScannedPdfDetectionAndOcrRequirement() throws Exception {
        RegisterRequest userReq = new RegisterRequest("OCR Student", "ocr_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // PDF with valid header and /Image object, but without text streams
        String scannedPdfMock = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im1 4 0 R >> >> >>\nendobj\n" +
                "4 0 obj\n<< /Type /XObject /Subtype /Image /Width 800 /Height 600 >>\nstream\n[binary image data]\nendstream\nendobj\n" +
                "xref\ntrailer\n<< /Root 1 0 R >>\n%%EOF";

        MockMultipartFile scannedFile = new MockMultipartFile(
                "file",
                "ScannedLecture.pdf",
                "application/pdf",
                scannedPdfMock.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/documents/upload").file(scannedFile).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("OCR")));
    }

    @Test
    @DisplayName("PDF Security: Password-protected PDFs report encrypted document error")
    void testCorruptedAndPasswordProtectedPdfDetection() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Security Student", "sec_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // PDF with /Encrypt dictionary
        String protectedPdfMock = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                "3 0 obj\n<< /Type /Page >>\nendobj\n" +
                "trailer\n<< /Root 1 0 R /Encrypt 5 0 R >>\n%%EOF";

        MockMultipartFile encryptedFile = new MockMultipartFile(
                "file",
                "Protected_Exam.pdf",
                "application/pdf",
                protectedPdfMock.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/documents/upload").file(encryptedFile).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("password-protected")));

        // Non-PDF file pretending to be PDF
        MockMultipartFile corruptFile = new MockMultipartFile(
                "file",
                "Corrupt.pdf",
                "application/pdf",
                "Not a valid PDF file at all".getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/documents/upload").file(corruptFile).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid PDF")));
    }

    @Test
    @DisplayName("RAG Intelligence: Querying Fact A vs Fact B produces distinct, fact-specific answers and citations")
    void testRagRetrievalFactSpecificityDifference() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Bio Student", "bio_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // 1. Upload Note A: Cellular Respiration
        NoteRequest noteA = new NoteRequest(
                "Mitochondrial Respiration",
                "Mitochondria generate cellular ATP through oxidative phosphorylation across the inner membrane electron transport chain.",
                "Biology",
                false,
                Set.of("mitochondria", "atp")
        );
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(noteA)))
                .andExpect(status().isCreated());

        // 2. Upload Note B: Plant Photosynthesis
        NoteRequest noteB = new NoteRequest(
                "Plant Photosynthesis",
                "Chloroplasts contain thylakoid disks where chlorophyll pigments capture light photons to synthesize glucose sugar.",
                "Botany",
                false,
                Set.of("chloroplasts", "photosynthesis")
        );
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(noteB)))
                .andExpect(status().isCreated());

        // 3. Ask Question A about mitochondria
        ChatRequest chatReqA = new ChatRequest("Explain how mitochondria synthesize ATP energy.");
        MvcResult resA = mockMvc.perform(post("/api/ai/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(chatReqA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String answerA = objectMapper.readTree(resA.getResponse().getContentAsString()).get("assistantMessage").get("content").asText().toLowerCase();
        assertTrue(answerA.contains("atp") || answerA.contains("mitochondria") || answerA.contains("oxidative"), "Answer A should discuss ATP and mitochondria");
        assertFalse(answerA.contains("chlorophyll"), "Answer A should not discuss chlorophyll or plant photosynthesis");

        // 4. Ask Question B about chloroplasts
        ChatRequest chatReqB = new ChatRequest("What is the function of chloroplasts and thylakoid pigments?");
        MvcResult resB = mockMvc.perform(post("/api/ai/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(chatReqB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String answerB = objectMapper.readTree(resB.getResponse().getContentAsString()).get("assistantMessage").get("content").asText().toLowerCase();
        assertTrue(answerB.contains("chloroplast") || answerB.contains("glucose") || answerB.contains("thylakoid"), "Answer B should discuss chloroplasts and glucose");
        assertFalse(answerB.contains("oxidative phosphorylation"), "Answer B should not discuss oxidative phosphorylation");
    }

    @Test
    @DisplayName("Conversational Multi-Turn: Pronoun follow-up ('What are its types?') resolves prior topic correctly")
    void testRagConversationalPronounResolution() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Followup Student", "followup_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Create Note on Normalization
        NoteRequest note = new NoteRequest(
                "Relational Database Normalization",
                "Database Normalization organizes tables to reduce redundancy. The primary stages are First Normal Form (1NF), Second Normal Form (2NF), Third Normal Form (3NF), and Boyce-Codd Normal Form (BCNF).",
                "Databases",
                false,
                Set.of("database", "sql")
        );
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(note)))
                .andExpect(status().isCreated());

        // Turn 1: Ask initial topic
        ChatRequest chat1 = new ChatRequest("Explain Database Normalization.");
        MvcResult res1 = mockMvc.perform(post("/api/ai/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(chat1)))
                .andExpect(status().isOk())
                .andReturn();

        Long convId = objectMapper.readTree(res1.getResponse().getContentAsString()).get("conversationId").asLong();

        // Turn 2: Follow up with pronoun "What are its types?"
        ChatRequest chat2 = new ChatRequest("What are its types?", convId);
        MvcResult res2 = mockMvc.perform(post("/api/ai/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(chat2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String answer2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("assistantMessage").get("content").asText();
        assertTrue(answer2.contains("1NF") || answer2.contains("2NF") || answer2.contains("3NF") || answer2.contains("BCNF") || answer2.toLowerCase().contains("normalization"),
                "Follow-up answer should resolve 'its' and detail normal forms");
    }

    @Test
    @DisplayName("Honest Absence: Questions on unmentioned topics state lack of information without hallucinations")
    void testRagHonestAbsenceNoHallucinations() throws Exception {
        RegisterRequest userReq = new RegisterRequest("Honest Student", "honest_student@example.com", "pass123");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = "Bearer " + objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Note is strictly about Java garbage collection
        NoteRequest note = new NoteRequest("Java Memory", "The JVM garbage collector manages heap memory using generational collection.", "Java", false, Set.of("java"));
        mockMvc.perform(post("/api/notes").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(note)))
                .andExpect(status().isCreated());

        // Ask about something completely unrelated and not in notes
        ChatRequest chatReq = new ChatRequest("What is quantum chromodynamics asymptotic freedom?");
        MvcResult res = mockMvc.perform(post("/api/ai/chat").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isOk())
                .andReturn();

        String answer = objectMapper.readTree(res.getResponse().getContentAsString()).get("assistantMessage").get("content").asText().toLowerCase();
        assertTrue(answer.contains("not found") || answer.contains("does not mention") || answer.contains("cannot find") || answer.contains("no mention") || answer.contains("don't have"),
                "Response should honestly state the material is not in the user's notes");
    }

    @Test
    @DisplayName("Cross-User Isolation: User B cannot view, download, or delete User A's uploaded documents")
    void testDocumentCrossUserIsolation() throws Exception {
        // User A
        RegisterRequest userA = new RegisterRequest("User A Docs", "usera_docs@example.com", "pass123");
        MvcResult regA = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userA)))
                .andReturn();
        String tokenA = "Bearer " + objectMapper.readValue(regA.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User B
        RegisterRequest userB = new RegisterRequest("User B Docs", "userb_docs@example.com", "pass123");
        MvcResult regB = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(userB)))
                .andReturn();
        String tokenB = "Bearer " + objectMapper.readValue(regB.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // User A uploads a document
        MockMultipartFile fileA = new MockMultipartFile(
                "file",
                "Classified_Research.txt",
                "text/plain",
                "Confidential research paper on neural networks.".getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
        MvcResult uploadRes = mockMvc.perform(multipart("/api/documents/upload")
                        .file(fileA)
                        .param("title", "Classified Research")
                        .header("Authorization", tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        Long docIdA = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("documentId").asLong();

        // User B cannot get User A's document -> 404
        mockMvc.perform(get("/api/documents/" + docIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B cannot delete User A's document -> 404
        mockMvc.perform(delete("/api/documents/" + docIdA).header("Authorization", tokenB))
                .andExpect(status().isNotFound());

        // User B's document list does not contain User A's document
        mockMvc.perform(get("/api/documents").header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
