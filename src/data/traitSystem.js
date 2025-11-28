/**
 * Compass Trait System Architecture
 * 
 * This file defines the hierarchical trait structure:
 * - 10 Core Traits
 * - Each trait has 6-10 Sub-Traits
 * - Each sub-trait contains: descriptions, signals, actions, and tone tags
 * 
 * This structure allows for flexible mapping of user responses to specific
 * leadership development areas while maintaining backward compatibility.
 */

// Tone/Role tags that can shift based on agent selection
const TONE_TAGS = {
  bluntPracticalFriend: {
    style: 'direct',
    formality: 'casual',
    approach: 'action-first',
  },
  formalEmpatheticCoach: {
    style: 'supportive',
    formality: 'professional',
    approach: 'reflective',
  },
  balancedMentor: {
    style: 'balanced',
    formality: 'moderate',
    approach: 'practical',
  },
  comedyRoaster: {
    style: 'humorous',
    formality: 'casual',
    approach: 'lighthearted',
  },
  pragmaticProblemSolver: {
    style: 'analytical',
    formality: 'moderate',
    approach: 'systematic',
  },
  highSchoolCoach: {
    style: 'motivational',
    formality: 'casual',
    approach: 'encouraging',
  },
};

/**
 * Core Trait Structure
 * Each trait contains:
 * - id: unique identifier
 * - name: display name
 * - description: brief overview
 * - subTraits: array of 6-10 sub-traits
 */
