// ==============================
// Compass Question Bank (Flattened)
// ==============================

export const questionBank = {
  profile: [
    { id: 'name', prompt: 'What is your name?', type: 'text' },
    { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
    { id: 'role', prompt: 'What is your current job title?', type: 'text' },
    {
      id: 'responsibilities',
      prompt: 'Briefly describe what your team is responsible for within the organization.',
      type: 'text',
    },
    {
      id: 'teamSize',
      prompt: 'How many people do you directly manage?',
      type: 'slider',
      min: 1,
      max: 10,
      labels: { 1: '1', 10: '10+' },
    },
    {
      id: 'leadershipExperience',
      prompt: 'How many years have you been in your current role?',
      type: 'slider',
      min: 0,
      max: 10,
      labels: { 0: '<1', 10: '10+' },
    },
    {
      id: 'careerExperience',
      prompt: 'How many years have you been in a leadership role?',
      type: 'slider',
      min: 0,
      max: 20,
      labels: { 0: '<1', 20: '20+' },
    },
  ],

  behaviors: [
    {
      id: 'resourcePick',
      theme: 'The Quick Pick',
      prompt: 'If you had to pick one resource to make your leadership life easier, what would it be?',
      type: 'radio',
      options: [
        'More time in the day to focus on priorities',
        'A larger budget to work with',
        'A mentor to guide your decision-making',
        "A team that just 'gets it'",
        'A dedicated time/space for reflection and planning',
        'A high performer to share the load',
      ],
    },
    {
      id: 'coffeeImpression',
      theme: 'The Coffee Break',
      prompt: "You're grabbing coffee with your team. What's the impression you try to leave with them?",
      type: 'radio',
      options: [
        'They really listen to us.',
        "They've got everything under control.",
        'They make us want to step up.',
        'They make our team better.',
        "They're always thinking ahead.",
        'They hold a high bar for us.',
        'They trust us to deliver.',
      ],
    },
    {
      id: 'projectApproach',
      theme: 'The Team Puzzle',
      prompt: "You're given a complex project with a tight deadline. Choose the action you'd most likely take first",
      type: 'radio',
      options: [
        'Create a detailed plan to guide the team.',
        'Dive into the most challenging aspect to lead by example.',
        'Gather the team for a collaborative brainstorming session.',
        'Focus on identifying and mitigating the biggest risks.',
        'Distribute tasks to the team and set clear check-in points.',
      ],
    },
    {
      id: 'energyDrains',
      theme: 'The Energy Drain',
      prompt: 'Which three situations would you most prefer to minimize throughout the day?',
      type: 'multi-select',
      limit: 3,
      options: [
        'Repeating myself to ensure understanding',
        "Addressing a team member's inconsistent contributions",
        'Decoding unspoken concerns from the team',
        'Navigating frequent changes in priorities',
        'Meetings with limited or no outcomes',
        'Mediating conflicts within the team',
        'Pursuing goals that lack clear direction',
        'Balancing expectations from high-pressure stakeholders',
      ],
    },
    {
      id: 'crisisResponse',
      theme: 'The Fire Drill',
      prompt: 'A crisis hits your team unexpectedly. Rank these responses based on how they reflect your approach:',
      type: 'ranking',
      options: [
        'I stay calm and provide clear direction.',
        'I rally everyone to brainstorm solutions.',
        'I focus on verifying details to ensure accuracy.',
        'I empower the team to take the lead while I support.',
        'I take a hands-on role to address the issue quickly.',
      ],
      scale: { top: 'like me', bottom: 'like me' },
    },
    {
      id: 'pushbackFeeling',
      theme: 'The Pushback Moment',
      prompt:
        'A team member disagrees with your plan in front of everyone. In your gut, how do you feel at that moment? Write one sentence about it.',
      type: 'text',
    },
    {
      id: 'roleModelTrait',
      theme: 'The Role Model',
      prompt:
        'Think of a leader you admire (real or fictional). Pick two things they do that you wish came more naturally to you.',
      type: 'multi-select',
      limit: 2,
      options: [
        'Connecting with people effortlessly',
        'Making tough decisions without hesitation',
        'Staying calm under pressure',
        'Painting a clear vision for the future',
        'Getting the best out of everyone',
        'Explaining complex ideas simply',
        'Knowing when to step back and listen',
      ],
    },
    {
      id: 'successMetric',
      theme: 'The Impact Check',
      prompt: "Picture yourself after the end of a long week. How do you know if you've been successful in your role?",
      type: 'radio',
      options: [
        "The team's buzzing with energy and momentum.",
        'We hit our big goals or deadlines.',
        'Team members stepped up with their own ideas.',
        'I cleared roadblocks that were holding us back.',
        'Collaboration was smooth and drama-free.',
        'Someone acknowledged the progress we made.',
      ],
    },
    {
      id: 'warningLabel',
      theme: 'The Warning Label',
      prompt: 'If your leadership style had a "warning label," what would it be?',
      type: 'radio',
      options: [
        'Caution: May overthink the details.',
        'Warning: Moves fast—keep up!',
        'Buckle up, we change directions quickly here.',
        'Flammable: Sparks fly under pressure.',
        'Fragile: Avoid too much pushback.',
        'High voltage: Big ideas ahead.',
      ],
    },
    {
      id: 'leaderFuel',
      theme: "The Leader's Fuel",
      prompt: 'Rank the following outcomes that energize you most.',
      type: 'ranking',
      options: [
        'Seeing the team gel and succeed together',
        'Nailing a tough project on time',
        'Solving a problem no one else could',
        'Hearing the team say they learned something',
        'My team getting the recognition it deserves',
        'Turning chaos into order',
      ],
    },
    {
      id: 'proudMoment',
      theme: 'The Highlight Reel',
      prompt: 'Provide an example of one of your proudest moments as a leader:',
      type: 'text',
    },
    {
      id: 'selfReflection',
      theme: 'The Mirror',
      prompt: 'Be honest with yourself. What do you need to work on?',
      type: 'text',
    },
  ],

  mindset: [
    "When challenges arise, I determine the solution from my experience and expertise.",
    "I am careful to acknowledge and admit my mistakes to my team.",
    "I communicate the long-term vision to the company often and in different ways.",
    "I consistently dialogue with employees about their lives to demonstrate that I care about them.",
    "I empower my immediate team to do their jobs without handholding.",
    "I vocally encourage employees to reserve time for creativity or process improvement within their role.",
    "I am intentional about hiring employees that equally fit the need and the company culture and values.",
    "I talk about the vision and purpose of the company at every team and company gathering.",
    "I consistently expresses detailed gratitude for both high AND low performing employees.",
    "I hand projects over to others and trust them to have equal or greater success than I would doing it myself.",
  ],

  agents: [
    { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend', description: 'A straightforward friend who gives no-nonsense, practical advice with a critical edge.' },
    { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach', description: 'A professional coach who delivers polished, supportive feedback with visionary ideas.' },
    { id: 'balancedMentor', name: 'Balanced Mentor', description: 'A mentor who blends practical and inspirational advice.' },
    { id: 'comedyRoaster', name: 'Comedy Roaster', description: 'Humorous but sharp, with actionable advice.' },
    { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver', description: 'Solution-first, simple steps. No fluff.' },
    { id: 'highSchoolCoach', name: 'High School Coach', description: 'Encouraging with practical actions.' },
  ],
};

// ---------- Helper Exports ----------
export const getSection = (key) => questionBank[key] || null;
export const getQuestionById = (id) =>
  Object.values(questionBank).flat().find((q) => q.id === id) || null;
export const getAllQuestions = () => Object.values(questionBank).flat();
