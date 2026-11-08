export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface SpiritualQuestion {
  id: string;
  ladderLevel: number; // 1 to 11 (or 0 for pool questions)
  question: string;
  options: QuestionOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging' | 'Expert' | 'Supreme';
  supportingReference?: string;
}

export interface FffItem {
  id: string;
  text: string;
  orderIndex: number; // 1 to 4 correct chronological/procedural sequence
}

export interface FffQuestion {
  id: string;
  question: string;
  instruction: string;
  items: FffItem[]; // The 4 items
  correctOrder: string[]; // array of item IDs in correct sequence
  explanation: string;
  category: string;
}

export const INITIAL_FFF_QUESTIONS: FffQuestion[] = [
  {
    id: 'fff-1',
    question: 'Arrange the following Tirthankaras in chronological order from earliest to latest:',
    instruction: 'Arrange from 1st to 24th in lineage',
    items: [
      { id: 't1', text: 'Bhagwan Rishabhdev (Adinath)', orderIndex: 1 },
      { id: 't2', text: 'Bhagwan Shantinath (16th)', orderIndex: 2 },
      { id: 't3', text: 'Bhagwan Parshvanath (23rd)', orderIndex: 3 },
      { id: 't4', text: 'Bhagwan Mahavira (24th)', orderIndex: 4 },
    ],
    correctOrder: ['t1', 't2', 't3', 't4'],
    explanation: 'Bhagwan Rishabhdev was the 1st Tirthankara, Shantinath was the 16th, Parshvanath the 23rd, and Mahavira the 24th.',
    category: 'Tirthankara Lineage',
  },
  {
    id: 'fff-2',
    question: 'Arrange the five supreme entities of Navkar Mantra in traditional veneration order:',
    instruction: 'Arrange in the exact order recited in Navkar Mantra',
    items: [
      { id: 'n1', text: 'Arihants (Omniscient Supreme Beings)', orderIndex: 1 },
      { id: 'n2', text: 'Siddhas (Liberated Souls)', orderIndex: 2 },
      { id: 'n3', text: 'Acharyas (Spiritual Leaders)', orderIndex: 3 },
      { id: 'n4', text: 'Upadhyayas (Spiritual Teachers)', orderIndex: 4 },
    ],
    correctOrder: ['n1', 'n2', 'n3', 'n4'],
    explanation: 'Namo Arihantanam (1), Namo Siddhanam (2), Namo Ayariyanam (3), Namo Uvajjhayanam (4), Namo Loe Savva Sahunam (5).',
    category: 'Sacred Mantras',
  },
  {
    id: 'fff-3',
    question: 'Arrange these spiritual Jain festivals across the annual calendar (earliest to latest in year):',
    instruction: 'Arrange by traditional seasonal calendar progression',
    items: [
      { id: 'f1', text: 'Mahavir Janma Kalyanak (Chaitra Sud Teras)', orderIndex: 1 },
      { id: 'f2', text: 'Akshaya Tritiya (Varshitap Parna - Vaishakh Sud Teej)', orderIndex: 2 },
      { id: 'f3', text: 'Paryushan Mahaparva (Bhadrapad)', orderIndex: 3 },
      { id: 'f4', text: 'Diwali (Nirvana Kalyanak - Kartik Vad Amavasya)', orderIndex: 4 },
    ],
    correctOrder: ['f1', 'f2', 'f3', 'f4'],
    explanation: 'Mahavir Janma Kalyanak falls in spring (Chaitra), Akshaya Tritiya in Vaishakh, Paryushan in Bhadrapad, and Diwali Nirvana in Kartik.',
    category: 'Festivals & Parvas',
  },
];

