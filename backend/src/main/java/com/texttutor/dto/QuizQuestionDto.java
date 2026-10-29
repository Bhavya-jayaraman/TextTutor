package com.texttutor.dto;

public class QuizQuestionDto {
    private Long id;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private String explanation;
    private String sourceReference;

    public QuizQuestionDto() {}

    public QuizQuestionDto(Long id, String question, String optionA, String optionB, String optionC, String optionD, String correctAnswer, String explanation) {
        this(id, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, null);
    }

    public QuizQuestionDto(Long id, String question, String optionA, String optionB, String optionC, String optionD, String correctAnswer, String explanation, String sourceReference) {
        this.id = id;
        this.question = question;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.sourceReference = sourceReference;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getOptionA() { return optionA; }
    public void setOptionA(String optionA) { this.optionA = optionA; }

    public String getOptionB() { return optionB; }
    public void setOptionB(String optionB) { this.optionB = optionB; }

    public String getOptionC() { return optionC; }
    public void setOptionC(String optionC) { this.optionC = optionC; }

    public String getOptionD() { return optionD; }
    public void setOptionD(String optionD) { this.optionD = optionD; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
}
