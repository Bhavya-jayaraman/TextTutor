/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  note_id?: number;
  title: string;
  category: string;
  questions_count?: number;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAttemptAnswer {
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  question_text: string;
  explanation: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  quiz_title?: string;
  category?: string;
  user_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  answers: QuizAttemptAnswer[];
  completed_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'quiz_questions.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'quiz_attempts.json');

class QuizService {
  constructor() {
    this.ensureDataFiles();
  }

  private ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(QUIZZES_FILE)) {
      fs.writeFileSync(QUIZZES_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(QUESTIONS_FILE)) {
      fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(ATTEMPTS_FILE)) {
      fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify([], null, 2));
    }
  }

  private readQuizzes(): Quiz[] {
    try {
      this.ensureDataFiles();
      const data = fs.readFileSync(QUIZZES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeQuizzes(quizzes: Quiz[]): void {
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2));
  }

  private readQuestions(): QuizQuestion[] {
    try {
      this.ensureDataFiles();
      const data = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeQuestions(questions: QuizQuestion[]): void {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
  }

  private readAttempts(): QuizAttempt[] {
    try {
      this.ensureDataFiles();
      const data = fs.readFileSync(ATTEMPTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeAttempts(attempts: QuizAttempt[]): void {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  }

  /**
   * Save a newly generated quiz with questions
   */
  createQuiz(
    userId: number,
    payload: {
      noteId?: number;
      title: string;
      category?: string;
      questions: Array<{
        question: string;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        correct_answer: 'A' | 'B' | 'C' | 'D';
        explanation: string;
      }>;
    }
  ): Quiz {
    const quizzes = this.readQuizzes();
    const questions = this.readQuestions();

    const quizId = quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newQuiz: Quiz = {
      id: quizId,
      user_id: userId,
      note_id: payload.noteId,
      title: payload.title || 'Untitled Quiz',
      category: payload.category || 'General',
      created_at: now,
      updated_at: now,
    };

    quizzes.push(newQuiz);
    this.writeQuizzes(quizzes);

    let questionIdCounter = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const createdQuestions: QuizQuestion[] = [];

    for (const q of payload.questions) {
      const newQuestion: QuizQuestion = {
        id: questionIdCounter++,
        quiz_id: quizId,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation || 'No explanation provided.',
      };
      questions.push(newQuestion);
      createdQuestions.push(newQuestion);
    }

    this.writeQuestions(questions);

    return {
      ...newQuiz,
      questions_count: createdQuestions.length,
      questions: createdQuestions,
    };
  }

  /**
   * Get all quizzes for a user
   */
  getUserQuizzes(userId: number, category?: string): Quiz[] {
    const quizzes = this.readQuizzes().filter((q) => q.user_id === userId);
    const questions = this.readQuestions();

    return quizzes
      .filter((q) => !category || category === 'All' || q.category.toLowerCase() === category.toLowerCase())
      .map((q) => {
        const qCount = questions.filter((quest) => quest.quiz_id === q.id).length;
        return {
          ...q,
          questions_count: qCount,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get single quiz with questions
   */
  getQuizById(quizId: number, userId: number): Quiz | null {
    const quiz = this.readQuizzes().find((q) => q.id === quizId && q.user_id === userId);
    if (!quiz) return null;

    const questions = this.readQuestions().filter((quest) => quest.quiz_id === quiz.id);

    return {
      ...quiz,
      questions_count: questions.length,
      questions,
    };
  }

  /**
   * Submit quiz attempt and calculate score
   */
  submitQuiz(
    quizId: number,
    userId: number,
    userAnswers: Record<number, 'A' | 'B' | 'C' | 'D'>
  ): QuizAttempt | null {
    const quiz = this.getQuizById(quizId, userId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const detailedAnswers: QuizAttemptAnswer[] = [];

    for (const q of quiz.questions) {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) {
        score++;
      }

      detailedAnswers.push({
        question_id: q.id,
        selected_option: selected,
        is_correct: isCorrect,
        correct_answer: q.correct_answer,
        question_text: q.question,
        explanation: q.explanation,
      });
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    const attempts = this.readAttempts();
    const attemptId = attempts.length > 0 ? Math.max(...attempts.map((a) => a.id)) + 1 : 1;

    const newAttempt: QuizAttempt = {
      id: attemptId,
      quiz_id: quizId,
      quiz_title: quiz.title,
      category: quiz.category,
      user_id: userId,
      score,
      total_questions: totalQuestions,
      percentage,
      answers: detailedAnswers,
      completed_at: new Date().toISOString(),
    };

    attempts.push(newAttempt);
    this.writeAttempts(attempts);

    return newAttempt;
  }

  /**
   * Get quiz history for user
   */
  getQuizHistory(userId: number): QuizAttempt[] {
    const attempts = this.readAttempts().filter((a) => a.user_id === userId);
    return attempts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  }

  /**
   * Get user quiz stats
   */
  getQuizStats(userId: number): {
    totalQuizzesGenerated: number;
    totalAttempts: number;
    averageScore: number;
    recentAttempts: QuizAttempt[];
  } {
    const userQuizzes = this.readQuizzes().filter((q) => q.user_id === userId);
    const attempts = this.getQuizHistory(userId);

    const totalQuizzesGenerated = userQuizzes.length;
    const totalAttempts = attempts.length;

    const averageScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts)
        : 0;

    return {
      totalQuizzesGenerated,
      totalAttempts,
      averageScore,
      recentAttempts: attempts.slice(0, 5),
    };
  }

  /**
   * Delete quiz
   */
  deleteQuiz(quizId: number, userId: number): boolean {
    let quizzes = this.readQuizzes();
    const index = quizzes.findIndex((q) => q.id === quizId && q.user_id === userId);
    if (index === -1) return false;

    quizzes.splice(index, 1);
    this.writeQuizzes(quizzes);

    // Clean up questions
    let questions = this.readQuestions().filter((q) => q.quiz_id !== quizId);
    this.writeQuestions(questions);

    return true;
  }
}

export const quizService = new QuizService();