export const INITIAL_QUESTIONS: SpiritualQuestion[] = [
  {
    id: 'q-1',
    ladderLevel: 1,
    question: 'What is the auspicious symbol on the palm of the Jain emblem representing non-violence called?',
    options: [
      { id: 'A', text: 'Ahimsa (With Dharma Chakra)' },
      { id: 'B', text: 'Triratna' },
      { id: 'C', text: 'Nandavarta' },
      { id: 'D', text: 'Srivatsa' },
    ],
    correctOption: 'A',
    explanation: 'The open palm represents blessing and fearlessness (Abhayadana), with the sacred word "Ahimsa" inside the 24-spoked wheel of Dharma.',
    category: 'Sacred Symbols',
    difficulty: 'Easy',
    supportingReference: 'Jain Prateek Chinha, 1974 Universal Convention',
  },
  {
    id: 'q-2',
    ladderLevel: 2,
    question: 'In the sacred Jain Navkar Mantra, how many supreme Pancha Parameshti are reverently bowed to?',
    options: [
      { id: 'A', text: 'Three (Triratna)' },
      { id: 'B', text: 'Four (Chaturvidha Sangh)' },
      { id: 'C', text: 'Five (Pancha Parameshti)' },
      { id: 'D', text: 'Seven (Sapta Tattva)' },
    ],
    correctOption: 'C',
    explanation: 'The five Parameshtis are Arihant, Siddha, Acharya, Upadhyaya, and Sadhu (all monks and spiritual ascetics).',
    category: 'Sacred Mantras',
    difficulty: 'Easy',
    supportingReference: 'Shri Navkar Mahamantra',
  },
  {
    id: 'q-3',
    ladderLevel: 3, // MILESTONE 1 - 10,000 Samvar Points
    question: 'Which of the following represents the foundational First Vow (Pratham Mahavrata) among the Five Great Vows?',
    options: [
      { id: 'A', text: 'Satya (Truthfulness)' },
      { id: 'B', text: 'Ahimsa (Absolute Non-Violence)' },
      { id: 'C', text: 'Asteya (Non-Stealing)' },
      { id: 'D', text: 'Aparigraha (Non-Possessiveness)' },
    ],
    correctOption: 'B',
    explanation: 'Ahimsa is the paramount supreme vow in Jainism. "Ahimsa Paramo Dharmah" — non-violence in thought, word, and deed to all living beings.',
    category: 'Vows & Philosophy',
    difficulty: 'Easy',
    supportingReference: 'Acharanga Sutra',
  },
  {
    id: 'q-4',
    ladderLevel: 4,
    question: 'At which sacred holy hill did Bhagwan Rishabhdev (Adinath Bhagwan) attain Moksha (Supreme Nirvana)?',
    options: [
      { id: 'A', text: 'Ashtapad Mahatirth' },
      { id: 'B', text: 'Sammet Shikharji' },
      { id: 'C', text: 'Girnarji Mahatirth' },
      { id: 'D', text: 'Pavapuri Tirth' },
    ],
    correctOption: 'A',
    explanation: 'Bhagwan Rishabhdev attained Nirvana on Mount Ashtapad (Kailash) in the Himalayas.',
    category: 'Sacred Tirthas',
    difficulty: 'Medium',
    supportingReference: 'Trishashti Shalaka Purusha Charitra',
  },
  {
    id: 'q-5',
    ladderLevel: 5,
    question: 'How many total Tirthankaras attained Supreme Nirvana from the holiest pilgrimage site of Shri Sammet Shikharji?',
    options: [
      { id: 'A', text: '16 Tirthankaras' },
      { id: 'B', text: '18 Tirthankaras' },
      { id: 'C', text: '20 Tirthankaras' },
      { id: 'D', text: '24 Tirthankaras' },
    ],
    correctOption: 'C',
    explanation: 'Out of 24 Tirthankaras, exactly 20 attained Moksha at Sammet Shikharji. The 4 exceptions are Rishabhdev (Ashtapad), Vasupujya Swami (Champapuri), Neminath (Girnar), and Mahavira (Pavapuri).',
    category: 'Sacred Tirthas',
    difficulty: 'Medium',
    supportingReference: 'Tirthankara Kalyanaka Charitra',
  },
  {
    id: 'q-6',
    ladderLevel: 6,
    question: 'In Jain metaphysics, what is the precise process of blocking and halting the influx of fresh Karmic matter into the soul called?',
    options: [
      { id: 'A', text: 'Asrava' },
      { id: 'B', text: 'Bandha' },
      { id: 'C', text: 'Samvar' },
      { id: 'D', text: 'Nirjara' },
    ],
    correctOption: 'C',
    explanation: 'Samvar is the spiritual shielding and stopping of the inflow of Karma (Asrava) into the soul through self-restraint and mindfulness.',
    category: 'Karmic Philosophy',
    difficulty: 'Medium',
    supportingReference: 'Tattvartha Sutra, Chapter 9',
  },
  {
    id: 'q-7',
    ladderLevel: 7,
    question: 'Which celebrated Jain philosophical doctrine establishes that reality is multi-faceted and truth possesses multiple legitimate viewpoints?',
    options: [
      { id: 'A', text: 'Anekantavada & Syadvada' },
      { id: 'B', text: 'Adwaitavada' },
      { id: 'C', text: 'Kshanikavada' },
      { id: 'D', text: 'Pravachanavada' },
    ],
    correctOption: 'A',
    explanation: 'Anekantavada teaches the multi-sidedness of truth and cosmic reality, showing compassion and intellectual humility toward all perspectives.',
    category: 'Metaphysics & Epistemology',
    difficulty: 'Challenging',
    supportingReference: 'Siddhasena Divakara, Sanmati Tarka',
  },
  {
    id: 'q-8',
    ladderLevel: 8, // MILESTONE 2 - 25 Lakh Samvar Points
    question: 'How many total qualities (Gunas) collectively define the Five Supreme Beings (Pancha Parameshti) in Jain philosophy?',
    options: [
      { id: 'A', text: '84 Gunas' },
      { id: 'B', text: '108 Gunas' },
      { id: 'C', text: '124 Gunas' },
      { id: 'D', text: '144 Gunas' },
    ],
    correctOption: 'B',
    explanation: 'There are 108 Gunas: Arihant (12), Siddha (8), Acharya (36), Upadhyaya (25), and Sadhu (27) — total 108, which is why a Japamala has 108 beads.',
    category: 'Pancha Parameshti',
    difficulty: 'Challenging',
    supportingReference: 'Panchodhyaya & Navkar Aradhana Granth',
  },
  {
    id: 'q-9',
    ladderLevel: 9,
    question: 'In the sacred universal universal language of ancient Jain Agamas, in which Prakrit dialect were the primary teachings of Bhagwan Mahavira preserved?',
    options: [
      { id: 'A', text: 'Ardhamagadhi Prakrit' },
      { id: 'B', text: 'Sauraseni Prakrit' },
      { id: 'C', text: 'Classical Sanskrit' },
      { id: 'D', text: 'Magadhi Apabhramsha' },
    ],
    correctOption: 'A',
    explanation: 'Bhagwan Mahavira preached in Ardhamagadhi, the compassionate language of the masses, accessible to all living beings during the Samavasarana.',
    category: 'Sacred Agamas',
    difficulty: 'Challenging',
    supportingReference: 'Agama Literature & Vyakarana',
  },
  {
    id: 'q-10',
    ladderLevel: 10,
    question: 'How many Gunasthanakas (spiritual developmental stages of the soul from delusion to liberation) exist in Jain spiritual psychology?',
    options: [
      { id: 'A', text: '10 Stages' },
      { id: 'B', text: '12 Stages' },
      { id: 'C', text: '14 Stages' },
      { id: 'D', text: '18 Stages' },
    ],
    correctOption: 'C',
    explanation: 'Jain psychology delineates 14 Gunasthanakas, starting from Mithyadrishti (1st stage: spiritual blindness) to Ayoga Kevali (14th stage) before supreme Siddha liberation.',
    category: 'Soul Evolution',
    difficulty: 'Expert',
    supportingReference: 'Gommatsara Jiva Kanda',
  },
  {
    id: 'q-11',
    ladderLevel: 11, // THE 7 CRORE SAMVAR POINTS QUESTION
    question: 'According to Acharya Umasvati’s immortal aphorism in the revered Tattvartha Sutra, what constitutes the complete, unified pathway to Moksha (Libertarian Liberation)?',
    options: [
      { id: 'A', text: 'Samyag Darshan, Samyag Jnana, Samyag Charitra (Unified Trinity)' },
      { id: 'B', text: 'Rigorous Tapasya (Austerities) alone' },
      { id: 'C', text: 'Dhyana (Deep Meditation) alone' },
      { id: 'D', text: 'Study of all 45 Agamas alone' },
    ],
    correctOption: 'A',
    explanation: 'Tattvartha Sutra 1.1 proclaims: "Samyag-darshana-jnana-charitrani mokshamargah" — Right Faith, Right Knowledge, and Right Conduct together constitute the singular, indivisible path to liberation.',
    category: 'Supreme Philosophy',
    difficulty: 'Supreme',
    supportingReference: 'Tattvartha Sutra 1.1 (Moksha Margah)',
  },
];

