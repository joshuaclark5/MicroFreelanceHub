"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  { id: 'type', label: 'What is your hair type?', options: ['2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'] },
  { id: 'porosity', label: 'How does your hair handle water?', options: ['Low Porosity (Floats)', 'High Porosity (Sinks)'] }
];

export default function QuizComponent() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const router = useRouter();

  const analysisMessages = [
    "Mapping curl elasticity...",
    "Calculating porosity absorption rates...",
    "Cross-referencing local climate dew points...",
    "Finalizing your Prescription..."
  ];

  const handleAnswer = (answer: string) => {
    const currentQuestion = QUESTIONS[step].id;
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Begin "Fake AI" Processing
      setIsAnalyzing(true);
      const porosity = newAnswers.porosity.toLowerCase().includes('high') ? 'high' : 'low';
      const slug = `${newAnswers.type.toLowerCase()}-${porosity}-porosity`;
      
      localStorage.setItem('user_hair_profile', JSON.stringify(newAnswers));

      let interval = setInterval(() => {
        setAnalysisStep(prev => {
          if (prev >= analysisMessages.length - 1) {
            clearInterval(interval);
            router.push(`/routine/${slug}`);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
  };

  // 1. The "Fake AI" Processing Screen (The Labor Illusion)
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-serif font-medium text-slate-800 animate-pulse">
          {analysisMessages[analysisStep]}
        </p>
      </div>
    );
  }

  // 2. The Interactive Quiz UI
  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-pink-100">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-pink-500">Step {step + 1} of {QUESTIONS.length}</span>
        <h2 className="text-2xl font-serif font-bold text-slate-800 mt-2">{QUESTIONS[step].label}</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {QUESTIONS[step].options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="w-full py-4 px-6 text-left border-2 border-slate-100 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all font-medium text-slate-700"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}