'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, RotateCcw, ChevronRight, Zap } from 'lucide-react';

interface DrinkQuizProps {
  /** When on the menu page, pass this to switch the tab in-place without navigation */
  onSelectCategory?: (category: string) => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tag =
  | 'cold' | 'hot' | 'frozen' | 'fresh'
  | 'coffee' | 'fruit' | 'chocolate' | 'nutty' | 'creamy' | 'tangy' | 'herbal'
  | 'sweet' | 'bold' | 'light' | 'rich' | 'exotic'
  | 'energizing' | 'relaxing' | 'indulgent' | 'refreshing'
  | 'waffle' | 'dessert' | 'yogurt' | 'icecream';

interface Answer {
  text: string;
  tags: Tag[];
}

interface Question {
  id: number;
  emoji: string;
  question: string;
  answers: Answer[];
}

interface DrinkProfile {
  name: string;
  emoji: string;
  description: string;
  tags: Tag[];
  category: string; // maps to menu category tab
  accentColor: string;
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    emoji: '🌤️',
    question: "What's your vibe today, darling?",
    answers: [
      { text: "Full throttle — gotta conquer the day ☕", tags: ['energizing', 'bold', 'coffee'] },
      { text: "Chill mode, zero stress 🧊", tags: ['relaxing', 'cold', 'light'] },
      { text: "Sweet escape from reality 🍫", tags: ['indulgent', 'sweet', 'chocolate'] },
      { text: "Fresh start, clean slate 🌿", tags: ['refreshing', 'fresh', 'herbal'] },
    ],
  },
  {
    id: 2,
    emoji: '🎵',
    question: "Pick the record that's spinning in your head:",
    answers: [
      { text: "Heavy bass, no mercy 🎸", tags: ['bold', 'energizing', 'rich'] },
      { text: "Smooth jazz, golden hour 🎷", tags: ['creamy', 'rich', 'relaxing'] },
      { text: "Tropical pop, windows down 🌺", tags: ['fresh', 'fruit', 'exotic', 'refreshing'] },
      { text: "Soft acoustic, cozy café ☕", tags: ['hot', 'herbal', 'light', 'relaxing'] },
    ],
  },
  {
    id: 3,
    emoji: '🌡️',
    question: "Temperature check — what hits right?",
    answers: [
      { text: "Ice cold — I run hot 🧊", tags: ['cold', 'frozen', 'refreshing'] },
      { text: "Warm hug in a cup ♨️", tags: ['hot', 'relaxing', 'herbal'] },
      { text: "Blended & frosty ❄️", tags: ['frozen', 'creamy', 'cold'] },
      { text: "Room temp — pure, uncut 🌿", tags: ['fresh', 'light', 'fruit'] },
    ],
  },
  {
    id: 4,
    emoji: '🍰',
    question: "Confess your deepest craving right now:",
    answers: [
      { text: "Something rich & creamy 🍫", tags: ['creamy', 'indulgent', 'chocolate', 'sweet'] },
      { text: "Fruit explosion, nothing fake 🍓", tags: ['fruit', 'fresh', 'tangy', 'refreshing'] },
      { text: "That nutty, toasty goodness 🥜", tags: ['nutty', 'rich', 'indulgent'] },
      { text: "Pure sweetness, no apologies 🍦", tags: ['sweet', 'dessert', 'icecream', 'indulgent'] },
    ],
  },
  {
    id: 5,
    emoji: '✨',
    question: "Last call — what's the word?",
    answers: [
      { text: "Adventure & something new 🌟", tags: ['exotic', 'bold', 'energizing'] },
      { text: "Comfort & the familiar 🏠", tags: ['relaxing', 'hot', 'light'] },
      { text: "Treat yourself, you deserve it 🎁", tags: ['indulgent', 'sweet', 'dessert', 'waffle'] },
      { text: "Keep it clean, keep it fresh 🌊", tags: ['fresh', 'fruit', 'refreshing', 'light'] },
    ],
  },
];

// ─── Drink Profiles ───────────────────────────────────────────────────────────

