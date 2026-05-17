'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RotateCcw, ChevronRight, Zap } from 'lucide-react';
import styles from './DrinkQuiz.module.css';

interface DrinkQuizProps {
  onSelectCategory?: (category: string) => void;
}

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
  category: string;
  accentColor: string;
}

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

const DRINK_PROFILES: DrinkProfile[] = [
  {
    name: 'Frappe Lotus',
    emoji: '🍪',
    description: "Indulgent, iconic, impossible to resist. You walk into a room and own it.",
    tags: ['frozen', 'creamy', 'sweet', 'indulgent', 'bold', 'cold'],
    category: 'Frappe',
    accentColor: '#F59E0B',
  },
  {
    name: 'Frappe Pistachio',
    emoji: '🌿',
    description: "Sophisticated with a twist. You appreciate the finer things in a very chill way.",
    tags: ['frozen', 'nutty', 'creamy', 'exotic', 'sweet', 'cold'],
    category: 'Frappe',
    accentColor: '#10B981',
  },
  {
    name: 'Frappe Nutella',
    emoji: '🍫',
    description: "Rich, generous, unapologetically chocolatey. People love being around you.",
    tags: ['frozen', 'chocolate', 'creamy', 'indulgent', 'sweet', 'rich'],
    category: 'Frappe',
    accentColor: '#B45309',
  },
  {
    name: 'Mango Smoothie',
    emoji: '🥭',
    description: "Tropical, bright, effortlessly joyful. You're the sunshine of the group.",
    tags: ['fresh', 'fruit', 'sweet', 'exotic', 'refreshing', 'energizing'],
    category: 'Smoothie',
    accentColor: '#FBBF24',
  },
  {
    name: 'Strawberry Smoothie',
    emoji: '🍓',
    description: "Sweet and bold with a tangy edge. You keep things real, always.",
    tags: ['fruit', 'fresh', 'tangy', 'sweet', 'refreshing', 'light'],
    category: 'Smoothie',
    accentColor: '#F87171',
  },
  {
    name: 'Passion Fruit Smoothie',
    emoji: '🌺',
    description: "Exotic, complex, one of a kind. You don't follow trends — you start them.",
    tags: ['exotic', 'fruit', 'tangy', 'refreshing', 'bold', 'energizing'],
    category: 'Smoothie',
    accentColor: '#A855F7',
  },
  {
    name: 'Karak Tea',
    emoji: '☕',
    description: "Warm, spiced, deeply comforting. You are the friend everyone calls at midnight.",
    tags: ['hot', 'relaxing', 'bold', 'rich', 'energizing', 'creamy'],
    category: 'Tea & Herbs',
    accentColor: '#D97706',
  },
  {
    name: 'Mint Tea',
    emoji: '🌿',
    description: "Cool-headed, crisp, and refreshing. You bring clarity to every situation.",
    tags: ['hot', 'herbal', 'light', 'refreshing', 'relaxing', 'fresh'],
    category: 'Tea & Herbs',
    accentColor: '#34D399',
  },
  {
    name: 'Avocado Juice',
    emoji: '🥑',
    description: "Creamy, health-conscious, quietly luxurious. Understated royalty.",
    tags: ['fresh', 'creamy', 'rich', 'light', 'relaxing', 'exotic'],
    category: 'Fresh Juice',
    accentColor: '#16A34A',
  },
  {
    name: 'Orange Juice',
    emoji: '🍊',
    description: "A classic for a reason. Energizing, honest, and always a good idea.",
    tags: ['fresh', 'fruit', 'energizing', 'tangy', 'refreshing', 'light'],
    category: 'Fresh Juice',
    accentColor: '#FB923C',
  },
  {
    name: 'Nutella Waffle',
    emoji: '🧇',
    description: "Pure indulgence on a plate. You live life like every day is a celebration.",
    tags: ['sweet', 'chocolate', 'indulgent', 'dessert', 'waffle', 'rich'],
    category: 'Waffle Corner',
    accentColor: '#92400E',
  },
  {
    name: 'Pistachio Waffle',
    emoji: '🥜',
    description: "A rare blend of elegance and warmth. Sweet tooth meets refined taste.",
    tags: ['sweet', 'nutty', 'indulgent', 'dessert', 'waffle', 'creamy'],
    category: 'Waffle Corner',
    accentColor: '#059669',
  },
  {
    name: 'Ice Cream 3 Scoop',
    emoji: '🍦',
    description: "Triple the fun, zero regrets. You make everything more fun just by being there.",
    tags: ['cold', 'sweet', 'dessert', 'icecream', 'indulgent', 'creamy'],
    category: 'Ice Cream',
    accentColor: '#F472B6',
  },
  {
    name: 'Honey Yogurt',
    emoji: '🍯',
    description: "Balanced, thoughtful, quietly sweet. You're the one who actually has it together.",
    tags: ['light', 'sweet', 'fresh', 'yogurt', 'relaxing', 'creamy'],
    category: 'Yogurt Corner',
    accentColor: '#FBBF24',
  },
];

