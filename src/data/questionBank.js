// src/data/questionBank.js
// ---------------------------------------------------------
// Centralized LEP Question Bank for Profile, Behaviors, Mindset, and Agent Selection
// ---------------------------------------------------------

export const questionBank = {
  profile: {
    part1: [
      { id: 'name', prompt: 'What is your name?', type: 'text' },
      { id: 'industry', prompt: 'What industry do you work in?', type: 'text' },
      { id: 'role', prompt: 'What is your current job title?', type: 'text' },
      {
        id: 'responsibilities',
        prompt: 'Briefly describe what your team is responsible for within the organization.',
        type: 'text',
      },
    ],
    part2: [
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
  },

  behaviors: {
    setA: [
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
        prompt: "You're given a complex project with a tight deadline. Choose the action you'd most likely take first.",
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
        scale: { top: 'like me', bottom: 'like me' },
        options: [
          'I stay calm and provide clear direction.',
          'I rally everyone to brainstorm solutions.',
          'I focus on verifying details to ensure accuracy.',
          'I empower the team to take the lead while I support.',
          'I take a hands-on role to address the issue quickly.',
        ],
      },
      {
        id: 'pushbackFeeling',
        theme: 'The Pushback Moment',
        prompt:
          'A team member disagrees with your plan in front of everyone. In your gut, how do you feel at that moment? Write one sentence about it.',
        type: 'text',
      },
    ],

    setB: [
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
  },

  mindset: {
    societalNorms: [
      "When challenges arise, I determine the solution from my experience and expertise.",
      "I am careful to acknowledge and admit my mistakes to my team.",
      "I communicate the long-term vision to the company often and in different ways.",
      "I have a visible reaction to difficult or bad news that is shared with me about the company/team/project (i.e., non-verbal, emotional, or sounds)",
      "I consistently ask for honest feedback from my employees in different ways.",
      "I consistently dialogue with employees about their lives to demonstrate that I care about them.",
      "When speaking with individual employees, I make sure to connect what they do to the company's continued success.",
      "I empower my immediate team to do their jobs without handholding.",
      "I talk about the vision and purpose of the company at every team and company gathering.",
      "I consistently expresses detailed gratitude for both high AND low performing employees.",
      "When the learning from a team member's mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.",
      "I vocally encourage employees to reserve time for creativity or process improvement within their role.",
      "I am intentional about hiring employees that equally fit the need and the company culture and values.",
      "My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation.",
      "I am known among employees for one-line phrases like 'do what's right,' 'challenges mean learning,' or 'we're in this together.'",
      "I have more answers than I do questions in our team discussions or meetings.",
      "It is important that our employee performance metrics are directly connected to their work AND in their full control.",
      "I consistently seek interactions with employees 'organically' to hear their thoughts about a project, idea, or recent decision.",
      "I make time to review both the good and bad of a project or experience so that we can improve for next time.",
      "I consistently communicate what matters for our work.",
      "Affirming a team too much can lead to complacency and entitlement.",
      "I solicit employee opinions, concerns, and ideas in a genuine and diversified way.",
      "I openly share with my team when I am struggling professionally.",
      "I communicate processes, vision, and expectations so much that I am tired of hearing it.",
      "It is important to me that we celebrate our employees' big moments like the first day, work anniversaries, personal milestones, etc.",
      "I am confident we have a shared language at work that goes beyond product codes, acronyms, and job related shorthand.",
      "I communicate that failure is inevitable and celebrate the associated learning.",
      "I regularly meet with my immediate team members to discuss their professional goals and the adjustments I see they could make that can help them reach those goals.",
      "I regularly and intentionally seek to learn from our employees, especially the newer ones.",
      "Our company metrics are clearly and directly aimed at the mission and NOT just the bottom line.",
      "I hand projects over to others and trust them to have equal or greater success than I would doing it myself.",
      "I know the limits of my natural strengths and that I need others to successfully achieve the height of the company's mission and vision.",
    ],
  },

  agents: [
    { id: 'bluntPracticalFriend', name: 'Blunt Practical Friend', description: 'A straightforward friend who gives no-nonsense, practical advice with a critical edge.' },
    { id: 'formalEmpatheticCoach', name: 'Formal Empathetic Coach', description: 'A professional coach who delivers polished, supportive feedback with visionary ideas.' },
    { id: 'balancedMentor', name: 'Balanced Mentor', description: 'A mentor who blends practical and inspirational advice.' },
    { id: 'comedyRoaster', name: 'Comedy Roaster', description: 'Humorous but sharp, with actionable advice.' },
    { id: 'pragmaticProblemSolver', name: 'Pragmatic Problem Solver', description: 'Solution-first, simple steps. No fluff.' },
    { id: 'highSchoolCoach', name: 'High School Coach', description: 'Encouraging with practical actions.' },
  ],
};

// ---------------------------------------------------------
// Helper utilities for modular access
// ---------------------------------------------------------
export const getSection = (key) => questionBank[key] || null;
export const getQuestionById = (id) => {
  for (const section of Object.values(questionBank)) {
    if (Array.isArray(section)) {
      const found = section.find((q) => q.id === id);
      if (found) return found;
    } else if (typeof section === 'object') {
      for (const group of Object.values(section)) {
        const found = Array.isArray(group) ? group.find((q) => q.id === id) : null;
        if (found) return found;
      }
    }
  }
  return null;
};
export const getAllQuestions = () => {
  const result = [];
  for (const section of Object.values(questionBank)) {
    if (Array.isArray(section)) result.push(...section);
    else if (typeof section === 'object') {
      for (const group of Object.values(section)) {
        if (Array.isArray(group)) result.push(...group);
      }
    }
  }
  return result;
};