export const EXTRA_BANK_QUESTIONS: SpiritualQuestion[] = [
  {
    id: 'bank-1',
    ladderLevel: 0,
    question: 'On which auspicious riverbank did Bhagwan Mahavira attain Supreme Omniscient Knowledge (Kevala Jnana)?',
    options: [
      { id: 'A', text: 'Rijubalika River' },
      { id: 'B', text: 'Ganges River' },
      { id: 'C', text: 'Yamuna River' },
      { id: 'D', text: 'Narmada River' },
    ],
    correctOption: 'A',
    explanation: 'Under a Saal tree near the bank of Rijubalika river outside the village of Jrimbhikagrama, Mahavira Bhagwan attained Keval Jnana on Vaishakh Shukla Dashami.',
    category: 'Tirthankara Life',
    difficulty: 'Challenging',
  },
  {
    id: 'bank-2',
    ladderLevel: 0,
    question: 'What is the holy universal forgiveness aphorism recited at the culmination of Samvatsari during Paryushan?',
    options: [
      { id: 'A', text: 'Micchami Dukkadam' },
      { id: 'B', text: 'Om Shanti' },
      { id: 'C', text: 'Namaskar' },
      { id: 'D', text: 'Mangalam Bhagwan Viro' },
    ],
    correctOption: 'A',
    explanation: '"Micchami Dukkadam" means "May all the evil or hurt that has been caused by me knowingly or unknowingly be forgiven and rendered fruitless."',
    category: 'Forgiveness & Pratikramana',
    difficulty: 'Easy',
  },
  {
    id: 'bank-3',
    ladderLevel: 0,
    question: 'In the Ratnatraya philosophy, how many Anuvratas (minor vows) are prescribed for a Jain householder (Shravaka)?',
    options: [
      { id: 'A', text: '5 Anuvratas' },
      { id: 'B', text: '7 Anuvratas' },
      { id: 'C', text: '10 Anuvratas' },
      { id: 'D', text: '12 Vows (5 Anuvratas + 3 Gunavratas + 4 Shikshavratas)' },
    ],
    correctOption: 'A',
    explanation: 'A householder undertakes 5 Anuvratas (partial non-violence, truth, non-stealing, chastity/fidelity, non-possessiveness).',
    category: 'Shravaka Dharma',
    difficulty: 'Medium',
  },
];