const DRINK_PROFILES: DrinkProfile[] = [
  {
    name: 'Frappe Lotus',
    emoji: '🍪',
    description: "Indulgent, iconic, impossible to resist. You walk into a room and own it.",
    tags: ['frozen', 'creamy', 'sweet', 'indulgent', 'bold', 'cold'],
    category: 'Frappe',
    accentColor: 'from-amber-500 to-orange-400',
  },
  {
    name: 'Frappe Pistachio',
    emoji: '🌿',
    description: "Sophisticated with a twist. You appreciate the finer things in a very chill way.",
    tags: ['frozen', 'nutty', 'creamy', 'exotic', 'sweet', 'cold'],
    category: 'Frappe',
    accentColor: 'from-green-500 to-emerald-400',
  },
  {
    name: 'Frappe Nutella',
    emoji: '🍫',
    description: "Rich, generous, unapologetically chocolatey. People love being around you.",
    tags: ['frozen', 'chocolate', 'creamy', 'indulgent', 'sweet', 'rich'],
    category: 'Frappe',
    accentColor: 'from-amber-700 to-brown-500',
  },
  {
    name: 'Mango Smoothie',
    emoji: '🥭',
    description: "Tropical, bright, effortlessly joyful. You're the sunshine of the group.",
    tags: ['fresh', 'fruit', 'sweet', 'exotic', 'refreshing', 'energizing'],
    category: 'Smoothie',
    accentColor: 'from-yellow-400 to-orange-300',
  },
  {
    name: 'Strawberry Smoothie',
    emoji: '🍓',
    description: "Sweet and bold with a tangy edge. You keep things real, always.",
    tags: ['fruit', 'fresh', 'tangy', 'sweet', 'refreshing', 'light'],
    category: 'Smoothie',
    accentColor: 'from-red-400 to-pink-400',
  },
  {
    name: 'Passion Fruit Smoothie',
    emoji: '🌺',
    description: "Exotic, complex, one of a kind. You don't follow trends — you start them.",
    tags: ['exotic', 'fruit', 'tangy', 'refreshing', 'bold', 'energizing'],
    category: 'Smoothie',
    accentColor: 'from-purple-500 to-pink-400',
  },
  {
    name: 'Karak Tea',
    emoji: '☕',
    description: "Warm, spiced, deeply comforting. You are the friend everyone calls at midnight.",
    tags: ['hot', 'relaxing', 'bold', 'rich', 'energizing', 'creamy'],
    category: 'Tea & Herbs',
    accentColor: 'from-amber-600 to-yellow-500',
  },
  {
    name: 'Mint Tea',
    emoji: '🌿',
    description: "Cool-headed, crisp, and refreshing. You bring clarity to every situation.",
    tags: ['hot', 'herbal', 'light', 'refreshing', 'relaxing', 'fresh'],
    category: 'Tea & Herbs',
    accentColor: 'from-green-400 to-teal-300',
  },
  {
    name: 'Avocado Juice',
    emoji: '🥑',
    description: "Creamy, health-conscious, quietly luxurious. Understated royalty.",
    tags: ['fresh', 'creamy', 'rich', 'light', 'relaxing', 'exotic'],
    category: 'Fresh Juice',
    accentColor: 'from-green-600 to-lime-400',
  },
  {
    name: 'Orange Juice',
    emoji: '🍊',
    description: "A classic for a reason. Energizing, honest, and always a good idea.",
    tags: ['fresh', 'fruit', 'energizing', 'tangy', 'refreshing', 'light'],
    category: 'Fresh Juice',
    accentColor: 'from-orange-400 to-yellow-300',
  },
  {
    name: 'Nutella Waffle',
    emoji: '🧇',
    description: "Pure indulgence on a plate. You live life like every day is a celebration.",
    tags: ['sweet', 'chocolate', 'indulgent', 'dessert', 'waffle', 'rich'],
    category: 'Waffle Corner',
    accentColor: 'from-amber-700 to-amber-500',
  },
  {
    name: 'Pistachio Waffle',
    emoji: '🥜',
    description: "A rare blend of elegance and warmth. Sweet tooth meets refined taste.",
    tags: ['sweet', 'nutty', 'indulgent', 'dessert', 'waffle', 'creamy'],
    category: 'Waffle Corner',
    accentColor: 'from-green-600 to-yellow-400',
  },
  {
    name: 'Ice Cream 3 Scoop',
    emoji: '🍦',
    description: "Triple the fun, zero regrets. You make everything more fun just by being there.",
    tags: ['cold', 'sweet', 'dessert', 'icecream', 'indulgent', 'creamy'],
    category: 'Ice Cream',
    accentColor: 'from-pink-400 to-purple-400',
  },
  {
    name: 'Honey Yogurt',
    emoji: '🍯',
    description: "Balanced, thoughtful, quietly sweet. You're the one who actually has it together.",
    tags: ['light', 'sweet', 'fresh', 'yogurt', 'relaxing', 'creamy'],
    category: 'Yogurt Corner',
    accentColor: 'from-yellow-400 to-amber-300',
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function scoreProfiles(selectedTags: Tag[]): { profile: DrinkProfile; score: number; pct: number }[] {
  const tagCounts: Record<string, number> = {};
  selectedTags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

  const results = DRINK_PROFILES.map(profile => {
    let score = 0;
    profile.tags.forEach(tag => {
      if (tagCounts[tag]) score += tagCounts[tag] * 2; // weighted match
    });
    return { profile, score };
  });

  results.sort((a, b) => b.score - a.score);

  const maxScore = results[0]?.score || 1;
  return results.map(r => ({
    ...r,
    pct: Math.round((r.score / maxScore) * 100),
  }));
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

const MatchBar = ({ pct, accentColor, delay }: { pct: number; accentColor: string; delay: number }) => (
  <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden mt-3">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      className={`h-full rounded-full bg-gradient-to-r ${accentColor}`}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DrinkQuiz({ onSelectCategory }: DrinkQuizProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [chosenAnswers, setChosenAnswers] = useState<number[]>([]); // answer idx per question
  const [results, setResults] = useState<ReturnType<typeof scoreProfiles>>([]);
  const [isExiting, setIsExiting] = useState(false);

  const handleStart = () => {
    setPhase('quiz');
    setCurrentQ(0);
    setSelectedTags([]);
    setChosenAnswers([]);
  };

  const handleAnswer = useCallback((answer: Answer, answerIdx: number) => {
    const newTags = [...selectedTags, ...answer.tags];
    const newAnswers = [...chosenAnswers, answerIdx];

    if (currentQ < QUESTIONS.length - 1) {
      setIsExiting(true);
      setTimeout(() => {
        setSelectedTags(newTags);
        setChosenAnswers(newAnswers);
        setCurrentQ(q => q + 1);
        setIsExiting(false);
      }, 250);
    } else {
      setSelectedTags(newTags);
      setChosenAnswers(newAnswers);
      const scored = scoreProfiles(newTags);
      setResults(scored);
      setPhase('results');
    }
  }, [currentQ, selectedTags, chosenAnswers]);

  const handleReset = () => {
    setPhase('intro');
    setCurrentQ(0);
    setSelectedTags([]);
    setChosenAnswers([]);
    setResults([]);
  };

  const handleGoToMenu = (category: string) => {
    if (onSelectCategory) {
      // In-page: switch tab directly, no navigation needed
      onSelectCategory(category);
      // Scroll category tabs into view
      setTimeout(() => {
        const el = document.getElementById(`cat-tab-${category.replace(/\s+/g, '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        // Also scroll the tab row itself into viewport
        document.getElementById('menu-category-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      // Navigate to menu page with quiz_category param
      router.push(`/menu?quiz_category=${encodeURIComponent(category)}`);
    }
  };

  const top3 = results.slice(0, 3);
  const progressPct = ((currentQ) / QUESTIONS.length) * 100;

  return (
    <section
      id="drink-quiz"
      className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-[80px]" />
        {/* Retro dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Which Drink Are You?</h2>
        </div>

        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-xl">
                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-8 sm:p-12 text-center">
                  {/* Animated emoji stack */}
                  <div className="flex justify-center gap-4 mb-8">
                    {['☕', '🧋', '🍓', '🥭', '🧇'].map((emoji, i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: 'easeInOut',
                        }}
                        className="text-3xl sm:text-4xl select-none"
                      >
                        {emoji}
                      </motion.div>
                    ))}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black mb-4 text-foreground">
                    The Retro Spot Personality Quiz
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto mb-10">
                    5 questions. Zero wrong answers. We'll tell you exactly which menu item was made for your soul.
                  </p>

                  <button
                    id="quiz-start-btn"
                    onClick={handleStart}
                    className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer"
                  >
                    <Zap size={20} />
                    Let's Find Out
                    <ChevronRight size={20} />
                  </button>

                  <p className="mt-6 text-sm text-muted-foreground">Takes about 30 seconds ✦ No commitment required</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === 'quiz' && !isExiting && (
            <motion.div
              key={`question-${currentQ}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-xl">
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: `${progressPct}%` }}
                    animate={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <div className="p-6 sm:p-10">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      Question {currentQ + 1} of {QUESTIONS.length}
                    </span>
                    <div className="flex gap-1.5">
                      {QUESTIONS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i <= currentQ ? 'bg-primary w-6' : 'bg-border w-3'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-8">
                    <div className="text-5xl mb-4 select-none">{QUESTIONS[currentQ].emoji}</div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                      {QUESTIONS[currentQ].question}
                    </h3>
                  </div>

                  {/* Answer grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUESTIONS[currentQ].answers.map((answer, idx) => (
                      <motion.button
                        key={idx}
                        id={`quiz-answer-q${currentQ + 1}-${idx + 1}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(answer, idx)}
                        className="text-left px-5 py-4 rounded-2xl border-2 border-border bg-surface-elevated hover:border-primary hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10 transition-all duration-200 cursor-pointer group"
                      >
                        <span className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {answer.text}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Top match — hero card */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative rounded-3xl overflow-hidden border-2 border-primary/40 bg-surface shadow-2xl shadow-primary/10 mb-6"
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${top3[0].profile.accentColor}`} />

                  <div className="p-6 sm:p-10">
                    {/* Crown badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                      <Sparkles size={12} />
                      Your Spirit Drink
                    </div>

                    <div className="flex items-start gap-6">
                      <div
                        className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${top3[0].profile.accentColor} flex items-center justify-center text-4xl shadow-lg`}
                      >
                        {top3[0].profile.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-foreground mb-1">
                          {top3[0].profile.name}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          {top3[0].profile.description}
                        </p>
                        <MatchBar pct={top3[0].pct} accentColor={top3[0].profile.accentColor} delay={0.4} />
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Match</span>
                          <span className="text-sm font-black text-primary">{top3[0].pct}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="quiz-result-cta-primary"
                      onClick={() => handleGoToMenu(top3[0].profile.category)}
                      className={`mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r ${top3[0].profile.accentColor} text-white font-black text-base shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2`}
                    >
                      Order {top3[0].profile.name} Now
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Runner-ups */}
              {top3.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {top3.slice(1).map((result, i) => (
                    <motion.div
                      key={result.profile.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.1 }}
                      className="rounded-2xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => handleGoToMenu(result.profile.category)}
                      id={`quiz-result-runner-${i + 2}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${result.profile.accentColor} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}
                        >
                          {result.profile.emoji}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                            #{i + 2} Match
                          </p>
                          <h4 className="font-black text-foreground leading-tight group-hover:text-primary transition-colors">
                            {result.profile.name}
                          </h4>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {result.profile.description}
                      </p>
                      <MatchBar pct={result.pct} accentColor={result.profile.accentColor} delay={0.5 + i * 0.1} />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs font-black text-muted-foreground">{result.pct}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Play again */}
              <div className="text-center">
                <button
                  id="quiz-play-again"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl border-2 border-border text-muted-foreground font-bold hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  <RotateCcw size={16} />
                  Play Again
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
