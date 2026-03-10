
import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../types';
import { QUIZ_QUESTIONS } from '../constants';
import { getQuizQuestions } from '../services/geminiService';
import { getFromStorage, saveToStorage } from '../utils/storage';

interface QuizProps {
  onAwardPoints: (points: number) => void;
  currentQuizPoints: number;
}

const Quiz: React.FC<QuizProps> = ({ onAwardPoints, currentQuizPoints }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchNewQuestions = useCallback(async () => {
    setIsFetching(true);
    try {
      const newQuestions = await getQuizQuestions(10);
      if (newQuestions && newQuestions.length > 0) {
        const formatted: QuizQuestion[] = newQuestions.map((q: any, idx: number) => ({
          id: `ai_${Date.now()}_${idx}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctIndex,
          points: 10,
          explanation: q.explanation || "এই প্রশ্নের সঠিক উত্তরটি কুরআন ও সুন্নাহর আলোকে প্রদান করা হয়েছে।"
        }));
        setQuestions(formatted);
        saveToStorage('ramadan_cached_quiz', formatted);
      } else {
        // Fallback to static shuffled questions if AI fails
        setQuestions([...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
      }
    } catch (error) {
      console.error("Quiz fetch failed", error);
      setQuestions([...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Initialize questions
  useEffect(() => {
    const cached = getFromStorage<QuizQuestion[]>('ramadan_cached_quiz', []);
    if (cached.length >= 10) {
      setQuestions(cached);
    } else {
      fetchNewQuestions();
    }
  }, [fetchNewQuestions]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || !currentQuestion) return;
    
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + currentQuestion.points);
      onAwardPoints(currentQuestion.points);
    }
    
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
    fetchNewQuestions(); // Fetch fresh 10 questions for the next round
  };

  if (isFetching && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-400 font-medium">কুইজ লোড হচ্ছে...</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-amber-400 mb-2 font-playfair">কুইজ সম্পন্ন!</h2>
          <p className="text-emerald-100 mb-6">আপনি {questions.length} টির মধ্যে {score / 10} টি সঠিক উত্তর দিয়েছেন।</p>
          
          <div className="bg-emerald-950/50 rounded-xl p-4 mb-6 border border-emerald-800/50">
            <span className="text-xs text-emerald-500 uppercase tracking-widest block mb-1">অর্জিত পয়েন্ট</span>
            <span className="text-3xl font-bold text-amber-500">{score}</span>
          </div>

          <button
            onClick={resetQuiz}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20"
          >
            আবার খেলুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
          প্রশ্ন {currentQuestionIndex + 1} / {questions.length}
        </span>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
          {score} পয়েন্ট
        </span>
      </div>

      <div className="bg-emerald-900/40 border border-emerald-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-medium text-emerald-50 font-playfair mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let bgColor = 'bg-emerald-800/30 border-emerald-700/50';
            let textColor = 'text-emerald-100';
            let ringColor = '';

            if (isAnswered) {
              if (index === currentQuestion.correctAnswer) {
                bgColor = 'bg-green-600 border-green-400';
                textColor = 'text-white';
                ringColor = 'ring-4 ring-green-500/30';
              } else if (index === selectedOption) {
                bgColor = 'bg-red-600 border-red-400';
                textColor = 'text-white';
                ringColor = 'ring-4 ring-red-500/30';
              }
            } else if (selectedOption === index) {
              bgColor = 'bg-amber-500/20 border-amber-500/50';
              textColor = 'text-amber-400';
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${bgColor} ${textColor} ${ringColor} ${!isAnswered && 'hover:border-amber-500/50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${isAnswered && index === currentQuestion.correctAnswer ? 'bg-white text-green-600 border-white' : selectedOption === index ? 'border-amber-500 bg-amber-500 text-emerald-950' : 'border-emerald-700 text-emerald-500'}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 p-4 bg-emerald-950/50 rounded-xl border border-emerald-800/50 animate-fadeIn">
            <p className="text-sm text-emerald-300 leading-relaxed">
              <span className="font-bold text-amber-500">ব্যাখ্যা:</span> {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="pt-4">
        {!isAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${selectedOption !== null ? 'bg-amber-600 text-white shadow-amber-900/20' : 'bg-emerald-800/50 text-emerald-600 cursor-not-allowed'}`}
          >
            উত্তর জমা দিন
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-emerald-100 text-emerald-950 hover:bg-white rounded-xl font-bold transition-all shadow-lg shadow-black/20"
          >
            {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? 'পরবর্তী প্রশ্ন' : 'ফলাফল দেখুন'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