const CORE_TRAITS = [
  {
    id: 'communication',
    name: 'Communication',
    description: 'The ability to convey ideas, listen effectively, and adapt messaging to different audiences.',
    subTraits: [
      {
        id: 'clarity',
        name: 'Clarity',
        shortDescription: 'Expressing ideas in clear, understandable terms',
        longDescription: 'The ability to break down complex concepts into simple, digestible messages that resonate with your audience. Strong clarity means your team understands expectations, priorities, and direction without confusion.',
        strengthSignals: [
          'Team members rarely ask for clarification on your instructions',
          'Your written communications are consistently understood on first read',
          'You can explain complex topics to both technical and non-technical audiences',
          'Your team can repeat back your key messages accurately',
        ],
        riskSignals: {
          underuse: [
            'Team members frequently ask "What do you mean?" or "Can you clarify?"',
            'Misunderstandings lead to rework or missed deadlines',
            'Your messages require multiple follow-ups to be understood',
          ],
          overuse: [
            'You oversimplify to the point of losing nuance or important context',
            'You spend excessive time explaining when action is needed',
            'Your communication style feels condescending to experienced team members',
          ],
          imbalance: [
            'You\'re clear in writing but unclear in verbal communication (or vice versa)',
            'You communicate well with some audiences but struggle with others',
          ],
        },
        actions: {
          dailyHabits: [
            'Use the "one sentence test": Can you explain your main point in one clear sentence?',
            'Ask "What questions do you have?" instead of "Do you understand?"',
            'Follow up written messages with a brief verbal check-in for critical items',
          ],
          situationalTactics: [
            'Before important meetings, write down your 3 key points',
            'Use visual aids (diagrams, charts) when explaining complex processes',
            'Repeat critical information in different ways to ensure comprehension',
          ],
          strategicShifts: [
            'Develop a communication style guide for your team',
            'Create templates for common communication scenarios',
            'Establish regular feedback loops to assess message clarity',
          ],
        },
        toneTags: {
          // How tone shifts based on agent selection
          default: 'Clear and direct communication',
          bluntPracticalFriend: 'Cut the fluff. Say what you mean.',
          formalEmpatheticCoach: 'Articulate with precision and care',
          balancedMentor: 'Balance clarity with context',
        },
      },
      {
        id: 'brevity',
        name: 'Brevity',
        shortDescription: 'Conveying essential information concisely',
        longDescription: 'The skill of distilling messages to their core essence without losing critical information. Effective brevity respects others\' time while ensuring nothing important is missed.',
        strengthSignals: [
          'Your emails are consistently under 5 sentences for routine matters',
          'Meetings stay on track because you keep contributions focused',
          'Team members appreciate your efficient communication style',
          'You can summarize complex situations in 2-3 sentences',
        ],
        riskSignals: {
          underuse: [
            'Your messages are consistently long-winded or rambling',
            'Team members skim or skip your communications',
            'You include unnecessary background in every message',
          ],
          overuse: [
            'You omit critical context, leading to misunderstandings',
            'Your brevity comes across as dismissive or uncaring',
            'Team members feel you don\'t provide enough information',
          ],
          imbalance: [
            'You\'re brief in some channels but verbose in others',
            'You struggle to balance brevity with necessary detail',
          ],
        },
        actions: {
          dailyHabits: [
            'Use the "bottom line up front" (BLUF) method for emails',
            'Set a word limit for routine communications (e.g., 100 words)',
            'Remove one sentence from every message before sending',
          ],
          situationalTactics: [
            'Start with the conclusion, then provide supporting details only if asked',
            'Use bullet points instead of paragraphs for action items',
            'Create a "TL;DR" summary for longer documents',
          ],
          strategicShifts: [
            'Establish communication norms that value brevity',
            'Train your team on concise communication techniques',
            'Regularly audit your communication patterns for efficiency',
          ],
        },
        toneTags: {
          default: 'Concise and focused',
          bluntPracticalFriend: 'Get to the point. Fast.',
          formalEmpatheticCoach: 'Respectful brevity that honors the message',
          balancedMentor: 'Brief but complete',
        },
      },
      {
        id: 'influence',
        name: 'Influence',
        shortDescription: 'Persuading and inspiring others to action',
        longDescription: 'The ability to move people toward a shared goal through compelling communication, not just authority. Strong influence means others want to follow your lead.',
        strengthSignals: [
          'People adopt your ideas without you having to mandate them',
          'You can rally support for initiatives across different teams',
          'Your recommendations are frequently accepted in meetings',
          'Team members reference your vision or direction in their work',
        ],
        riskSignals: {
          underuse: [
            'Your ideas are frequently dismissed or ignored',
            'You struggle to get buy-in for initiatives',
            'You rely primarily on authority rather than persuasion',
          ],
          overuse: [
            'You manipulate rather than influence',
            'You push your agenda without considering others\' perspectives',
            'Team members feel pressured rather than inspired',
          ],
          imbalance: [
            'You influence some groups effectively but not others',
            'You\'re influential in person but not in written communication',
          ],
        },
        actions: {
          dailyHabits: [
            'Frame requests in terms of shared benefits, not just your needs',
            'Ask "What would make this compelling to you?" before presenting ideas',
            'Listen to objections before responding defensively',
          ],
          situationalTactics: [
            'Use storytelling to make data and decisions more memorable',
            'Find common ground before presenting your position',
            'Acknowledge valid concerns before making your case',
          ],
          strategicShifts: [
            'Build a reputation for following through on commitments',
            'Develop relationships before you need to influence',
            'Study the communication styles of leaders you find influential',
          ],
        },
        toneTags: {
          default: 'Persuasive and inspiring',
          bluntPracticalFriend: 'Make the case. Get alignment.',
          formalEmpatheticCoach: 'Influence through understanding and respect',
          balancedMentor: 'Persuade with both logic and emotion',
        },
      },
      {
        id: 'listening',
        name: 'Listening',
        shortDescription: 'Actively hearing and understanding others',
        longDescription: 'The practice of fully engaging with what others are saying, both verbally and non-verbally. Strong listening means you understand not just words, but intent, emotion, and context.',
        strengthSignals: [
          'Team members seek you out to discuss ideas or concerns',
          'You can accurately paraphrase what others have said',
          'You remember details from previous conversations',
          'People feel heard and understood after talking with you',
        ],
        riskSignals: {
          underuse: [
            'You interrupt others frequently',
            'Team members say "You\'re not listening" or "You don\'t understand"',
            'You formulate responses while others are still speaking',
          ],
          overuse: [
            'You listen but never take action on what you hear',
            'You become a passive listener without providing guidance',
            'You absorb others\' problems without boundaries',
          ],
          imbalance: [
            'You listen well in one-on-ones but not in group settings',
            'You hear words but miss emotional cues',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice "active listening": summarize what you heard before responding',
            'Put away devices during important conversations',
            'Ask one follow-up question before offering your perspective',
          ],
          situationalTactics: [
            'Take notes during important discussions to show engagement',
            'Use "Tell me more" to encourage deeper sharing',
            'Reflect back emotions you\'re sensing: "It sounds like you\'re frustrated..."',
          ],
          strategicShifts: [
            'Schedule regular one-on-ones focused on listening, not directing',
            'Create forums for team input (surveys, open forums, suggestion boxes)',
            'Model listening behavior in team meetings by asking others to speak first',
          ],
        },
        toneTags: {
          default: 'Attentive and understanding',
          bluntPracticalFriend: 'Listen to understand, not to respond',
          formalEmpatheticCoach: 'Deep listening that honors the speaker',
          balancedMentor: 'Listen with curiosity and care',
        },
      },
      {
        id: 'empathy',
        name: 'Empathy',
        shortDescription: 'Understanding and acknowledging others\' perspectives and feelings',
        longDescription: 'The capacity to recognize, understand, and respond to the emotions and experiences of others. Strong empathy helps you connect with your team on a human level.',
        strengthSignals: [
          'You can sense when team members are struggling before they say so',
          'You adjust your communication style based on others\' emotional state',
          'Team members feel comfortable sharing personal challenges',
          'You consider emotional impact when making decisions',
        ],
        riskSignals: {
          underuse: [
            'You miss emotional cues in conversations',
            'Team members say you "don\'t get it" or seem disconnected',
            'You make decisions without considering human impact',
          ],
          overuse: [
            'You become overwhelmed by others\' emotions',
            'You avoid difficult decisions to spare feelings',
            'You take on others\' emotional burdens inappropriately',
          ],
          imbalance: [
            'You\'re empathetic with some team members but not others',
            'You understand emotions but struggle to respond appropriately',
          ],
        },
        actions: {
          dailyHabits: [
            'Check in on team members\' well-being, not just their work',
            'Acknowledge emotions you observe: "I can see this is important to you"',
            'Ask "How are you feeling about this?" in addition to "What do you think?"',
          ],
          situationalTactics: [
            'Before difficult conversations, consider the other person\'s perspective',
            'Validate emotions before problem-solving: "That must be frustrating"',
            'Use "I" statements to express understanding: "I can imagine that feels..."',
          ],
          strategicShifts: [
            'Build emotional intelligence through reading, training, or coaching',
            'Create psychological safety so team members can express emotions',
            'Balance empathy with accountability in performance management',
          ],
        },
        toneTags: {
          default: 'Understanding and compassionate',
          bluntPracticalFriend: 'Get where they\'re coming from. Then move forward.',
          formalEmpatheticCoach: 'Empathy that honors both person and performance',
          balancedMentor: 'Understand feelings while maintaining focus on outcomes',
        },
      },
      {
        id: 'audienceAdaptability',
        name: 'Audience Adaptability',
        shortDescription: 'Adjusting communication style to different audiences',
        longDescription: 'The ability to recognize different communication needs and adapt your approach accordingly. Strong adaptability means you can effectively communicate with executives, peers, direct reports, and external stakeholders.',
        strengthSignals: [
          'You adjust your communication style based on who you\'re talking to',
          'Different audiences consistently understand your messages',
          'You can translate technical concepts for non-technical audiences',
          'You\'re comfortable communicating up, down, and across the organization',
        ],
        riskSignals: {
          underuse: [
            'You use the same communication style with everyone',
            'Some audiences consistently misunderstand your messages',
            'You struggle to communicate effectively with certain groups',
          ],
          overuse: [
            'You change your core message to please different audiences',
            'You come across as inauthentic or inconsistent',
            'You lose your voice trying to adapt to everyone',
          ],
          imbalance: [
            'You adapt well to some audiences but not others',
            'You\'re effective in formal settings but struggle in casual ones (or vice versa)',
          ],
        },
        actions: {
          dailyHabits: [
            'Before communicating, ask "Who is my audience and what do they need?"',
            'Observe how others communicate effectively with different groups',
            'Adjust your vocabulary and examples based on your audience',
          ],
          situationalTactics: [
            'Prepare different versions of key messages for different audiences',
            'Use audience-appropriate examples and analogies',
            'Match the formality level of your communication to the context',
          ],
          strategicShifts: [
            'Develop communication templates for different audience types',
            'Seek feedback from diverse audiences on your communication effectiveness',
            'Build relationships across different organizational levels',
          ],
        },
        toneTags: {
          default: 'Flexible and context-aware',
          bluntPracticalFriend: 'Know your audience. Adjust. Deliver.',
          formalEmpatheticCoach: 'Adapt with intention and respect',
          balancedMentor: 'Flexible communication that maintains authenticity',
        },
      },
      {
        id: 'executivePresence',
        name: 'Executive Presence',
        shortDescription: 'Commanding respect and attention through presence',
        longDescription: 'The ability to project confidence, competence, and credibility in professional settings. Strong executive presence means others take you seriously and trust your judgment.',
        strengthSignals: [
          'You command attention when you speak in meetings',
          'Senior leaders seek your input on important decisions',
          'You remain calm and composed under pressure',
          'Others describe you as "someone who gets things done"',
        ],
        riskSignals: {
          underuse: [
            'You\'re overlooked in important meetings or discussions',
            'Your ideas don\'t get the consideration they deserve',
            'You struggle to project confidence in high-stakes situations',
          ],
          overuse: [
            'You come across as arrogant or dismissive',
            'You dominate conversations without leaving room for others',
            'Your presence intimidates rather than inspires',
          ],
          imbalance: [
            'You have presence in some settings but not others',
            'You project confidence but lack substance',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice confident body language: stand tall, make eye contact',
            'Prepare thoroughly for important presentations or meetings',
            'Speak with conviction, avoiding filler words like "um" or "like"',
          ],
          situationalTactics: [
            'Arrive early to important meetings to establish presence',
            'Use pauses effectively to emphasize key points',
            'Dress and present yourself appropriately for the context',
          ],
          strategicShifts: [
            'Develop expertise in your domain to build credibility',
            'Seek opportunities to present to senior leadership',
            'Build a track record of delivering on commitments',
          ],
        },
        toneTags: {
          default: 'Confident and credible',
          bluntPracticalFriend: 'Show up. Own the room. Execute.',
          formalEmpatheticCoach: 'Presence that commands respect through competence',
          balancedMentor: 'Confident presence that invites collaboration',
        },
      },
    ],
  },
  {
    id: 'decisionMaking',
    name: 'Decision-Making & Judgment',
    description: 'The ability to make sound decisions efficiently, balancing analysis with action.',
    subTraits: [
      {
        id: 'speed',
        name: 'Decision Speed',
        shortDescription: 'Making timely decisions without unnecessary delay',
        longDescription: 'The ability to gather necessary information and make decisions quickly enough to maintain momentum, without rushing into poor choices.',
        strengthSignals: [
          'You make decisions in a timeframe that keeps projects moving',
          'Team members don\'t wait unnecessarily for your input',
          'You can make good decisions with incomplete information',
          'You balance speed with quality effectively',
        ],
        riskSignals: {
          underuse: [
            'Decisions take so long that opportunities are missed',
            'Team members describe you as "indecisive"',
            'You over-analyze when action is needed',
          ],
          overuse: [
            'You make hasty decisions without sufficient consideration',
            'You frequently need to reverse or correct decisions',
            'You rush decisions that require more thought',
          ],
          imbalance: [
            'You\'re fast on some decisions but slow on others',
            'You make quick decisions but struggle with follow-through',
          ],
        },
        actions: {
          dailyHabits: [
            'Set decision deadlines for yourself',
            'Use the "80% rule": make decisions when you have 80% of the information',
            'Practice making smaller decisions quickly to build the habit',
          ],
          situationalTactics: [
            'Use decision frameworks (pros/cons, impact/effort matrix)',
            'Delegate decisions that don\'t require your input',
            'Set clear criteria for when a decision needs more time vs. immediate action',
          ],
          strategicShifts: [
            'Build decision-making processes that enable speed',
            'Develop your intuition through experience and reflection',
            'Create a culture where good decisions are rewarded, even if outcomes vary',
          ],
        },
        toneTags: {
          default: 'Timely and decisive',
          bluntPracticalFriend: 'Decide. Move. Iterate.',
          formalEmpatheticCoach: 'Thoughtful decisions made with appropriate speed',
          balancedMentor: 'Balance speed with sound judgment',
        },
      },
      {
        id: 'quality',
        name: 'Decision Quality',
        shortDescription: 'Making well-reasoned, effective decisions',
        longDescription: 'The ability to consider relevant factors, weigh options, and choose paths that lead to positive outcomes. Strong decision quality means your choices consistently produce good results.',
        strengthSignals: [
          'Your decisions lead to positive outcomes more often than not',
          'You consider multiple perspectives before deciding',
          'You can explain the reasoning behind your decisions',
          'Team members trust your judgment',
        ],
        riskSignals: {
          underuse: [
            'Your decisions frequently lead to negative outcomes',
            'You make decisions based on incomplete information',
            'You don\'t consider long-term consequences',
          ],
          overuse: [
            'You over-analyze to the point of paralysis',
            'You seek perfection when "good enough" would suffice',
            'You delay decisions waiting for perfect information',
          ],
          imbalance: [
            'You make good strategic decisions but poor tactical ones (or vice versa)',
            'You consider some factors but miss others',
          ],
        },
        actions: {
          dailyHabits: [
            'List pros and cons for significant decisions',
            'Consider "What could go wrong?" before finalizing decisions',
            'Seek input from 2-3 trusted advisors on important choices',
          ],
          situationalTactics: [
            'Use decision frameworks (SWOT, cost-benefit analysis)',
            'Consider both short-term and long-term implications',
            'Test decisions with small pilots when possible',
          ],
          strategicShifts: [
            'Build decision-making frameworks for common scenarios',
            'Review past decisions to identify patterns in your judgment',
            'Develop expertise in areas where you make frequent decisions',
          ],
        },
        toneTags: {
          default: 'Sound and well-reasoned',
          bluntPracticalFriend: 'Make the call. Own the outcome.',
          formalEmpatheticCoach: 'Decisions grounded in analysis and wisdom',
          balancedMentor: 'Quality decisions that balance multiple factors',
        },
      },
      {
        id: 'underUncertainty',
        name: 'Decision-Making Under Uncertainty',
        shortDescription: 'Making effective decisions with incomplete information',
        longDescription: 'The ability to move forward confidently when you don\'t have all the facts. Strong uncertainty management means you can make progress without perfect clarity.',
        strengthSignals: [
          'You can make progress even when information is incomplete',
          'You\'re comfortable with calculated risks',
          'You adjust decisions as new information becomes available',
          'You don\'t let uncertainty paralyze action',
        ],
        riskSignals: {
          underuse: [
            'You wait for perfect information before deciding',
            'Uncertainty causes you to delay or avoid decisions',
            'You struggle to move forward without complete clarity',
          ],
          overuse: [
            'You make decisions without gathering available information',
            'You take unnecessary risks without considering consequences',
            'You move too fast when more information would help',
          ],
          imbalance: [
            'You handle uncertainty well in some areas but not others',
            'You\'re comfortable with risk but struggle with follow-through',
          ],
        },
        actions: {
          dailyHabits: [
            'Identify what information is "must have" vs. "nice to have"',
            'Set decision deadlines even when information is incomplete',
            'Practice making small decisions with limited information',
          ],
          situationalTactics: [
            'Use scenario planning: "If X happens, we\'ll do Y"',
            'Build in checkpoints to reassess as information becomes available',
            'Make reversible decisions quickly, irreversible ones more carefully',
          ],
          strategicShifts: [
            'Develop comfort with ambiguity through practice',
            'Build systems that allow for course correction',
            'Create a culture that accepts "good enough" decisions',
          ],
        },
        toneTags: {
          default: 'Comfortable with ambiguity',
          bluntPracticalFriend: 'Uncertainty is normal. Decide anyway.',
          formalEmpatheticCoach: 'Navigate uncertainty with thoughtful confidence',
          balancedMentor: 'Move forward despite uncertainty',
        },
      },
      {
        id: 'stakeholderConsideration',
        name: 'Stakeholder Consideration',
        shortDescription: 'Considering impact on all affected parties',
        longDescription: 'The ability to understand how decisions affect different stakeholders and balance competing interests. Strong stakeholder consideration means decisions account for broader impact.',
        strengthSignals: [
          'You consider how decisions affect different groups',
          'You seek input from affected stakeholders before deciding',
          'Your decisions account for both immediate and downstream impacts',
          'Stakeholders feel their interests are considered',
        ],
        riskSignals: {
          underuse: [
            'You make decisions without considering broader impact',
            'Stakeholders are surprised or negatively affected by your decisions',
            'You focus only on immediate outcomes',
          ],
          overuse: [
            'You try to please everyone, leading to weak decisions',
            'You over-consult, delaying decisions unnecessarily',
            'You avoid making necessary but unpopular decisions',
          ],
          imbalance: [
            'You consider some stakeholders but not others',
            'You gather input but don\'t incorporate it meaningfully',
          ],
        },
        actions: {
          dailyHabits: [
            'List all stakeholders affected by significant decisions',
            'Ask "Who will this impact and how?" before deciding',
            'Communicate decisions to affected parties proactively',
          ],
          situationalTactics: [
            'Seek input from key stakeholders before finalizing decisions',
            'Consider both direct and indirect impacts',
            'Balance competing interests transparently',
          ],
          strategicShifts: [
            'Build relationships with key stakeholders',
            'Create processes for stakeholder input on major decisions',
            'Develop skills in negotiation and compromise',
          ],
        },
        toneTags: {
          default: 'Considerate of all parties',
          bluntPracticalFriend: 'Consider stakeholders. Then decide.',
          formalEmpatheticCoach: 'Decisions that honor all affected parties',
          balancedMentor: 'Balance stakeholder needs with organizational goals',
        },
      },
      {
        id: 'learningFromOutcomes',
        name: 'Learning from Outcomes',
        shortDescription: 'Reflecting on and improving decision-making based on results',
        longDescription: 'The practice of reviewing decisions, understanding what worked and what didn\'t, and applying those learnings to future choices. Strong learning means you continuously improve your judgment.',
        strengthSignals: [
          'You regularly review past decisions to understand outcomes',
          'You adjust your decision-making approach based on results',
          'You can identify patterns in your decision-making',
          'Your decision quality improves over time',
        ],
        riskSignals: {
          underuse: [
            'You don\'t reflect on decision outcomes',
            'You repeat the same decision-making mistakes',
            'You can\'t explain why decisions succeeded or failed',
          ],
          overuse: [
            'You over-analyze past decisions to the point of inaction',
            'You second-guess yourself based on single outcomes',
            'You change your approach too frequently',
          ],
          imbalance: [
            'You learn from successes but not failures (or vice versa)',
            'You reflect but don\'t apply learnings to future decisions',
          ],
        },
        actions: {
          dailyHabits: [
            'Set calendar reminders to review significant decisions after 30/60/90 days',
            'Keep a decision journal: record decisions, reasoning, and outcomes',
            'Ask "What would I do differently?" after important decisions',
          ],
          situationalTactics: [
            'Conduct post-mortems on major decisions',
            'Seek feedback on your decision-making process',
            'Compare expected vs. actual outcomes',
          ],
          strategicShifts: [
            'Build decision review into your regular process',
            'Share decision learnings with your team',
            'Develop decision-making frameworks based on experience',
          ],
        },
        toneTags: {
          default: 'Reflective and adaptive',
          bluntPracticalFriend: 'Review. Learn. Improve.',
          formalEmpatheticCoach: 'Continuous improvement through thoughtful reflection',
          balancedMentor: 'Learn from every decision',
        },
      },
    ],
  },
  // Additional core traits will follow the same structure
  // For now, I'll create placeholders for the remaining 8 traits
  {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    description: 'The ability to see the big picture, anticipate future trends, and align actions with long-term goals.',
    subTraits: [
      {
        id: 'vision',
        name: 'Vision',
        shortDescription: 'Articulating a compelling future state',
        longDescription: 'The ability to paint a clear, inspiring picture of where the organization or team is heading. Strong vision provides direction and motivation, helping people understand the "why" behind their work.',
        strengthSignals: [
          'Team members can articulate your vision in their own words',
          'Your vision guides decision-making across the organization',
          'People are energized and motivated by the future you describe',
          'Your vision is specific enough to be actionable but inspiring enough to motivate',
        ],
        riskSignals: {
          underuse: [
            'Team members can\'t describe where you\'re heading',
            'Decisions seem disconnected or reactive',
            'People lack a sense of purpose or direction',
          ],
          overuse: [
            'Your vision is so abstract it\'s meaningless',
            'You focus on vision at the expense of execution',
            'Your vision changes so frequently it creates confusion',
          ],
          imbalance: [
            'You have a clear vision but can\'t communicate it effectively',
            'Your vision resonates with some but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Start meetings by connecting current work to the bigger vision',
            'Use storytelling to make the vision tangible and memorable',
            'Ask "How does this move us toward our vision?" when making decisions',
          ],
          situationalTactics: [
            'Create visual representations of your vision (diagrams, roadmaps)',
            'Share specific examples of what success looks like',
            'Connect individual contributions to the broader vision',
          ],
          strategicShifts: [
            'Develop a vision statement that\'s both aspirational and achievable',
            'Regularly communicate vision through multiple channels',
            'Involve team members in refining and owning the vision',
          ],
        },
        toneTags: {
          default: 'Visionary and inspiring',
          bluntPracticalFriend: 'Paint the picture. Make it real.',
          formalEmpatheticCoach: 'A vision that honors both aspiration and reality',
          balancedMentor: 'Clear vision that guides and motivates',
        },
      },
      {
        id: 'systemsThinking',
        name: 'Systems Thinking',
        shortDescription: 'Understanding how parts connect to form a whole',
        longDescription: 'The ability to see interconnections, patterns, and relationships within complex systems. Strong systems thinking means you understand how changes in one area affect others.',
        strengthSignals: [
          'You anticipate unintended consequences before they occur',
          'You see connections others miss between different parts of the organization',
          'You can map how changes in one area will ripple through the system',
          'Your solutions address root causes, not just symptoms',
        ],
        riskSignals: {
          underuse: [
            'You make decisions in isolation without considering broader impact',
            'You\'re surprised by unintended consequences',
            'You focus on symptoms rather than root causes',
          ],
          overuse: [
            'You over-complicate simple problems with systems analysis',
            'You become paralyzed by seeing too many connections',
            'You delay action waiting to understand the entire system',
          ],
          imbalance: [
            'You understand systems but struggle to communicate that understanding',
            'You see connections but can\'t prioritize which matter most',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask "What else does this affect?" before making decisions',
            'Map out relationships between different parts of your organization',
            'Look for patterns across seemingly unrelated issues',
          ],
          situationalTactics: [
            'Use diagrams to visualize system relationships',
            'Conduct "ripple effect" analysis for major decisions',
            'Seek input from people in different parts of the system',
          ],
          strategicShifts: [
            'Develop mental models of how your organization works',
            'Build cross-functional relationships to understand system dynamics',
            'Create feedback loops to understand system behavior',
          ],
        },
        toneTags: {
          default: 'Holistic and interconnected',
          bluntPracticalFriend: 'See the whole system. Act on what matters.',
          formalEmpatheticCoach: 'Understanding that honors complexity and relationships',
          balancedMentor: 'Systems thinking that leads to better decisions',
        },
      },
      {
        id: 'futureOrientation',
        name: 'Future Orientation',
        shortDescription: 'Anticipating trends and preparing for what\'s next',
        longDescription: 'The ability to look ahead, identify emerging trends, and position your organization for future success. Strong future orientation means you\'re proactive rather than reactive.',
        strengthSignals: [
          'You identify opportunities before they become obvious',
          'You prepare for future challenges before they become crises',
          'You stay current with trends in your industry and beyond',
          'Your team feels prepared for what\'s coming',
        ],
        riskSignals: {
          underuse: [
            'You\'re constantly reacting to problems rather than preventing them',
            'You miss emerging opportunities or threats',
            'Your organization feels behind the curve',
          ],
          overuse: [
            'You focus so much on the future you neglect the present',
            'You chase every trend without focus',
            'You create anxiety by constantly talking about future threats',
          ],
          imbalance: [
            'You see the future but can\'t translate it into action',
            'You\'re future-oriented in some areas but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Set aside time weekly to read about industry trends',
            'Ask "What might change in the next 6-12 months?" regularly',
            'Connect current actions to future implications',
          ],
          situationalTactics: [
            'Conduct scenario planning for major initiatives',
            'Build relationships with people who see trends early',
            'Test assumptions about the future with small experiments',
          ],
          strategicShifts: [
            'Develop a process for monitoring and responding to trends',
            'Build organizational capacity to adapt quickly',
            'Create a culture that values learning and experimentation',
          ],
        },
        toneTags: {
          default: 'Forward-looking and proactive',
          bluntPracticalFriend: 'See what\'s coming. Get ready.',
          formalEmpatheticCoach: 'Future orientation that balances preparation with presence',
          balancedMentor: 'Anticipate the future while executing in the present',
        },
      },
      {
        id: 'patternRecognition',
        name: 'Pattern Recognition',
        shortDescription: 'Identifying recurring themes and trends',
        longDescription: 'The ability to see patterns across different situations, recognize what\'s similar and what\'s different, and apply learnings from one context to another.',
        strengthSignals: [
          'You notice when similar problems recur',
          'You can apply solutions from one situation to another',
          'You identify trends before they\'re obvious to others',
          'You learn quickly from experience because you see patterns',
        ],
        riskSignals: {
          underuse: [
            'You treat every situation as completely unique',
            'You repeat mistakes because you don\'t see patterns',
            'You miss opportunities to apply successful approaches',
          ],
          overuse: [
            'You force patterns where they don\'t exist',
            'You oversimplify complex situations',
            'You miss important nuances by focusing only on patterns',
          ],
          imbalance: [
            'You see patterns but can\'t act on them',
            'You recognize patterns in some areas but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Look for similarities across different situations',
            'Ask "Where have I seen this before?" when facing challenges',
            'Keep notes on patterns you observe',
          ],
          situationalTactics: [
            'Review past similar situations before making decisions',
            'Identify what\'s similar and what\'s different in new situations',
            'Share patterns you notice with your team',
          ],
          strategicShifts: [
            'Develop frameworks based on patterns you observe',
            'Build organizational memory to capture patterns',
            'Create processes that leverage pattern recognition',
          ],
        },
        toneTags: {
          default: 'Pattern-aware and learning-oriented',
          bluntPracticalFriend: 'See the pattern. Apply the lesson.',
          formalEmpatheticCoach: 'Pattern recognition that honors both similarity and uniqueness',
          balancedMentor: 'Learn from patterns while staying open to new approaches',
        },
      },
      {
        id: 'longTermPlanning',
        name: 'Long-Term Planning',
        shortDescription: 'Creating and executing multi-year strategies',
        longDescription: 'The ability to think beyond immediate concerns, create plans that span years, and maintain focus on long-term goals despite short-term pressures.',
        strengthSignals: [
          'You have clear plans that extend beyond the current quarter',
          'You can articulate where you want to be in 3-5 years',
          'You make decisions that support long-term goals even when they\'re hard short-term',
          'Your team understands the long-term direction',
        ],
        riskSignals: {
          underuse: [
            'You focus only on immediate problems',
            'You don\'t have a clear long-term direction',
            'Short-term pressures constantly derail your plans',
          ],
          overuse: [
            'You plan so far ahead the plans become irrelevant',
            'You focus on long-term at the expense of immediate needs',
            'Your long-term plans are too rigid to adapt',
          ],
          imbalance: [
            'You create long-term plans but don\'t execute them',
            'You plan well in some areas but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Review long-term goals weekly to stay aligned',
            'Ask "Does this support our 3-year vision?" when making decisions',
            'Break long-term goals into quarterly milestones',
          ],
          situationalTactics: [
            'Create 1-year, 3-year, and 5-year plans',
            'Regularly revisit and adjust long-term plans',
            'Communicate long-term direction in every major decision',
          ],
          strategicShifts: [
            'Build organizational capacity for long-term thinking',
            'Create systems that balance short-term and long-term needs',
            'Develop a process for translating long-term vision into action',
          ],
        },
        toneTags: {
          default: 'Strategic and forward-planning',
          bluntPracticalFriend: 'Plan long-term. Execute now.',
          formalEmpatheticCoach: 'Long-term planning that honors both vision and reality',
          balancedMentor: 'Balance long-term vision with immediate execution',
        },
      },
      {
        id: 'competitiveIntelligence',
        name: 'Competitive Intelligence',
        shortDescription: 'Understanding market dynamics and competitive landscape',
        longDescription: 'The ability to understand your competitive environment, identify threats and opportunities, and position your organization effectively.',
        strengthSignals: [
          'You understand your competitive position relative to others',
          'You identify competitive threats before they materialize',
          'You can articulate what makes you different and valuable',
          'You make strategic decisions informed by competitive understanding',
        ],
        riskSignals: {
          underuse: [
            'You\'re surprised by competitive moves',
            'You don\'t understand your competitive position',
            'You make decisions without considering competitive context',
          ],
          overuse: [
            'You obsess over competitors at the expense of your own strategy',
            'You react to every competitive move',
            'You lose focus on your unique value proposition',
          ],
          imbalance: [
            'You understand competition but can\'t act on that knowledge',
            'You focus on some competitors but ignore others',
          ],
        },
        actions: {
          dailyHabits: [
            'Monitor industry news and competitive developments',
            'Ask "What would our competitors do?" when making strategic decisions',
            'Regularly assess your competitive position',
          ],
          situationalTactics: [
            'Conduct competitive analysis before major decisions',
            'Identify your unique value proposition clearly',
            'Learn from competitors\' successes and failures',
          ],
          strategicShifts: [
            'Build a process for competitive intelligence gathering',
            'Develop a clear understanding of your competitive advantages',
            'Create a culture that values competitive awareness without obsession',
          ],
        },
        toneTags: {
          default: 'Market-aware and competitive',
          bluntPracticalFriend: 'Know your competition. Own your position.',
          formalEmpatheticCoach: 'Competitive intelligence that informs strategy',
          balancedMentor: 'Understand competition while focusing on your strengths',
        },
      },
      {
        id: 'resourceAllocation',
        name: 'Resource Allocation',
        shortDescription: 'Prioritizing and allocating resources strategically',
        longDescription: 'The ability to make tough choices about where to invest time, money, and people to maximize impact. Strong resource allocation means you focus on what matters most.',
        strengthSignals: [
          'You can say "no" to good opportunities to focus on great ones',
          'Your resource allocation aligns with strategic priorities',
          'You make trade-offs transparently and thoughtfully',
          'Resources are allocated where they\'ll have the most impact',
        ],
        riskSignals: {
          underuse: [
            'You spread resources too thin across too many priorities',
            'You can\'t make tough choices about resource allocation',
            'Resources don\'t align with stated priorities',
          ],
          overuse: [
            'You over-optimize resource allocation at the expense of flexibility',
            'You allocate resources so rigidly you can\'t adapt',
            'You focus only on efficiency and miss opportunities',
          ],
          imbalance: [
            'You allocate resources well in some areas but not others',
            'You plan resource allocation but don\'t execute it',
          ],
        },
        actions: {
          dailyHabits: [
            'Regularly review resource allocation against priorities',
            'Ask "Is this the best use of our resources?" before committing',
            'Make resource trade-offs explicit and transparent',
          ],
          situationalTactics: [
            'Use frameworks (ROI, impact/effort) to guide resource decisions',
            'Stop or reduce investment in low-priority areas',
            'Reallocate resources when priorities change',
          ],
          strategicShifts: [
            'Build a process for strategic resource allocation',
            'Create a culture that accepts trade-offs as necessary',
            'Develop systems that make resource allocation visible and reviewable',
          ],
        },
        toneTags: {
          default: 'Strategic and focused',
          bluntPracticalFriend: 'Focus resources. Maximize impact.',
          formalEmpatheticCoach: 'Resource allocation that honors both strategy and people',
          balancedMentor: 'Allocate resources strategically while maintaining flexibility',
        },
      },
    ],
  },
  {
    id: 'execution',
    name: 'Execution & Follow-Through',
    description: 'The ability to translate plans into action and deliver results consistently.',
    subTraits: [
      {
        id: 'projectManagement',
        name: 'Project Management',
        shortDescription: 'Planning, organizing, and executing complex initiatives',
        longDescription: 'The ability to break down large goals into manageable steps, coordinate resources, and deliver projects on time and within scope. Strong project management means you can reliably execute on commitments.',
        strengthSignals: [
          'Projects you lead are consistently completed on time and within scope',
          'You can break complex initiatives into clear, actionable steps',
          'Team members know what they need to do and when',
          'You anticipate and mitigate risks before they become problems',
        ],
        riskSignals: {
          underuse: [
            'Projects frequently run over time or budget',
            'You struggle to break large goals into actionable steps',
            'Team members are unclear about roles and deadlines',
          ],
          overuse: [
            'You over-plan to the point of delaying action',
            'You micromanage project details',
            'You focus on process at the expense of outcomes',
          ],
          imbalance: [
            'You plan well but struggle with execution (or vice versa)',
            'You manage some types of projects well but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Break large goals into weekly and daily tasks',
            'Review project status regularly (daily for active projects)',
            'Update stakeholders on progress proactively',
          ],
          situationalTactics: [
            'Use project management tools to track progress',
            'Identify and address blockers immediately',
            'Conduct regular check-ins to ensure alignment',
          ],
          strategicShifts: [
            'Develop project management processes that work for your team',
            'Build project management skills in your team',
            'Create a culture of accountability for project delivery',
          ],
        },
        toneTags: {
          default: 'Organized and reliable',
          bluntPracticalFriend: 'Plan it. Execute it. Deliver it.',
          formalEmpatheticCoach: 'Project management that honors both process and people',
          balancedMentor: 'Structure that enables execution without stifling creativity',
        },
      },
      {
        id: 'prioritization',
        name: 'Prioritization',
        shortDescription: 'Focusing on what matters most',
        longDescription: 'The ability to distinguish between urgent and important, make tough choices about what to do and what not to do, and maintain focus on high-impact activities.',
        strengthSignals: [
          'You consistently focus on high-impact activities',
          'You can say "no" to good opportunities to focus on great ones',
          'Your team understands what\'s most important',
          'You don\'t get distracted by urgent but unimportant tasks',
        ],
        riskSignals: {
          underuse: [
            'You try to do everything and accomplish little',
            'You can\'t distinguish between urgent and important',
            'You\'re constantly reacting to the latest request',
          ],
          overuse: [
            'You prioritize so rigidly you miss important opportunities',
            'You focus only on your priorities and ignore others\' needs',
            'You become inflexible when priorities need to shift',
          ],
          imbalance: [
            'You prioritize well in some areas but not others',
            'You know what to prioritize but struggle to execute',
          ],
        },
        actions: {
          dailyHabits: [
            'Start each day by identifying your top 3 priorities',
            'Use frameworks (Eisenhower Matrix, impact/effort) to prioritize',
            'Regularly review and adjust priorities based on changing context',
          ],
          situationalTactics: [
            'Say "no" to requests that don\'t align with priorities',
            'Delegate or defer lower-priority tasks',
            'Communicate priorities clearly to your team',
          ],
          strategicShifts: [
            'Build a culture that values focus over busyness',
            'Create systems that make priorities visible and reviewable',
            'Develop your team\'s ability to prioritize effectively',
          ],
        },
        toneTags: {
          default: 'Focused and strategic',
          bluntPracticalFriend: 'Focus on what matters. Ignore the rest.',
          formalEmpatheticCoach: 'Prioritization that honors both strategy and relationships',
          balancedMentor: 'Clear priorities that allow for flexibility',
        },
      },
      {
        id: 'deadlineManagement',
        name: 'Deadline Management',
        shortDescription: 'Meeting commitments and delivering on time',
        longDescription: 'The ability to estimate time accurately, manage commitments, and deliver work when promised. Strong deadline management means others can rely on your commitments.',
        strengthSignals: [
          'You consistently meet or beat deadlines',
          'You provide realistic time estimates',
          'You communicate proactively when deadlines are at risk',
          'Others can rely on your commitments',
        ],
        riskSignals: {
          underuse: [
            'You frequently miss deadlines',
            'You underestimate how long work will take',
            'You don\'t communicate when deadlines are at risk',
          ],
          overuse: [
            'You over-commit to avoid disappointing others',
            'You work excessive hours to meet unrealistic deadlines',
            'You sacrifice quality to meet deadlines',
          ],
          imbalance: [
            'You meet some types of deadlines but not others',
            'You manage your own deadlines but not team deadlines',
          ],
        },
        actions: {
          dailyHabits: [
            'Build buffer time into all deadline estimates',
            'Track your deadline performance to improve estimation',
            'Communicate early if a deadline is at risk',
          ],
          situationalTactics: [
            'Break large deadlines into smaller milestones',
            'Say "no" to commitments you can\'t realistically meet',
            'Negotiate deadlines when initial estimates are unrealistic',
          ],
          strategicShifts: [
            'Build a culture that values realistic commitments',
            'Create systems that make deadlines visible and manageable',
            'Develop your team\'s ability to estimate and manage deadlines',
          ],
        },
        toneTags: {
          default: 'Reliable and time-conscious',
          bluntPracticalFriend: 'Set realistic deadlines. Meet them.',
          formalEmpatheticCoach: 'Deadline management that honors both commitments and well-being',
          balancedMentor: 'Reliable delivery that maintains quality',
        },
      },
      {
        id: 'qualityStandards',
        name: 'Quality Standards',
        shortDescription: 'Maintaining high standards for deliverables',
        longDescription: 'The ability to define what "good enough" means, ensure work meets those standards, and balance quality with speed and resources.',
        strengthSignals: [
          'Your work consistently meets or exceeds quality standards',
          'You can define what "good enough" means for different situations',
          'You balance quality with speed and resources effectively',
          'Team members understand and meet quality expectations',
        ],
        riskSignals: {
          underuse: [
            'Work frequently needs to be redone due to quality issues',
            'You accept work that doesn\'t meet standards',
            'You can\'t define what quality means',
          ],
          overuse: [
            'You pursue perfection at the expense of speed',
            'You can\'t accept "good enough" when it\'s appropriate',
            'You delay delivery waiting for perfection',
          ],
          imbalance: [
            'You maintain high standards in some areas but not others',
            'You know what quality means but can\'t ensure it',
          ],
        },
        actions: {
          dailyHabits: [
            'Define quality standards before starting work',
            'Review work against standards before considering it complete',
            'Provide specific feedback on quality issues',
          ],
          situationalTactics: [
            'Use checklists to ensure quality standards are met',
            'Balance quality with speed based on context',
            'Establish quality gates at key milestones',
          ],
          strategicShifts: [
            'Build a culture that values quality',
            'Create systems that make quality standards visible',
            'Develop your team\'s ability to meet quality standards',
          ],
        },
        toneTags: {
          default: 'Quality-focused and standards-driven',
          bluntPracticalFriend: 'Set the bar. Meet it.',
          formalEmpatheticCoach: 'Quality standards that honor both excellence and practicality',
          balancedMentor: 'High standards that are achievable and meaningful',
        },
      },
      {
        id: 'followThrough',
        name: 'Follow-Through',
        shortDescription: 'Completing what you start',
        longDescription: 'The ability to see commitments through to completion, even when it\'s difficult or unexciting. Strong follow-through means you finish what you start.',
        strengthSignals: [
          'You complete projects and initiatives you start',
          'You follow through on commitments even when priorities shift',
          'You don\'t leave loose ends or incomplete work',
          'Others can count on you to finish what you start',
        ],
        riskSignals: {
          underuse: [
            'You start many things but finish few',
            'You lose interest or momentum partway through projects',
            'You leave work incomplete or half-done',
          ],
          overuse: [
            'You persist with projects that should be stopped',
            'You can\'t let go of commitments that no longer make sense',
            'You finish everything even when priorities have changed',
          ],
          imbalance: [
            'You follow through on some commitments but not others',
            'You finish work but don\'t communicate completion',
          ],
        },
        actions: {
          dailyHabits: [
            'Review your commitments weekly to ensure follow-through',
            'Break large commitments into smaller, completable chunks',
            'Celebrate completion to reinforce the habit',
          ],
          situationalTactics: [
            'Set clear completion criteria before starting work',
            'Schedule time specifically for follow-through activities',
            'Communicate completion to stakeholders',
          ],
          strategicShifts: [
            'Build a culture that values completion',
            'Create systems that track and support follow-through',
            'Develop your team\'s ability to complete what they start',
          ],
        },
        toneTags: {
          default: 'Reliable and completion-focused',
          bluntPracticalFriend: 'Start it. Finish it.',
          formalEmpatheticCoach: 'Follow-through that honors both commitment and flexibility',
          balancedMentor: 'Complete what matters, adapt when needed',
        },
      },
      {
        id: 'processImprovement',
        name: 'Process Improvement',
        shortDescription: 'Continuously improving how work gets done',
        longDescription: 'The ability to identify inefficiencies, experiment with better approaches, and create systems that make work easier and more effective.',
        strengthSignals: [
          'You regularly identify and fix inefficiencies',
          'You experiment with new approaches to improve outcomes',
          'Your processes get better over time',
          'Team members suggest process improvements',
        ],
        riskSignals: {
          underuse: [
            'You repeat inefficient processes',
            'You don\'t learn from mistakes or inefficiencies',
            'Work takes longer or is harder than it needs to be',
          ],
          overuse: [
            'You change processes constantly, creating instability',
            'You optimize processes that don\'t matter',
            'You focus on process at the expense of outcomes',
          ],
          imbalance: [
            'You improve some processes but not others',
            'You identify improvements but don\'t implement them',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask "How could this be easier or better?" regularly',
            'Document processes that work well',
            'Solicit feedback on processes from your team',
          ],
          situationalTactics: [
            'Conduct retrospectives after major projects',
            'Experiment with small process changes',
            'Measure process effectiveness and adjust',
          ],
          strategicShifts: [
            'Build a culture of continuous improvement',
            'Create systems for capturing and implementing process improvements',
            'Develop your team\'s ability to identify and implement improvements',
          ],
        },
        toneTags: {
          default: 'Improvement-oriented and efficient',
          bluntPracticalFriend: 'Find a better way. Make it happen.',
          formalEmpatheticCoach: 'Process improvement that honors both efficiency and people',
          balancedMentor: 'Improve processes while maintaining stability',
        },
      },
      {
        id: 'resultsOrientation',
        name: 'Results Orientation',
        shortDescription: 'Focusing on outcomes and impact',
        longDescription: 'The ability to stay focused on results, measure what matters, and adjust course based on outcomes. Strong results orientation means you deliver impact, not just activity.',
        strengthSignals: [
          'You consistently deliver measurable results',
          'You focus on outcomes, not just activities',
          'You measure what matters and adjust based on results',
          'You can articulate the impact of your work',
        ],
        riskSignals: {
          underuse: [
            'You focus on activities without clear results',
            'You can\'t measure or articulate the impact of your work',
            'You don\'t adjust course when results aren\'t coming',
          ],
          overuse: [
            'You focus only on results at the expense of relationships',
            'You measure the wrong things',
            'You become too focused on metrics and lose sight of purpose',
          ],
          imbalance: [
            'You deliver results in some areas but not others',
            'You achieve results but at unsustainable cost',
          ],
        },
        actions: {
          dailyHabits: [
            'Start each week by identifying desired results',
            'Track progress toward results regularly',
            'Ask "What result am I trying to achieve?" before starting work',
          ],
          situationalTactics: [
            'Define success metrics before starting initiatives',
            'Review results regularly and adjust course',
            'Celebrate results, not just effort',
          ],
          strategicShifts: [
            'Build a culture that values results',
            'Create systems that make results visible and measurable',
            'Develop your team\'s ability to deliver results',
          ],
        },
        toneTags: {
          default: 'Results-driven and impact-focused',
          bluntPracticalFriend: 'Focus on results. Measure impact.',
          formalEmpatheticCoach: 'Results orientation that honors both outcomes and people',
          balancedMentor: 'Deliver results while maintaining relationships and values',
        },
      },
    ],
  },
  {
    id: 'teamDevelopment',
    name: 'Team Development & Coaching',
    description: 'The ability to develop, mentor, and grow team members to reach their potential.',
    subTraits: [
      {
        id: 'talentIdentification',
        name: 'Talent Identification',
        shortDescription: 'Recognizing potential and strengths in others',
        longDescription: 'The ability to see what people are capable of, identify their strengths, and match talent to opportunities. Strong talent identification means you help people find roles where they can excel.',
        strengthSignals: [
          'You consistently identify people\'s strengths accurately',
          'You see potential in people others might overlook',
          'You match people to roles where they can succeed',
          'People feel understood and valued for their unique contributions',
        ],
        riskSignals: {
          underuse: [
            'You don\'t recognize people\'s strengths or potential',
            'You place people in roles that don\'t fit their abilities',
            'You miss opportunities to develop talent',
          ],
          overuse: [
            'You overestimate people\'s capabilities',
            'You see potential everywhere but don\'t act on it',
            'You focus on potential at the expense of current performance',
          ],
          imbalance: [
            'You identify talent well but don\'t develop it',
            'You see strengths in some people but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Observe what people do well and note it',
            'Ask "What are this person\'s unique strengths?" regularly',
            'Provide opportunities for people to showcase different skills',
          ],
          situationalTactics: [
            'Use assessments or structured conversations to identify strengths',
            'Give people stretch assignments to reveal capabilities',
            'Seek input from others who know the person well',
          ],
          strategicShifts: [
            'Build a process for identifying and tracking talent',
            'Create development opportunities based on identified strengths',
            'Develop your own ability to recognize potential',
          ],
        },
        toneTags: {
          default: 'Talent-aware and development-focused',
          bluntPracticalFriend: 'See their strengths. Use them.',
          formalEmpatheticCoach: 'Talent identification that honors individual potential',
          balancedMentor: 'Recognize talent and create opportunities for growth',
        },
      },
      {
        id: 'coaching',
        name: 'Coaching',
        shortDescription: 'Helping others develop skills and capabilities',
        longDescription: 'The ability to ask powerful questions, provide feedback, and guide others to their own solutions. Strong coaching means you help people grow rather than just telling them what to do.',
        strengthSignals: [
          'People seek you out for coaching and guidance',
          'You help others discover solutions rather than providing answers',
          'Your coaching leads to measurable improvement',
          'People feel empowered after coaching conversations',
        ],
        riskSignals: {
          underuse: [
            'You tell people what to do instead of helping them learn',
            'You don\'t provide feedback or guidance',
            'People don\'t improve despite your involvement',
          ],
          overuse: [
            'You over-coach, creating dependency',
            'You coach when direction is needed',
            'You focus on coaching at the expense of results',
          ],
          imbalance: [
            'You coach some people well but not others',
            'You ask questions but don\'t provide enough guidance',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask "What do you think?" before offering solutions',
            'Use open-ended questions to guide thinking',
            'Provide specific, actionable feedback regularly',
          ],
          situationalTactics: [
            'Use the GROW model (Goals, Reality, Options, Will) for coaching',
            'Balance questions with direct feedback when needed',
            'Follow up on coaching conversations to track progress',
          ],
          strategicShifts: [
            'Build coaching skills through training and practice',
            'Create a culture where coaching is valued',
            'Develop your team\'s ability to coach each other',
          ],
        },
        toneTags: {
          default: 'Supportive and growth-oriented',
          bluntPracticalFriend: 'Help them figure it out. Don\'t do it for them.',
          formalEmpatheticCoach: 'Coaching that honors both growth and performance',
          balancedMentor: 'Guide development while maintaining accountability',
        },
      },
      {
        id: 'mentoring',
        name: 'Mentoring',
        shortDescription: 'Sharing wisdom and experience to guide others',
        longDescription: 'The ability to share your experience, provide perspective, and help others navigate their careers and challenges. Strong mentoring means you help people learn from your successes and failures.',
        strengthSignals: [
          'People value your perspective and advice',
          'You share relevant experiences that help others',
          'Your mentees make better decisions because of your guidance',
          'You help people see possibilities they hadn\'t considered',
        ],
        riskSignals: {
          underuse: [
            'You don\'t share your experience or wisdom',
            'You let people make mistakes you could help them avoid',
            'People don\'t seek your guidance',
          ],
          overuse: [
            'You over-share experiences that aren\'t relevant',
            'You impose your path on others',
            'You mentor when coaching or direction is needed',
          ],
          imbalance: [
            'You mentor some people but not others',
            'You share experience but don\'t help people apply it',
          ],
        },
        actions: {
          dailyHabits: [
            'Share relevant experiences when they can help others',
            'Ask "Have you considered...?" to offer perspective',
            'Connect people with opportunities and resources',
          ],
          situationalTactics: [
            'Share both successes and failures as learning opportunities',
            'Help people see the bigger picture',
            'Provide career guidance when asked',
          ],
          strategicShifts: [
            'Build formal mentoring relationships',
            'Create opportunities for cross-generational learning',
            'Develop your ability to share wisdom effectively',
          ],
        },
        toneTags: {
          default: 'Wise and guidance-oriented',
          bluntPracticalFriend: 'Share what you know. Help them avoid your mistakes.',
          formalEmpatheticCoach: 'Mentoring that honors both wisdom and autonomy',
          balancedMentor: 'Share experience while encouraging independent thinking',
        },
      },
      {
        id: 'delegation',
        name: 'Delegation',
        shortDescription: 'Empowering others through appropriate assignment of work',
        longDescription: 'The ability to identify what to delegate, choose the right person, provide clear direction, and let go. Strong delegation means you develop people while getting work done.',
        strengthSignals: [
          'You delegate work that develops people\'s capabilities',
          'You provide clear direction and then let people execute',
          'Delegated work is completed successfully',
          'People grow through delegated opportunities',
        ],
        riskSignals: {
          underuse: [
            'You do work that others could do',
            'You don\'t trust others to handle important tasks',
            'You become a bottleneck because you don\'t delegate',
          ],
          overuse: [
            'You delegate work you should do yourself',
            'You delegate without providing direction or support',
            'You use delegation to avoid difficult work',
          ],
          imbalance: [
            'You delegate some types of work but not others',
            'You delegate but don\'t provide enough support',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask "Who could do this?" before taking on work yourself',
            'Delegate work that develops people\'s skills',
            'Provide clear expectations and then step back',
          ],
          situationalTactics: [
            'Match work to people\'s development needs',
            'Provide support without micromanaging',
            'Review delegated work to ensure quality and provide feedback',
          ],
          strategicShifts: [
            'Build a culture where delegation is expected and valued',
            'Develop your team\'s capability to handle delegated work',
            'Create systems that make delegation easier and more effective',
          ],
        },
        toneTags: {
          default: 'Empowering and trust-building',
          bluntPracticalFriend: 'Delegate. Trust. Support.',
          formalEmpatheticCoach: 'Delegation that honors both development and outcomes',
          balancedMentor: 'Empower others while maintaining accountability',
        },
      },
      {
        id: 'feedback',
        name: 'Giving Feedback',
        shortDescription: 'Providing constructive input to help others improve',
        longDescription: 'The ability to give feedback that is specific, actionable, and delivered in a way that helps people improve. Strong feedback means people understand what to change and feel motivated to do so.',
        strengthSignals: [
          'People act on your feedback and improve',
          'You give feedback that is specific and actionable',
          'People feel supported, not criticized, by your feedback',
          'Your feedback helps people understand their impact',
        ],
        riskSignals: {
          underuse: [
            'You avoid giving difficult feedback',
            'People don\'t know how they\'re performing',
            'Problems persist because feedback isn\'t given',
          ],
          overuse: [
            'You give feedback constantly, creating anxiety',
            'Your feedback is too critical or demotivating',
            'You focus on what\'s wrong without acknowledging what\'s right',
          ],
          imbalance: [
            'You give positive feedback but avoid negative feedback (or vice versa)',
            'You give feedback to some people but not others',
          ],
        },
        actions: {
          dailyHabits: [
            'Give feedback soon after observing behavior',
            'Balance positive and constructive feedback',
            'Make feedback specific and actionable',
          ],
          situationalTactics: [
            'Use the SBI model (Situation, Behavior, Impact) for feedback',
            'Ask for permission before giving unsolicited feedback',
            'Follow up on feedback to see if it was helpful',
          ],
          strategicShifts: [
            'Build a culture where feedback is expected and valued',
            'Create regular opportunities for feedback (1-on-1s, reviews)',
            'Develop your team\'s ability to give and receive feedback',
          ],
        },
        toneTags: {
          default: 'Supportive and improvement-focused',
          bluntPracticalFriend: 'Tell them what they need to hear. Help them improve.',
          formalEmpatheticCoach: 'Feedback that honors both truth and care',
          balancedMentor: 'Honest feedback delivered with support',
        },
      },
      {
        id: 'careerDevelopment',
        name: 'Career Development',
        shortDescription: 'Helping others grow their careers',
        longDescription: 'The ability to help people understand their career options, develop skills, and advance. Strong career development means you help people grow beyond their current role.',
        strengthSignals: [
          'You help people identify career goals and paths',
          'You provide opportunities that develop career-relevant skills',
          'People advance in their careers with your support',
          'You celebrate people\'s career growth, even when it means they leave',
        ],
        riskSignals: {
          underuse: [
            'You don\'t discuss career goals with your team',
            'You don\'t provide opportunities for career growth',
            'People feel stuck or unclear about their career path',
          ],
          overuse: [
            'You focus on career development at the expense of current performance',
            'You promise career opportunities you can\'t deliver',
            'You push people toward careers they don\'t want',
          ],
          imbalance: [
            'You support career development for some but not others',
            'You discuss careers but don\'t provide opportunities',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask about career goals in 1-on-1s',
            'Connect people with opportunities that develop their careers',
            'Celebrate career milestones and growth',
          ],
          situationalTactics: [
            'Create development plans that align with career goals',
            'Provide stretch assignments that build career-relevant skills',
            'Help people understand their career options',
          ],
          strategicShifts: [
            'Build a culture that values career development',
            'Create pathways for career growth within the organization',
            'Develop your ability to guide career development',
          ],
        },
        toneTags: {
          default: 'Growth-oriented and supportive',
          bluntPracticalFriend: 'Help them grow. Even if it means they leave.',
          formalEmpatheticCoach: 'Career development that honors both individual and organizational needs',
          balancedMentor: 'Support career growth while maintaining team performance',
        },
      },
      {
        id: 'performanceManagement',
        name: 'Performance Management',
        shortDescription: 'Setting expectations and managing performance',
        longDescription: 'The ability to set clear expectations, monitor performance, address issues, and recognize achievements. Strong performance management means people know what\'s expected and how they\'re doing.',
        strengthSignals: [
          'People understand what\'s expected of them',
          'You address performance issues promptly and fairly',
          'You recognize and reward strong performance',
          'Performance improves as a result of your management',
        ],
        riskSignals: {
          underuse: [
            'You avoid addressing performance issues',
            'People don\'t know what\'s expected',
            'Performance problems persist',
          ],
          overuse: [
            'You micromanage performance',
            'You focus only on performance metrics, not people',
            'You create anxiety through constant performance monitoring',
          ],
          imbalance: [
            'You manage some people\'s performance but not others',
            'You set expectations but don\'t provide support to meet them',
          ],
        },
        actions: {
          dailyHabits: [
            'Set clear expectations for all work',
            'Provide regular performance feedback',
            'Address performance issues as soon as you notice them',
          ],
          situationalTactics: [
            'Use performance reviews to set goals and track progress',
            'Recognize achievements publicly and privately',
            'Create performance improvement plans when needed',
          ],
          strategicShifts: [
            'Build a culture of high performance',
            'Create systems that make performance visible and manageable',
            'Develop your team\'s ability to manage their own performance',
          ],
        },
        toneTags: {
          default: 'Clear and performance-focused',
          bluntPracticalFriend: 'Set the bar. Hold them to it.',
          formalEmpatheticCoach: 'Performance management that honors both standards and people',
          balancedMentor: 'High expectations with support to meet them',
        },
      },
      {
        id: 'teamBuilding',
        name: 'Team Building',
        shortDescription: 'Creating cohesive, high-performing teams',
        longDescription: 'The ability to bring people together, build trust, and create teams that are greater than the sum of their parts. Strong team building means you create environments where teams thrive.',
        strengthSignals: [
          'Your teams work well together',
          'Team members trust and support each other',
          'Teams deliver results that exceed individual contributions',
          'People want to be on your teams',
        ],
        riskSignals: {
          underuse: [
            'Your teams don\'t work well together',
            'There\'s conflict or lack of trust on your teams',
            'Teams don\'t deliver results',
          ],
          overuse: [
            'You focus on team building at the expense of results',
            'You force team activities that feel forced',
            'You prioritize harmony over necessary conflict',
          ],
          imbalance: [
            'Some teams work well but others don\'t',
            'You build teams but don\'t maintain them',
          ],
        },
        actions: {
          dailyHabits: [
            'Create opportunities for team members to connect',
            'Address team conflicts promptly',
            'Celebrate team achievements',
          ],
          situationalTactics: [
            'Use team-building activities that are relevant and meaningful',
            'Facilitate team discussions to build understanding',
            'Create shared goals that require collaboration',
          ],
          strategicShifts: [
            'Build a culture that values teamwork',
            'Create systems that support team collaboration',
            'Develop your ability to build and maintain high-performing teams',
          ],
        },
        toneTags: {
          default: 'Collaborative and team-focused',
          bluntPracticalFriend: 'Build the team. Make it work.',
          formalEmpatheticCoach: 'Team building that honors both relationships and results',
          balancedMentor: 'Strong teams that deliver strong results',
        },
      },
    ],
  },
  {
    id: 'emotionalIntelligence',
    name: 'Emotional Intelligence & Regulation',
    description: 'The ability to recognize, understand, and manage emotions in yourself and others.',
    subTraits: [
      {
        id: 'selfAwareness',
        name: 'Self-Awareness',
        shortDescription: 'Understanding your own emotions and their impact',
        longDescription: 'The ability to recognize your emotions as they occur, understand what triggers them, and see how they affect your behavior and decisions. Strong self-awareness means you know yourself well.',
        strengthSignals: [
          'You can identify your emotions accurately',
          'You understand what triggers different emotional responses',
          'You see how your emotions affect your behavior',
          'You can articulate your emotional patterns',
        ],
        riskSignals: {
          underuse: [
            'You\'re unaware of your emotions or their impact',
            'You\'re surprised by your emotional reactions',
            'Your emotions control you rather than the other way around',
          ],
          overuse: [
            'You over-analyze your emotions to the point of inaction',
            'You focus on yourself at the expense of others',
            'You become paralyzed by self-reflection',
          ],
          imbalance: [
            'You\'re aware of some emotions but not others',
            'You understand emotions but don\'t manage them',
          ],
        },
        actions: {
          dailyHabits: [
            'Check in with yourself: "What am I feeling right now?"',
            'Notice physical sensations that accompany emotions',
            'Reflect on emotional patterns at the end of each day',
          ],
          situationalTactics: [
            'Pause before reacting to understand your emotional state',
            'Ask trusted others for feedback on your emotional patterns',
            'Keep an emotion journal to identify patterns',
          ],
          strategicShifts: [
            'Build self-awareness through mindfulness or therapy',
            'Develop your emotional vocabulary',
            'Create habits that support emotional awareness',
          ],
        },
        toneTags: {
          default: 'Self-aware and reflective',
          bluntPracticalFriend: 'Know yourself. Manage yourself.',
          formalEmpatheticCoach: 'Self-awareness that honors both understanding and growth',
          balancedMentor: 'Understand your emotions to better manage them',
        },
      },
      {
        id: 'selfRegulation',
        name: 'Self-Regulation',
        shortDescription: 'Managing your emotional responses effectively',
        longDescription: 'The ability to control your emotional reactions, choose your responses, and maintain composure under pressure. Strong self-regulation means you respond thoughtfully rather than react impulsively.',
        strengthSignals: [
          'You remain calm under pressure',
          'You choose your responses rather than reacting impulsively',
          'You don\'t let emotions derail your decisions',
          'You can delay gratification and control impulses',
        ],
        riskSignals: {
          underuse: [
            'You react impulsively to emotions',
            'Your emotions frequently derail your decisions',
            'You struggle to control emotional outbursts',
          ],
          overuse: [
            'You suppress emotions to the point of being disconnected',
            'You\'re so controlled you seem robotic',
            'You avoid situations that might trigger emotions',
          ],
          imbalance: [
            'You regulate some emotions well but not others',
            'You control emotions but don\'t express them appropriately',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice deep breathing when you feel strong emotions',
            'Count to 10 before responding to emotional triggers',
            'Use physical activity to manage emotional energy',
          ],
          situationalTactics: [
            'Remove yourself from situations when emotions are too strong',
            'Use reframing to change your emotional response',
            'Practice responding rather than reacting',
          ],
          strategicShifts: [
            'Build emotional regulation skills through practice',
            'Develop coping strategies for different emotional triggers',
            'Create environments that support emotional regulation',
          ],
        },
        toneTags: {
          default: 'Composed and self-controlled',
          bluntPracticalFriend: 'Control your emotions. Don\'t let them control you.',
          formalEmpatheticCoach: 'Self-regulation that honors both control and expression',
          balancedMentor: 'Manage emotions while staying authentic',
        },
      },
      {
        id: 'empathy',
        name: 'Empathy',
        shortDescription: 'Understanding and sharing others\' emotions',
        longDescription: 'The ability to recognize, understand, and share the feelings of others. Strong empathy means you can see things from others\' perspectives and respond appropriately to their emotional states.',
        strengthSignals: [
          'You can accurately read others\' emotions',
          'You understand how others are feeling',
          'You respond appropriately to others\' emotional states',
          'People feel understood when they talk to you',
        ],
        riskSignals: {
          underuse: [
            'You miss emotional cues from others',
            'You don\'t understand how others are feeling',
            'You respond inappropriately to others\' emotions',
          ],
          overuse: [
            'You become overwhelmed by others\' emotions',
            'You take on others\' emotional burdens inappropriately',
            'You lose your own perspective trying to understand others',
          ],
          imbalance: [
            'You\'re empathetic with some people but not others',
            'You understand emotions but don\'t know how to respond',
          ],
        },
        actions: {
          dailyHabits: [
            'Pay attention to others\' body language and tone',
            'Ask "How are you feeling?" and listen to the answer',
            'Practice seeing situations from others\' perspectives',
          ],
          situationalTactics: [
            'Reflect back what you\'re hearing: "It sounds like you\'re feeling..."',
            'Validate others\' emotions before problem-solving',
            'Match your communication style to others\' emotional states',
          ],
          strategicShifts: [
            'Build empathy through active listening and perspective-taking',
            'Develop your ability to read and respond to emotional cues',
            'Create environments where empathy is valued',
          ],
        },
        toneTags: {
          default: 'Understanding and compassionate',
          bluntPracticalFriend: 'Get where they\'re coming from. Then help.',
          formalEmpatheticCoach: 'Empathy that honors both understanding and boundaries',
          balancedMentor: 'Understand others while maintaining your own perspective',
        },
      },
      {
        id: 'socialAwareness',
        name: 'Social Awareness',
        shortDescription: 'Reading social dynamics and group emotions',
        longDescription: 'The ability to understand group dynamics, read the emotional climate, and navigate social situations effectively. Strong social awareness means you understand the social context you\'re operating in.',
        strengthSignals: [
          'You understand group dynamics and social situations',
          'You can read the emotional climate of a room',
          'You navigate social situations effectively',
          'You understand power dynamics and social hierarchies',
        ],
        riskSignals: {
          underuse: [
            'You miss social cues and dynamics',
            'You don\'t understand group emotions or climate',
            'You struggle to navigate social situations',
          ],
          overuse: [
            'You over-analyze social situations',
            'You become overly concerned with what others think',
            'You lose authenticity trying to read social situations',
          ],
          imbalance: [
            'You\'re aware in some social contexts but not others',
            'You read situations but don\'t know how to respond',
          ],
        },
        actions: {
          dailyHabits: [
            'Observe group dynamics in meetings and interactions',
            'Notice the emotional climate of different situations',
            'Pay attention to power dynamics and social hierarchies',
          ],
          situationalTactics: [
            'Adjust your approach based on social context',
            'Address group emotions when they\'re affecting performance',
            'Use social awareness to build relationships and influence',
          ],
          strategicShifts: [
            'Build social awareness through observation and practice',
            'Develop your ability to read and respond to group dynamics',
            'Create environments that support social awareness',
          ],
        },
        toneTags: {
          default: 'Socially aware and context-sensitive',
          bluntPracticalFriend: 'Read the room. Act accordingly.',
          formalEmpatheticCoach: 'Social awareness that honors both context and authenticity',
          balancedMentor: 'Navigate social dynamics while staying true to yourself',
        },
      },
      {
        id: 'relationshipManagement',
        name: 'Relationship Management',
        shortDescription: 'Building and maintaining positive relationships',
        longDescription: 'The ability to build rapport, maintain relationships, and manage conflicts effectively. Strong relationship management means you have positive, productive relationships with others.',
        strengthSignals: [
          'You build rapport easily with others',
          'You maintain positive relationships over time',
          'You manage conflicts effectively',
          'People want to work with you',
        ],
        riskSignals: {
          underuse: [
            'You struggle to build relationships',
            'You avoid conflict, leading to unresolved issues',
            'You don\'t maintain relationships over time',
          ],
          overuse: [
            'You prioritize relationships at the expense of results',
            'You avoid necessary conflict to maintain relationships',
            'You become overly dependent on others\' approval',
          ],
          imbalance: [
            'You build some relationships well but not others',
            'You build relationships but don\'t maintain them',
          ],
        },
        actions: {
          dailyHabits: [
            'Make time for relationship-building activities',
            'Follow up on commitments to maintain trust',
            'Address conflicts directly rather than avoiding them',
          ],
          situationalTactics: [
            'Use active listening to build rapport',
            'Find common ground with others',
            'Manage conflicts by focusing on interests, not positions',
          ],
          strategicShifts: [
            'Build a network of positive relationships',
            'Develop your conflict management skills',
            'Create a culture that values relationships',
          ],
        },
        toneTags: {
          default: 'Relationship-focused and collaborative',
          bluntPracticalFriend: 'Build relationships. Maintain them.',
          formalEmpatheticCoach: 'Relationship management that honors both connection and boundaries',
          balancedMentor: 'Strong relationships that support performance',
        },
      },
      {
        id: 'stressManagement',
        name: 'Stress Management',
        shortDescription: 'Managing pressure and maintaining well-being',
        longDescription: 'The ability to handle pressure, manage stress, and maintain your well-being even in challenging situations. Strong stress management means you perform well under pressure.',
        strengthSignals: [
          'You perform well under pressure',
          'You manage stress effectively',
          'You maintain your well-being even in challenging times',
          'You help others manage stress',
        ],
        riskSignals: {
          underuse: [
            'You become overwhelmed by stress',
            'Stress affects your performance and decisions',
            'You don\'t take care of your well-being',
          ],
          overuse: [
            'You avoid stressful situations entirely',
            'You suppress stress to the point of burnout',
            'You don\'t recognize when you\'re stressed',
          ],
          imbalance: [
            'You manage some types of stress but not others',
            'You manage your own stress but create stress for others',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice stress-reduction techniques (meditation, exercise)',
            'Set boundaries to protect your well-being',
            'Recognize early signs of stress and address them',
          ],
          situationalTactics: [
            'Use breathing exercises when feeling stressed',
            'Take breaks when stress is building',
            'Seek support when stress becomes overwhelming',
          ],
          strategicShifts: [
            'Build stress management into your regular routine',
            'Create environments that support well-being',
            'Develop your team\'s ability to manage stress',
          ],
        },
        toneTags: {
          default: 'Resilient and well-being focused',
          bluntPracticalFriend: 'Manage stress. Don\'t let it manage you.',
          formalEmpatheticCoach: 'Stress management that honors both performance and well-being',
          balancedMentor: 'Handle pressure while maintaining health',
        },
      },
    ],
  },
  {
    id: 'accountability',
    name: 'Accountability & Ownership',
    description: 'Taking responsibility for outcomes and holding yourself and others to high standards.',
    subTraits: [
      {
        id: 'personalAccountability',
        name: 'Personal Accountability',
        shortDescription: 'Taking responsibility for your actions and outcomes',
        longDescription: 'The ability to own your decisions, actions, and results without making excuses or blaming others. Strong personal accountability means you take responsibility even when things go wrong.',
        strengthSignals: [
          'You take responsibility for outcomes, good or bad',
          'You don\'t make excuses or blame others',
          'You learn from mistakes and improve',
          'Others can count on you to own your commitments',
        ],
        riskSignals: {
          underuse: [
            'You make excuses or blame others when things go wrong',
            'You don\'t take responsibility for your actions',
            'You avoid accountability for poor outcomes',
          ],
          overuse: [
            'You take responsibility for things outside your control',
            'You become overly self-critical',
            'You accept blame that isn\'t yours',
          ],
          imbalance: [
            'You take accountability for some things but not others',
            'You own mistakes but don\'t learn from them',
          ],
        },
        actions: {
          dailyHabits: [
            'Acknowledge mistakes and failures directly',
            'Focus on what you can control rather than what you can\'t',
            'Ask "What could I have done differently?" after setbacks',
          ],
          situationalTactics: [
            'Take responsibility publicly when appropriate',
            'Make amends when your actions cause problems',
            'Share learnings from mistakes with your team',
          ],
          strategicShifts: [
            'Build a culture of personal accountability',
            'Model accountability in your leadership',
            'Create systems that support accountability',
          ],
        },
        toneTags: {
          default: 'Responsible and ownership-focused',
          bluntPracticalFriend: 'Own it. Fix it. Learn from it.',
          formalEmpatheticCoach: 'Accountability that honors both responsibility and growth',
          balancedMentor: 'Take ownership while maintaining perspective',
        },
      },
      {
        id: 'holdingOthersAccountable',
        name: 'Holding Others Accountable',
        shortDescription: 'Ensuring others meet their commitments',
        longDescription: 'The ability to set clear expectations, monitor progress, and address issues when commitments aren\'t met. Strong accountability means you help others succeed while holding them to standards.',
        strengthSignals: [
          'You set clear expectations and hold people to them',
          'You address performance issues promptly and fairly',
          'People meet their commitments because you hold them accountable',
          'You balance accountability with support',
        ],
        riskSignals: {
          underuse: [
            'You avoid holding people accountable',
            'You don\'t address performance issues',
            'Commitments aren\'t met because accountability is lacking',
          ],
          overuse: [
            'You hold people accountable in a way that feels punitive',
            'You micromanage to ensure accountability',
            'You create fear rather than accountability',
          ],
          imbalance: [
            'You hold some people accountable but not others',
            'You set expectations but don\'t follow through',
          ],
        },
        actions: {
          dailyHabits: [
            'Set clear expectations for all commitments',
            'Check in regularly on progress toward commitments',
            'Address issues as soon as you notice them',
          ],
          situationalTactics: [
            'Use accountability conversations to understand and address issues',
            'Provide support to help people meet commitments',
            'Celebrate when commitments are met',
          ],
          strategicShifts: [
            'Build a culture where accountability is expected and valued',
            'Create systems that make accountability visible',
            'Develop your team\'s ability to hold themselves accountable',
          ],
        },
        toneTags: {
          default: 'Fair and standards-driven',
          bluntPracticalFriend: 'Set expectations. Hold them to it.',
          formalEmpatheticCoach: 'Accountability that honors both standards and support',
          balancedMentor: 'High standards with support to meet them',
        },
      },
      {
        id: 'transparency',
        name: 'Transparency',
        shortDescription: 'Being open and honest about decisions and outcomes',
        longDescription: 'The ability to share information openly, explain decisions, and be honest about outcomes. Strong transparency means people trust you because you\'re open about what\'s happening.',
        strengthSignals: [
          'You share information openly and proactively',
          'You explain decisions and their rationale',
          'You\'re honest about both successes and failures',
          'People trust you because you\'re transparent',
        ],
        riskSignals: {
          underuse: [
            'You withhold information unnecessarily',
            'You don\'t explain decisions or their rationale',
            'People don\'t trust you because of lack of transparency',
          ],
          overuse: [
            'You share information that shouldn\'t be shared',
            'You\'re transparent to the point of creating anxiety',
            'You overshare personal information inappropriately',
          ],
          imbalance: [
            'You\'re transparent about some things but not others',
            'You share information but don\'t explain context',
          ],
        },
        actions: {
          dailyHabits: [
            'Share information proactively rather than reactively',
            'Explain the "why" behind decisions',
            'Be honest about both good and bad news',
          ],
          situationalTactics: [
            'Use regular communication to maintain transparency',
            'Share information even when it\'s difficult',
            'Create forums for questions and feedback',
          ],
          strategicShifts: [
            'Build a culture of transparency',
            'Create systems that make information accessible',
            'Develop your team\'s ability to handle transparency',
          ],
        },
        toneTags: {
          default: 'Open and honest',
          bluntPracticalFriend: 'Be honest. Share what matters.',
          formalEmpatheticCoach: 'Transparency that honors both openness and discretion',
          balancedMentor: 'Open communication that builds trust',
        },
      },
      {
        id: 'integrity',
        name: 'Integrity',
        shortDescription: 'Acting consistently with your values',
        longDescription: 'The ability to act in alignment with your stated values, even when it\'s difficult. Strong integrity means people trust you because your words and actions match.',
        strengthSignals: [
          'Your actions align with your stated values',
          'You do the right thing even when it\'s hard',
          'People trust you because you\'re consistent',
          'You can be counted on to keep your word',
        ],
        riskSignals: {
          underuse: [
            'Your actions don\'t match your words',
            'You compromise your values when it\'s convenient',
            'People don\'t trust you because of inconsistency',
          ],
          overuse: [
            'You\'re rigid about values to the point of being inflexible',
            'You judge others harshly for not sharing your values',
            'You prioritize values at the expense of practical outcomes',
          ],
          imbalance: [
            'You demonstrate integrity in some areas but not others',
            'You have integrity but don\'t communicate your values',
          ],
        },
        actions: {
          dailyHabits: [
            'Reflect on whether your actions match your values',
            'Make decisions based on values, not just convenience',
            'Keep your commitments, even when it\'s difficult',
          ],
          situationalTactics: [
            'Stand up for your values when they\'re challenged',
            'Acknowledge when you fall short of your values',
            'Make values-based decisions transparent',
          ],
          strategicShifts: [
            'Clarify and communicate your core values',
            'Build a culture that values integrity',
            'Create systems that support values-based decisions',
          ],
        },
        toneTags: {
          default: 'Values-driven and consistent',
          bluntPracticalFriend: 'Do what you say. Say what you mean.',
          formalEmpatheticCoach: 'Integrity that honors both values and practicality',
          balancedMentor: 'Live your values while staying flexible',
        },
      },
      {
        id: 'ownership',
        name: 'Ownership',
        shortDescription: 'Taking full responsibility for outcomes',
        longDescription: 'The ability to take complete responsibility for results, whether they\'re good or bad. Strong ownership means you don\'t pass blame or make excuses.',
        strengthSignals: [
          'You take full ownership of outcomes',
          'You don\'t pass blame or make excuses',
          'You fix problems rather than pointing fingers',
          'Others can count on you to own results',
        ],
        riskSignals: {
          underuse: [
            'You pass blame or make excuses',
            'You don\'t take ownership of outcomes',
            'You avoid responsibility when things go wrong',
          ],
          overuse: [
            'You take ownership of things outside your control',
            'You become overly self-critical',
            'You accept blame that isn\'t yours',
          ],
          imbalance: [
            'You take ownership of some outcomes but not others',
            'You own failures but don\'t own successes',
          ],
        },
        actions: {
          dailyHabits: [
            'Say "I own this" when taking on responsibility',
            'Focus on solutions rather than blame',
            'Acknowledge your role in outcomes, good or bad',
          ],
          situationalTactics: [
            'Take ownership publicly when appropriate',
            'Fix problems rather than explaining why they happened',
            'Share credit and take responsibility',
          ],
          strategicShifts: [
            'Build a culture of ownership',
            'Model ownership in your leadership',
            'Create systems that support ownership',
          ],
        },
        toneTags: {
          default: 'Responsible and outcome-focused',
          bluntPracticalFriend: 'Own it. All of it.',
          formalEmpatheticCoach: 'Ownership that honors both responsibility and growth',
          balancedMentor: 'Take full ownership while maintaining perspective',
        },
      },
      {
        id: 'reliability',
        name: 'Reliability',
        shortDescription: 'Consistently delivering on commitments',
        longDescription: 'The ability to follow through on commitments, meet deadlines, and be someone others can count on. Strong reliability means people trust you to do what you say you\'ll do.',
        strengthSignals: [
          'You consistently meet your commitments',
          'You follow through on what you say you\'ll do',
          'People can count on you',
          'You communicate proactively when commitments are at risk',
        ],
        riskSignals: {
          underuse: [
            'You don\'t follow through on commitments',
            'People can\'t count on you',
            'You make commitments you can\'t keep',
          ],
          overuse: [
            'You over-commit to avoid disappointing others',
            'You become a bottleneck because you won\'t say no',
            'You sacrifice your well-being to meet commitments',
          ],
          imbalance: [
            'You\'re reliable for some commitments but not others',
            'You meet commitments but don\'t communicate about them',
          ],
        },
        actions: {
          dailyHabits: [
            'Only make commitments you can keep',
            'Track your commitments to ensure follow-through',
            'Communicate proactively when commitments are at risk',
          ],
          situationalTactics: [
            'Say "no" to commitments you can\'t realistically meet',
            'Set realistic expectations from the start',
            'Celebrate when you meet commitments',
          ],
          strategicShifts: [
            'Build a culture of reliability',
            'Create systems that support reliable execution',
            'Develop your team\'s ability to be reliable',
          ],
        },
        toneTags: {
          default: 'Dependable and commitment-focused',
          bluntPracticalFriend: 'Do what you say. Every time.',
          formalEmpatheticCoach: 'Reliability that honors both commitments and well-being',
          balancedMentor: 'Be reliable while maintaining boundaries',
        },
      },
    ],
  },
  {
    id: 'changeAdaptability',
    name: 'Change & Adaptability',
    description: 'The ability to navigate change, adapt to new circumstances, and help others through transitions.',
    subTraits: [
      {
        id: 'adaptability',
        name: 'Adaptability',
        shortDescription: 'Adjusting quickly to new situations',
        longDescription: 'The ability to change your approach, pivot when needed, and thrive in new circumstances. Strong adaptability means you can adjust without losing effectiveness.',
        strengthSignals: [
          'You adjust quickly to new situations',
          'You can pivot when circumstances change',
          'You thrive in ambiguous or changing environments',
          'You don\'t get stuck when things don\'t go as planned',
        ],
        riskSignals: {
          underuse: [
            'You struggle to adjust when circumstances change',
            'You get stuck when things don\'t go as planned',
            'You resist change even when it\'s necessary',
          ],
          overuse: [
            'You change direction too frequently',
            'You adapt so quickly you lose focus',
            'You abandon plans at the first sign of difficulty',
          ],
          imbalance: [
            'You adapt well in some situations but not others',
            'You adapt but don\'t communicate changes',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice flexibility in small ways daily',
            'Look for opportunities to try new approaches',
            'Reflect on what you learned from adapting',
          ],
          situationalTactics: [
            'Pause and assess before reacting to change',
            'Identify what needs to change and what can stay the same',
            'Communicate changes clearly to your team',
          ],
          strategicShifts: [
            'Build adaptability into your regular approach',
            'Create a culture that values flexibility',
            'Develop your team\'s ability to adapt',
          ],
        },
        toneTags: {
          default: 'Flexible and responsive',
          bluntPracticalFriend: 'Adapt. Move forward.',
          formalEmpatheticCoach: 'Adaptability that honors both flexibility and stability',
          balancedMentor: 'Stay flexible while maintaining focus',
        },
      },
      {
        id: 'changeLeadership',
        name: 'Change Leadership',
        shortDescription: 'Leading others through transitions',
        longDescription: 'The ability to guide others through change, help them understand why change is needed, and support them through transitions. Strong change leadership means you help people navigate uncertainty.',
        strengthSignals: [
          'You help others navigate change effectively',
          'You communicate the "why" behind change',
          'You support people through transitions',
          'Change initiatives succeed because of your leadership',
        ],
        riskSignals: {
          underuse: [
            'You don\'t help others through change',
            'You implement change without explaining why',
            'People resist change because of poor leadership',
          ],
          overuse: [
            'You change things unnecessarily',
            'You focus on change at the expense of stability',
            'You create change fatigue',
          ],
          imbalance: [
            'You lead some changes well but not others',
            'You communicate change but don\'t support people through it',
          ],
        },
        actions: {
          dailyHabits: [
            'Communicate the "why" behind changes',
            'Acknowledge the difficulty of change',
            'Provide support to people navigating transitions',
          ],
          situationalTactics: [
            'Create a clear vision for what change will achieve',
            'Involve people in planning change when possible',
            'Celebrate progress through transitions',
          ],
          strategicShifts: [
            'Build change leadership capabilities',
            'Create a culture that embraces change',
            'Develop your team\'s ability to navigate change',
          ],
        },
        toneTags: {
          default: 'Change-oriented and supportive',
          bluntPracticalFriend: 'Lead the change. Support the people.',
          formalEmpatheticCoach: 'Change leadership that honors both progress and people',
          balancedMentor: 'Guide change while supporting people',
        },
      },
      {
        id: 'resilience',
        name: 'Resilience',
        shortDescription: 'Bouncing back from setbacks',
        longDescription: 'The ability to recover quickly from difficulties, learn from failures, and maintain optimism. Strong resilience means you don\'t let setbacks derail you.',
        strengthSignals: [
          'You bounce back quickly from setbacks',
          'You learn from failures and improve',
          'You maintain optimism even in difficult times',
          'You help others build resilience',
        ],
        riskSignals: {
          underuse: [
            'You struggle to recover from setbacks',
            'Failures derail you for extended periods',
            'You become pessimistic after difficulties',
          ],
          overuse: [
            'You bounce back so quickly you don\'t learn from failures',
            'You maintain optimism to the point of ignoring problems',
            'You don\'t acknowledge the difficulty of setbacks',
          ],
          imbalance: [
            'You\'re resilient in some areas but not others',
            'You bounce back but don\'t learn from failures',
          ],
        },
        actions: {
          dailyHabits: [
            'Reflect on what you learned from setbacks',
            'Practice gratitude to maintain perspective',
            'Take care of your physical and mental well-being',
          ],
          situationalTactics: [
            'Acknowledge setbacks without dwelling on them',
            'Focus on what you can control',
            'Seek support when setbacks are significant',
          ],
          strategicShifts: [
            'Build resilience through practice and reflection',
            'Create a culture that supports resilience',
            'Develop your team\'s ability to bounce back',
          ],
        },
        toneTags: {
          default: 'Resilient and optimistic',
          bluntPracticalFriend: 'Fall down. Get up. Learn.',
          formalEmpatheticCoach: 'Resilience that honors both recovery and learning',
          balancedMentor: 'Bounce back while learning from setbacks',
        },
      },
      {
        id: 'innovation',
        name: 'Innovation',
        shortDescription: 'Embracing new ideas and approaches',
        longDescription: 'The ability to generate new ideas, experiment with different approaches, and embrace innovation. Strong innovation means you\'re open to new ways of doing things.',
        strengthSignals: [
          'You generate new ideas regularly',
          'You experiment with different approaches',
          'You embrace innovation and new ways of thinking',
          'Your innovations lead to improved outcomes',
        ],
        riskSignals: {
          underuse: [
            'You resist new ideas or approaches',
            'You stick to what\'s always been done',
            'You don\'t experiment or try new things',
          ],
          overuse: [
            'You chase every new idea without focus',
            'You innovate for innovation\'s sake',
            'You abandon proven approaches unnecessarily',
          ],
          imbalance: [
            'You innovate in some areas but not others',
            'You generate ideas but don\'t implement them',
          ],
        },
        actions: {
          dailyHabits: [
            'Ask "What if we tried...?" regularly',
            'Look for opportunities to improve existing processes',
            'Stay curious about new ideas and approaches',
          ],
          situationalTactics: [
            'Create space for experimentation',
            'Test new ideas on a small scale before full implementation',
            'Learn from both successful and failed innovations',
          ],
          strategicShifts: [
            'Build a culture that values innovation',
            'Create systems that support experimentation',
            'Develop your team\'s ability to innovate',
          ],
        },
        toneTags: {
          default: 'Innovative and open-minded',
          bluntPracticalFriend: 'Try new things. Learn from them.',
          formalEmpatheticCoach: 'Innovation that honors both creativity and practicality',
          balancedMentor: 'Embrace innovation while maintaining focus',
        },
      },
      {
        id: 'learningAgility',
        name: 'Learning Agility',
        shortDescription: 'Learning quickly from experience',
        longDescription: 'The ability to learn from experience, apply learnings to new situations, and continuously improve. Strong learning agility means you get better faster.',
        strengthSignals: [
          'You learn quickly from experience',
          'You apply learnings to new situations',
          'You continuously improve your performance',
          'You seek out learning opportunities',
        ],
        riskSignals: {
          underuse: [
            'You don\'t learn from experience',
            'You repeat the same mistakes',
            'You don\'t seek out learning opportunities',
          ],
          overuse: [
            'You focus on learning at the expense of doing',
            'You over-analyze experiences',
            'You change approaches too frequently based on single learnings',
          ],
          imbalance: [
            'You learn well in some areas but not others',
            'You learn but don\'t apply learnings',
          ],
        },
        actions: {
          dailyHabits: [
            'Reflect on what you learned each day',
            'Ask "What would I do differently?" after experiences',
            'Seek feedback to accelerate learning',
          ],
          situationalTactics: [
            'Conduct after-action reviews',
            'Apply learnings from one situation to another',
            'Share learnings with your team',
          ],
          strategicShifts: [
            'Build learning into your regular routine',
            'Create a culture that values learning',
            'Develop your team\'s learning agility',
          ],
        },
        toneTags: {
          default: 'Learning-oriented and growth-focused',
          bluntPracticalFriend: 'Learn fast. Apply faster.',
          formalEmpatheticCoach: 'Learning agility that honors both reflection and action',
          balancedMentor: 'Learn continuously while maintaining focus',
        },
      },
      {
        id: 'comfortWithAmbiguity',
        name: 'Comfort with Ambiguity',
        shortDescription: 'Thriving in uncertain situations',
        longDescription: 'The ability to operate effectively when information is incomplete, outcomes are uncertain, and the path forward is unclear. Strong comfort with ambiguity means you can make progress despite uncertainty.',
        strengthSignals: [
          'You can make progress despite uncertainty',
          'You don\'t need complete information to act',
          'You thrive in ambiguous situations',
          'You help others navigate uncertainty',
        ],
        riskSignals: {
          underuse: [
            'You struggle when information is incomplete',
            'You need certainty before acting',
            'Ambiguity causes you to delay or avoid decisions',
          ],
          overuse: [
            'You act without gathering available information',
            'You create ambiguity unnecessarily',
            'You don\'t seek clarity when it\'s available',
          ],
          imbalance: [
            'You\'re comfortable with some types of ambiguity but not others',
            'You handle ambiguity but don\'t help others with it',
          ],
        },
        actions: {
          dailyHabits: [
            'Practice making decisions with incomplete information',
            'Identify what information is "must have" vs. "nice to have"',
            'Build tolerance for uncertainty through exposure',
          ],
          situationalTactics: [
            'Use scenario planning when outcomes are uncertain',
            'Make reversible decisions quickly',
            'Communicate what you know and what you don\'t',
          ],
          strategicShifts: [
            'Build a culture that accepts ambiguity',
            'Create systems that allow for course correction',
            'Develop your team\'s ability to handle uncertainty',
          ],
        },
        toneTags: {
          default: 'Comfortable with uncertainty',
          bluntPracticalFriend: 'Uncertainty is normal. Move forward anyway.',
          formalEmpatheticCoach: 'Comfort with ambiguity that honors both action and reflection',
          balancedMentor: 'Navigate uncertainty while seeking clarity when possible',
        },
      },
    ],
  },
  {
    id: 'collaboration',
    name: 'Collaboration & Stakeholder Management',
    description: 'The ability to work effectively with others, build partnerships, and manage relationships.',
    subTraits: [
      {
        id: 'partnershipBuilding',
        name: 'Partnership Building',
        shortDescription: 'Creating mutually beneficial relationships',
        longDescription: 'The ability to identify partnership opportunities, build relationships, and create value for all parties. Strong partnership building means you create win-win situations.',
        strengthSignals: [
          'You build partnerships that create value for all parties',
          'You identify opportunities for collaboration',
          'Partners trust you and want to work with you',
          'Your partnerships lead to better outcomes',
        ],
        riskSignals: {
          underuse: [
            'You don\'t build partnerships',
            'You miss opportunities for collaboration',
            'You work in isolation',
          ],
          overuse: [
            'You build partnerships that don\'t create value',
            'You prioritize partnerships at the expense of results',
            'You become overly dependent on partners',
          ],
          imbalance: [
            'You build some partnerships well but not others',
            'You build partnerships but don\'t maintain them',
          ],
        },
        actions: {
          dailyHabits: [
            'Look for opportunities to create partnerships',
            'Invest time in relationship-building',
            'Focus on creating value for all parties',
          ],
          situationalTactics: [
            'Identify shared goals and interests',
            'Create win-win scenarios',
            'Follow through on partnership commitments',
          ],
          strategicShifts: [
            'Build a network of strategic partnerships',
            'Create a culture that values collaboration',
            'Develop your team\'s ability to build partnerships',
          ],
        },
        toneTags: {
          default: 'Partnership-focused and collaborative',
          bluntPracticalFriend: 'Build partnerships. Create value.',
          formalEmpatheticCoach: 'Partnership building that honors both relationships and outcomes',
          balancedMentor: 'Strong partnerships that deliver results',
        },
      },
      {
        id: 'stakeholderManagement',
        name: 'Stakeholder Management',
        shortDescription: 'Managing relationships with key stakeholders',
        longDescription: 'The ability to identify stakeholders, understand their interests, and manage relationships effectively. Strong stakeholder management means you can navigate complex stakeholder landscapes.',
        strengthSignals: [
          'You identify and engage key stakeholders effectively',
          'You understand stakeholders\' interests and concerns',
          'You manage stakeholder relationships proactively',
          'Stakeholders support your initiatives',
        ],
        riskSignals: {
          underuse: [
            'You don\'t identify or engage stakeholders',
            'You\'re surprised by stakeholder reactions',
            'Stakeholders block or resist your initiatives',
          ],
          overuse: [
            'You over-engage stakeholders, creating delays',
            'You try to please all stakeholders, leading to weak decisions',
            'You spend too much time on stakeholder management',
          ],
          imbalance: [
            'You manage some stakeholders well but not others',
            'You identify stakeholders but don\'t engage them',
          ],
        },
        actions: {
          dailyHabits: [
            'Map stakeholders for all major initiatives',
            'Understand stakeholders\' interests and concerns',
            'Communicate proactively with key stakeholders',
          ],
          situationalTactics: [
            'Engage stakeholders early in planning',
            'Address stakeholder concerns before they become problems',
            'Build coalitions of supportive stakeholders',
          ],
          strategicShifts: [
            'Build a stakeholder management process',
            'Develop relationships with key stakeholders',
            'Create a culture that values stakeholder engagement',
          ],
        },
        toneTags: {
          default: 'Stakeholder-aware and relationship-focused',
          bluntPracticalFriend: 'Know your stakeholders. Manage them.',
          formalEmpatheticCoach: 'Stakeholder management that honors both relationships and outcomes',
          balancedMentor: 'Engage stakeholders while maintaining focus',
        },
      },
      {
        id: 'conflictResolution',
        name: 'Conflict Resolution',
        shortDescription: 'Resolving disagreements effectively',
        longDescription: 'The ability to address conflicts directly, find common ground, and reach solutions that work for all parties. Strong conflict resolution means you turn conflicts into opportunities.',
        strengthSignals: [
          'You address conflicts directly and effectively',
          'You find solutions that work for all parties',
          'Conflicts are resolved rather than avoided',
          'People trust you to handle conflicts fairly',
        ],
        riskSignals: {
          underuse: [
            'You avoid conflicts, leading to unresolved issues',
            'Conflicts escalate because they\'re not addressed',
            'You don\'t help others resolve conflicts',
          ],
          overuse: [
            'You create conflicts unnecessarily',
            'You focus on conflict at the expense of collaboration',
            'You enjoy conflict for its own sake',
          ],
          imbalance: [
            'You resolve some conflicts well but not others',
            'You address conflicts but don\'t prevent them',
          ],
        },
        actions: {
          dailyHabits: [
            'Address conflicts as soon as you notice them',
            'Focus on interests, not positions',
            'Look for win-win solutions',
          ],
          situationalTactics: [
            'Use mediation techniques when appropriate',
            'Create safe spaces for difficult conversations',
            'Follow up to ensure conflicts are truly resolved',
          ],
          strategicShifts: [
            'Build conflict resolution skills',
            'Create a culture that addresses conflict constructively',
            'Develop your team\'s ability to resolve conflicts',
          ],
        },
        toneTags: {
          default: 'Conflict-resolving and solution-focused',
          bluntPracticalFriend: 'Address conflict. Find solutions.',
          formalEmpatheticCoach: 'Conflict resolution that honors both parties and outcomes',
          balancedMentor: 'Resolve conflicts while maintaining relationships',
        },
      },
      {
        id: 'crossFunctionalCollaboration',
        name: 'Cross-Functional Collaboration',
        shortDescription: 'Working effectively across organizational boundaries',
        longDescription: 'The ability to work with people from different functions, departments, or organizations to achieve shared goals. Strong cross-functional collaboration means you can bridge differences.',
        strengthSignals: [
          'You work effectively with people from different functions',
          'You bridge differences between groups',
          'Cross-functional initiatives succeed because of your collaboration',
          'People from different functions want to work with you',
        ],
        riskSignals: {
          underuse: [
            'You struggle to work across functions',
            'You don\'t understand or respect other functions\' perspectives',
            'Cross-functional initiatives fail because of poor collaboration',
          ],
          overuse: [
            'You spend too much time on cross-functional work',
            'You lose focus on your own function\'s priorities',
            'You become a bottleneck for cross-functional initiatives',
          ],
          imbalance: [
            'You collaborate well with some functions but not others',
            'You collaborate but don\'t deliver results',
          ],
        },
        actions: {
          dailyHabits: [
            'Seek to understand other functions\' perspectives',
            'Build relationships across functions',
            'Look for opportunities to collaborate',
          ],
          situationalTactics: [
            'Create shared goals that require cross-functional collaboration',
            'Facilitate cross-functional meetings effectively',
            'Bridge communication gaps between functions',
          ],
          strategicShifts: [
            'Build a culture that values cross-functional collaboration',
            'Create systems that support collaboration',
            'Develop your team\'s ability to work across functions',
          ],
        },
        toneTags: {
          default: 'Collaborative and boundary-spanning',
          bluntPracticalFriend: 'Work across functions. Get it done.',
          formalEmpatheticCoach: 'Cross-functional collaboration that honors all perspectives',
          balancedMentor: 'Bridge differences while maintaining focus',
        },
      },
      {
        id: 'negotiation',
        name: 'Negotiation',
        shortDescription: 'Reaching agreements that work for all parties',
        longDescription: 'The ability to negotiate effectively, find common ground, and reach agreements that create value. Strong negotiation means you can get what you need while maintaining relationships.',
        strengthSignals: [
          'You reach agreements that work for all parties',
          'You find creative solutions in negotiations',
          'You maintain relationships even after difficult negotiations',
          'Your negotiations lead to better outcomes',
        ],
        riskSignals: {
          underuse: [
            'You avoid negotiations or give in too easily',
            'You don\'t advocate for your interests',
            'You accept agreements that don\'t work for you',
          ],
          overuse: [
            'You negotiate everything, even when it\'s unnecessary',
            'You become overly competitive in negotiations',
            'You damage relationships through aggressive negotiation',
          ],
          imbalance: [
            'You negotiate well in some situations but not others',
            'You reach agreements but don\'t follow through',
          ],
        },
        actions: {
          dailyHabits: [
            'Prepare thoroughly for negotiations',
            'Focus on interests, not positions',
            'Look for win-win solutions',
          ],
          situationalTactics: [
            'Use principled negotiation techniques',
            'Build rapport before negotiating',
            'Create value before claiming value',
          ],
          strategicShifts: [
            'Build negotiation skills through training and practice',
            'Create a culture that values collaborative negotiation',
            'Develop your team\'s ability to negotiate effectively',
          ],
        },
        toneTags: {
          default: 'Negotiation-skilled and agreement-focused',
          bluntPracticalFriend: 'Negotiate. Get what you need.',
          formalEmpatheticCoach: 'Negotiation that honors both interests and relationships',
          balancedMentor: 'Reach agreements while maintaining relationships',
        },
      },
      {
        id: 'influence',
        name: 'Influence',
        shortDescription: 'Persuading others without authority',
        longDescription: 'The ability to persuade others, build support for ideas, and achieve outcomes through influence rather than authority. Strong influence means you can move people toward shared goals.',
        strengthSignals: [
          'You persuade others effectively without using authority',
          'People adopt your ideas because they\'re compelling',
          'You build support for initiatives across the organization',
          'You achieve outcomes through influence',
        ],
        riskSignals: {
          underuse: [
            'You rely only on authority to get things done',
            'You can\'t persuade others to support your ideas',
            'Your ideas don\'t gain traction',
          ],
          overuse: [
            'You manipulate rather than influence',
            'You push your agenda without considering others\' perspectives',
            'You create resistance through aggressive influence',
          ],
          imbalance: [
            'You influence some people but not others',
            'You build support but don\'t deliver results',
          ],
        },
        actions: {
          dailyHabits: [
            'Frame ideas in terms of shared benefits',
            'Build relationships before you need to influence',
            'Listen to understand others\' perspectives',
          ],
          situationalTactics: [
            'Use storytelling to make ideas compelling',
            'Find common ground before presenting your position',
            'Acknowledge valid concerns before making your case',
          ],
          strategicShifts: [
            'Build a reputation for following through',
            'Develop expertise that gives you credibility',
            'Create a culture that values influence over authority',
          ],
        },
        toneTags: {
          default: 'Influential and persuasive',
          bluntPracticalFriend: 'Influence. Get alignment.',
          formalEmpatheticCoach: 'Influence that honors both persuasion and respect',
          balancedMentor: 'Persuade while respecting others\' autonomy',
        },
      },
    ],
  },
  {
    id: 'culture',
    name: 'Culture & Norm-Shaping',
    description: 'The ability to shape organizational culture, establish norms, and create environments where people thrive.',
    subTraits: [
      {
        id: 'cultureShaping',
        name: 'Culture Shaping',
        shortDescription: 'Intentionally creating organizational culture',
        longDescription: 'The ability to define, communicate, and reinforce the culture you want. Strong culture shaping means you create environments where people can thrive.',
        strengthSignals: [
          'You intentionally shape culture through your actions',
          'Your team embodies the culture you want',
          'Culture supports performance and well-being',
          'People can articulate the culture you\'re creating',
        ],
        riskSignals: {
          underuse: [
            'You don\'t intentionally shape culture',
            'Culture develops by default rather than by design',
            'Culture doesn\'t support your goals',
          ],
          overuse: [
            'You focus on culture at the expense of results',
            'You create culture that feels forced or inauthentic',
            'You over-engineer culture initiatives',
          ],
          imbalance: [
            'You shape some aspects of culture but not others',
            'You define culture but don\'t reinforce it',
          ],
        },
        actions: {
          dailyHabits: [
            'Model the culture you want to create',
            'Reinforce cultural behaviors when you see them',
            'Address behaviors that don\'t align with desired culture',
          ],
          situationalTactics: [
            'Use stories and examples to illustrate desired culture',
            'Create rituals that reinforce culture',
            'Hire and promote people who embody the culture',
          ],
          strategicShifts: [
            'Define and communicate your desired culture clearly',
            'Build systems that reinforce culture',
            'Create a culture that supports both performance and well-being',
          ],
        },
        toneTags: {
          default: 'Culture-focused and intentional',
          bluntPracticalFriend: 'Shape the culture. Make it real.',
          formalEmpatheticCoach: 'Culture shaping that honors both values and performance',
          balancedMentor: 'Create culture that supports people and results',
        },
      },
      {
        id: 'normSetting',
        name: 'Norm Setting',
        shortDescription: 'Establishing behavioral expectations',
        longDescription: 'The ability to set clear behavioral norms, model them, and hold people accountable. Strong norm setting means you create clear expectations for how people should behave.',
        strengthSignals: [
          'You set clear behavioral norms',
          'People understand and follow the norms you establish',
          'You model the norms you want others to follow',
          'Norms support performance and well-being',
        ],
        riskSignals: {
          underuse: [
            'You don\'t set clear behavioral norms',
            'People don\'t know what behaviors are expected',
            'Norms develop by default rather than by design',
          ],
          overuse: [
            'You set too many norms, creating rigidity',
            'You enforce norms in a way that feels punitive',
            'You focus on norms at the expense of results',
          ],
          imbalance: [
            'You set norms for some behaviors but not others',
            'You set norms but don\'t model or enforce them',
          ],
        },
        actions: {
          dailyHabits: [
            'Model the norms you want others to follow',
            'Reinforce positive norm behaviors when you see them',
            'Address norm violations directly and fairly',
          ],
          situationalTactics: [
            'Communicate norms clearly and regularly',
            'Involve your team in setting norms',
            'Use norms to guide decision-making',
          ],
          strategicShifts: [
            'Define and communicate behavioral norms',
            'Build systems that reinforce norms',
            'Create a culture where norms are valued and followed',
          ],
        },
        toneTags: {
          default: 'Norm-setting and expectation-focused',
          bluntPracticalFriend: 'Set the norms. Enforce them.',
          formalEmpatheticCoach: 'Norm setting that honors both standards and people',
          balancedMentor: 'Clear norms with support to meet them',
        },
      },
      {
        id: 'psychologicalSafety',
        name: 'Psychological Safety',
        shortDescription: 'Creating environments where people can take risks',
        longDescription: 'The ability to create environments where people feel safe to speak up, take risks, and be themselves. Strong psychological safety means people can contribute fully.',
        strengthSignals: [
          'People feel safe to speak up and share ideas',
          'People can admit mistakes without fear',
          'People take calculated risks',
          'Diverse perspectives are heard and valued',
        ],
        riskSignals: {
          underuse: [
            'People don\'t speak up or share ideas',
            'People fear making mistakes',
            'People don\'t take risks',
          ],
          overuse: [
            'You create safety at the expense of accountability',
            'People feel so safe they become complacent',
            'You avoid necessary conflict to maintain safety',
          ],
          imbalance: [
            'Some people feel safe but others don\'t',
            'You create safety but don\'t maintain it',
          ],
        },
        actions: {
          dailyHabits: [
            'Encourage people to speak up and share ideas',
            'Respond positively to mistakes and failures',
            'Model vulnerability and openness',
          ],
          situationalTactics: [
            'Create forums for open dialogue',
            'Address behaviors that undermine psychological safety',
            'Celebrate learning from mistakes',
          ],
          strategicShifts: [
            'Build a culture of psychological safety',
            'Create systems that support open communication',
            'Develop your team\'s ability to create safety for others',
          ],
        },
        toneTags: {
          default: 'Safety-creating and inclusive',
          bluntPracticalFriend: 'Create safety. Enable risk-taking.',
          formalEmpatheticCoach: 'Psychological safety that honors both openness and accountability',
          balancedMentor: 'Safe environments that support growth',
        },
      },
      {
        id: 'inclusion',
        name: 'Inclusion',
        shortDescription: 'Creating environments where everyone belongs',
        longDescription: 'The ability to create environments where all people feel valued, included, and able to contribute fully. Strong inclusion means you leverage diversity effectively.',
        strengthSignals: [
          'All people feel valued and included',
          'Diverse perspectives are heard and considered',
          'People can be themselves at work',
          'You leverage diversity to improve outcomes',
        ],
        riskSignals: {
          underuse: [
            'Some people don\'t feel included or valued',
            'Diverse perspectives aren\'t heard',
            'People feel they need to conform to fit in',
          ],
          overuse: [
            'You focus on inclusion at the expense of performance',
            'You create inclusion initiatives that feel forced',
            'You over-accommodate at the expense of standards',
          ],
          imbalance: [
            'You include some people but not others',
            'You talk about inclusion but don\'t act on it',
          ],
        },
        actions: {
          dailyHabits: [
            'Seek out diverse perspectives',
            'Ensure all voices are heard in meetings',
            'Address behaviors that exclude others',
          ],
          situationalTactics: [
            'Create opportunities for all people to contribute',
            'Recognize and value different styles and approaches',
            'Build relationships across differences',
          ],
          strategicShifts: [
            'Build a culture of inclusion',
            'Create systems that support diversity and inclusion',
            'Develop your team\'s ability to create inclusive environments',
          ],
        },
        toneTags: {
          default: 'Inclusive and diversity-valuing',
          bluntPracticalFriend: 'Include everyone. Value differences.',
          formalEmpatheticCoach: 'Inclusion that honors both belonging and performance',
          balancedMentor: 'Inclusive environments that leverage diversity',
        },
      },
      {
        id: 'valuesAlignment',
        name: 'Values Alignment',
        shortDescription: 'Ensuring actions match stated values',
        longDescription: 'The ability to align actions with stated values, hold people accountable to values, and create cultures where values guide behavior. Strong values alignment means your values are lived, not just stated.',
        strengthSignals: [
          'Actions align with stated values',
          'Values guide decision-making',
          'People can see values in action',
          'You hold people accountable to values',
        ],
        riskSignals: {
          underuse: [
            'Actions don\'t match stated values',
            'Values are stated but not lived',
            'Values don\'t guide decision-making',
          ],
          overuse: [
            'You enforce values rigidly without context',
            'You judge others harshly for not sharing your values',
            'You prioritize values at the expense of practical outcomes',
          ],
          imbalance: [
            'Some values are lived but others aren\'t',
            'You talk about values but don\'t model them',
          ],
        },
        actions: {
          dailyHabits: [
            'Make decisions based on values',
            'Model values in your behavior',
            'Recognize when others live the values',
          ],
          situationalTactics: [
            'Use values to guide difficult decisions',
            'Address behaviors that don\'t align with values',
            'Share stories that illustrate values in action',
          ],
          strategicShifts: [
            'Define and communicate values clearly',
            'Build systems that reinforce values',
            'Create a culture where values guide behavior',
          ],
        },
        toneTags: {
          default: 'Values-driven and aligned',
          bluntPracticalFriend: 'Live your values. Every day.',
          formalEmpatheticCoach: 'Values alignment that honors both principles and practicality',
          balancedMentor: 'Values that guide behavior and decisions',
        },
      },
      {
        id: 'employeeExperience',
        name: 'Employee Experience',
        shortDescription: 'Creating positive experiences for employees',
        longDescription: 'The ability to create work experiences that are engaging, meaningful, and supportive. Strong employee experience means people want to work for you.',
        strengthSignals: [
          'People enjoy working for you',
          'Employee engagement is high',
          'People feel their work is meaningful',
          'You create experiences that support well-being',
        ],
        riskSignals: {
          underuse: [
            'People don\'t enjoy working for you',
            'Employee engagement is low',
            'People don\'t find their work meaningful',
          ],
          overuse: [
            'You focus on experience at the expense of results',
            'You create experiences that feel forced',
            'You over-engineer employee experience initiatives',
          ],
          imbalance: [
            'Some people have positive experiences but others don\'t',
            'You create experiences but don\'t maintain them',
          ],
        },
        actions: {
          dailyHabits: [
            'Check in on how people are experiencing work',
            'Recognize and appreciate contributions',
            'Create moments of connection and celebration',
          ],
          situationalTactics: [
            'Design experiences that are meaningful and engaging',
            'Address factors that negatively impact experience',
            'Involve employees in designing their experience',
          ],
          strategicShifts: [
            'Build a culture that values employee experience',
            'Create systems that support positive experiences',
            'Develop your ability to create engaging work experiences',
          ],
        },
        toneTags: {
          default: 'Experience-focused and employee-centered',
          bluntPracticalFriend: 'Create great experiences. Keep people engaged.',
          formalEmpatheticCoach: 'Employee experience that honors both engagement and performance',
          balancedMentor: 'Positive experiences that support results',
        },
      },
      {
        id: 'organizationalLearning',
        name: 'Organizational Learning',
        shortDescription: 'Creating cultures that learn and improve',
        longDescription: 'The ability to create environments where learning is valued, mistakes are learning opportunities, and the organization continuously improves. Strong organizational learning means you get better over time.',
        strengthSignals: [
          'Your organization learns from experience',
          'Mistakes become learning opportunities',
          'Knowledge is shared and applied',
          'The organization improves continuously',
        ],
        riskSignals: {
          underuse: [
            'Your organization repeats the same mistakes',
            'Knowledge isn\'t shared or applied',
            'The organization doesn\'t improve over time',
          ],
          overuse: [
            'You focus on learning at the expense of doing',
            'You over-analyze experiences',
            'You create learning initiatives that don\'t lead to improvement',
          ],
          imbalance: [
            'Some parts of the organization learn but others don\'t',
            'You talk about learning but don\'t create systems for it',
          ],
        },
        actions: {
          dailyHabits: [
            'Share learnings from experiences',
            'Ask "What did we learn?" after projects or initiatives',
            'Create opportunities for knowledge sharing',
          ],
          situationalTactics: [
            'Conduct after-action reviews',
            'Document and share best practices',
            'Celebrate learning from mistakes',
          ],
          strategicShifts: [
            'Build a culture that values learning',
            'Create systems that support organizational learning',
            'Develop your team\'s ability to learn and improve',
          ],
        },
        toneTags: {
          default: 'Learning-oriented and improvement-focused',
          bluntPracticalFriend: 'Learn from everything. Get better.',
          formalEmpatheticCoach: 'Organizational learning that honors both reflection and action',
          balancedMentor: 'Continuous learning that drives improvement',
        },
      },
    ],
  },
];

/**
 * Helper function to get a sub-trait by ID
 */
export function getSubTrait(coreTraitId, subTraitId) {
  const coreTrait = CORE_TRAITS.find((t) => t.id === coreTraitId);
  if (!coreTrait) return null;
  return coreTrait.subTraits.find((st) => st.id === subTraitId) || null;
}

/**
 * Helper function to get all sub-traits for a core trait
 */
export function getSubTraitsForCoreTrait(coreTraitId) {
  const coreTrait = CORE_TRAITS.find((t) => t.id === coreTraitId);
  return coreTrait?.subTraits || [];
}

/**
 * Helper function to get tone-adjusted content based on agent selection
 */
export function getToneAdjustedContent(subTrait, agentId = 'balancedMentor') {
  const toneTag = subTrait.toneTags?.[agentId] || subTrait.toneTags?.default || '';
  return {
    ...subTrait,
    toneAdjustedDescription: toneTag,
  };
}

/**
 * Export the trait system
 */
export default {
  CORE_TRAITS,
  TONE_TAGS,
  getSubTrait,
  getSubTraitsForCoreTrait,
  getToneAdjustedContent,
};