function scoreProfiles(selectedTags: Tag[]): { profile: DrinkProfile; score: number; pct: number }[] {
  const tagCounts: Record<string, number> = {};
  selectedTags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

  const results = DRINK_PROFILES.map(profile => {
    let score = 0;
    profile.tags.forEach(tag => {
      if (tagCounts[tag]) score += tagCounts[tag] * 2;
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

const MatchBar = ({ pct, accentColor }: { pct: number; accentColor: string; }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className={styles.matchBarBg}>
      <div 
        className={styles.matchBarFill} 
        style={{ width: `${width}%`, backgroundColor: accentColor }}
      />
    </div>
  );
};

export default function DrinkQuiz({ onSelectCategory }: DrinkQuizProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [results, setResults] = useState<ReturnType<typeof scoreProfiles>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStart = () => {
    setPhase('quiz');
    setCurrentQ(0);
    setSelectedTags([]);
  };

  const handleAnswer = useCallback((answer: Answer) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const newTags = [...selectedTags, ...answer.tags];

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => {
        setSelectedTags(newTags);
        setCurrentQ(q => q + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      setSelectedTags(newTags);
      const scored = scoreProfiles(newTags);
      setResults(scored);
      setPhase('results');
      setIsAnimating(false);
    }
  }, [currentQ, selectedTags, isAnimating]);

  const handleReset = () => {
    setPhase('intro');
    setCurrentQ(0);
    setSelectedTags([]);
    setResults([]);
  };

  const handleGoToMenu = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      router.push(`/menu?quiz_category=${encodeURIComponent(category)}`);
    }
  };

  const top3 = results.slice(0, 3);
  const progressPct = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Sparkles size={28} />
        </div>
        <h2 className={styles.title}>Which Drink Are You?</h2>
      </div>

      {phase === 'intro' && (
        <div className={styles.card}>
          <div className={styles.topAccent} />
          <div className={styles.content}>
            <div className={styles.emojis}>
              <span className={styles.emoji}>☕</span>
              <span className={styles.emoji}>🧋</span>
              <span className={styles.emoji}>🍓</span>
              <span className={styles.emoji}>🥭</span>
              <span className={styles.emoji}>🧇</span>
            </div>
            <h3 className={styles.subtitle}>The Retro Spot Personality Quiz</h3>
            <p className={styles.desc}>
              5 questions. Zero wrong answers. We'll tell you exactly which menu item was made for your soul.
            </p>
            <button onClick={handleStart} className={styles.startBtn}>
              <Zap size={20} />
              Let's Find Out
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {phase === 'quiz' && (
        <div className={styles.card} style={{ opacity: isAnimating ? 0 : 1, transition: 'opacity 0.3s' }}>
          <div className={styles.progressBg}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={styles.content}>
            <div className={styles.stepWrap}>
              <span className={styles.stepText}>Question {currentQ + 1} of {QUESTIONS.length}</span>
            </div>
            
            <div className={styles.questionWrap}>
              <div className={styles.qEmoji}>{QUESTIONS[currentQ].emoji}</div>
              <h3 className={styles.question}>{QUESTIONS[currentQ].question}</h3>
            </div>

            <div className={styles.grid}>
              {QUESTIONS[currentQ].answers.map((answer, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(answer)}
                  className={styles.answerBtn}
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div>
          {top3[0] && (
            <div className={styles.resultCard}>
              <div className={styles.topAccent} style={{ backgroundColor: top3[0].profile.accentColor }} />
              <div className={styles.content} style={{ textAlign: 'left' }}>
                <div className={styles.resultBadge}>
                  <Sparkles size={12} /> Your Spirit Drink
                </div>
                
                <div className={styles.resultContent}>
                  <div className={styles.resultEmoji} style={{ backgroundColor: top3[0].profile.accentColor }}>
                    {top3[0].profile.emoji}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h3 className={styles.resultName}>{top3[0].profile.name}</h3>
                    <p className={styles.resultDesc}>{top3[0].profile.description}</p>
                    <MatchBar pct={top3[0].pct} accentColor={top3[0].profile.accentColor} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--muted)', textTransform: 'uppercase' }}>Match</span>
                      <span style={{ color: top3[0].profile.accentColor }}>{top3[0].pct}%</span>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.orderBtn} 
                  style={{ backgroundColor: top3[0].profile.accentColor }}
                  onClick={() => handleGoToMenu(top3[0].profile.category)}
                >
                  Order {top3[0].profile.name} Now
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {top3.length > 1 && (
            <div className={styles.runnerUpGrid}>
              {top3.slice(1).map((result, i) => (
                <div 
                  key={result.profile.name} 
                  className={styles.runnerUpCard}
                  onClick={() => handleGoToMenu(result.profile.category)}
                  style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                >
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div className={styles.resultEmoji} style={{ width: '48px', height: '48px', fontSize: '24px', backgroundColor: result.profile.accentColor }}>
                      {result.profile.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>#{i + 2} Match</div>
                      <div style={{ fontWeight: 700, fontSize: '16px' }}>{result.profile.name}</div>
                    </div>
                  </div>
                  <p className={styles.resultDesc} style={{ marginBottom: '8px', fontSize: '12px' }}>{result.profile.description}</p>
                  <MatchBar pct={result.pct} accentColor={result.profile.accentColor} />
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button onClick={handleReset} className={styles.restartBtn}>
              <RotateCcw size={16} /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
