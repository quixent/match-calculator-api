import Question from './models/Question';

const questions = [
  {
    order: 1,
    text: 'How do you prefer to spend your weekends?',
    options: [
      { text: 'Outdoor activities', weight: 3 },
      { text: 'Staying home and relaxing', weight: 3 },
      { text: 'Social gatherings', weight: 2 },
      { text: 'Travelling', weight: 2 },
    ],
  },
  {
    order: 2,
    text: 'What is your ideal relationship style?',
    options: [
      { text: 'Very close and always together', weight: 3 },
      { text: 'Independent but connected', weight: 3 },
      { text: 'Casual and relaxed', weight: 2 },
      { text: 'Still figuring out', weight: 1 },
    ],
  },
  {
    order: 3,
    text: 'How important is family to you?',
    options: [
      { text: 'Extremely important', weight: 3 },
      { text: 'Important but balanced', weight: 3 },
      { text: 'Somewhat important', weight: 2 },
      { text: 'Not a priority', weight: 1 },
    ],
  },
  {
    order: 4,
    text: 'How do you handle conflicts?',
    options: [
      { text: 'Talk it out immediately', weight: 3 },
      { text: 'Take time to cool down then talk', weight: 3 },
      { text: 'Avoid conflict as much as possible', weight: 1 },
      { text: 'Depends on the situation', weight: 2 },
    ],
  },
  {
    order: 5,
    text: 'What are your future goals?',
    options: [
      { text: 'Marriage and family', weight: 3 },
      { text: 'Career focused', weight: 2 },
      { text: 'Travel and experiences', weight: 2 },
      { text: 'Still exploring', weight: 1 },
    ],
  },
];

export const seedQuestions = async (): Promise<void> => {
  const count = await Question.countDocuments();
  if (count > 0) return;
  await Question.insertMany(questions);
  console.log('✅ Questions seeded');
};
