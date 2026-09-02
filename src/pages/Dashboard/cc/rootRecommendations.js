/**
 * Curated reading, watching, and practice per subtrait, shown in the Practice
 * "Root" card.
 *
 * SOURCING RULE — read before adding anything.
 * Every Read is a real, published book and every Watch is a real, findable
 * talk. Nothing here is a plausible-sounding placeholder: a leader who cannot
 * find the thing we recommended learns that we make things up, and that is a
 * worse outcome than an empty shelf.
 *
 * Article slots are deliberately absent. Article titles and URLs are the
 * easiest thing to invent convincingly and the hardest to verify at a glance,
 * so they get added by hand from sources the owners already trust, not
 * generated. If you add one, paste the real title and publication.
 *
 * Practice is the one entry that is ours to write. It should be a concrete
 * thing a leader can do this week, not a principle to hold.
 *
 * Keys are subtrait names exactly as they appear in `traitSystem.js`.
 * `Empathy` and `Influence` each live under two core traits and deliberately
 * share one entry — the reading does not change with the parent.
 */

const DEFAULT_RECS = [
  {
    type: 'Read',
    title: 'The Effective Executive',
    by: 'Peter Drucker',
    why: 'Effectiveness is a set of habits, not a talent. That is the whole argument.',
  },
  {
    type: 'Watch',
    title: 'What it takes to be a great leader',
    by: 'Roselinde Torres · TED',
    why: 'Three questions that sort leaders who adapt from leaders who repeat.',
  },
  {
    type: 'Practice',
    title: 'The end-of-day two-line note',
    by: 'Five minutes, daily',
    why: 'One moment you led well, one you would re-do. Patterns show up inside a fortnight.',
  },
];

const RECS_BY_SUBTRAIT = {
  // --- Communication ------------------------------------------------------
  Clarity: [
    {
      type: 'Read',
      title: 'Made to Stick',
      by: 'Chip Heath · Dan Heath',
      why: 'A clear message is one core thread, not three competing ones.',
    },
    {
      type: 'Watch',
      title: 'How to speak so that people want to listen',
      by: 'Julian Treasure · TED',
      why: 'Clarity is delivery as much as wording, and delivery is trainable.',
    },
    {
      type: 'Practice',
      title: 'The one-sentence test',
      by: 'Before any meeting you call',
      why: 'If you cannot say the point in a sentence, you are not ready to say it at all.',
    },
  ],
  Brevity: [
    {
      type: 'Read',
      title: 'Smart Brevity',
      by: 'Jim VandeHei · Mike Allen · Roy Schwartz',
      why: 'Written by people whose business model depends on being read to the end.',
    },
    {
      type: 'Watch',
      title: 'Got a meeting? Take a walk',
      by: 'Nilofer Merchant · TED',
      why: 'Under six minutes, and it makes its whole case. That is the demonstration.',
    },
    {
      type: 'Practice',
      title: 'Cut your longest message in half',
      by: 'Once a day, before sending',
      why: 'Almost nothing is lost. Notice what you were actually protecting.',
    },
  ],
  Influence: [
    {
      type: 'Read',
      title: 'Influence: The Psychology of Persuasion',
      by: 'Robert Cialdini',
      why: 'The six levers, and why recognising them is most of the defence.',
    },
    {
      type: 'Watch',
      title: 'How great leaders inspire action',
      by: 'Simon Sinek · TED',
      why: 'Order of argument changes who follows. Why before what.',
    },
    {
      type: 'Practice',
      title: 'Pre-wire one decision',
      by: 'Before your next proposal',
      why: 'Two conversations before the room beats the best case made inside it.',
    },
  ],
  Listening: [
    {
      type: 'Read',
      title: 'Humble Inquiry',
      by: 'Edgar Schein',
      why: 'Asking is a relationship move before it is an information one.',
    },
    {
      type: 'Watch',
      title: '10 ways to have a better conversation',
      by: 'Celeste Headlee · TED',
      why: 'Most listening advice is posture. This is about what you do with your mouth.',
    },
    {
      type: 'Practice',
      title: 'Ask the second question',
      by: 'In every one-to-one this week',
      why: 'The first answer is prepared. The second one is thought.',
    },
  ],
  Empathy: [
    {
      type: 'Read',
      title: 'Nonviolent Communication',
      by: 'Marshall Rosenberg',
      why: 'Separating observation from evaluation is harder, and more useful, than it sounds.',
    },
    {
      type: 'Watch',
      title: 'The power of vulnerability',
      by: 'Brené Brown · TED',
      why: 'The connection between what you will admit and what your team will risk.',
    },
    {
      type: 'Practice',
      title: 'Name it before you solve it',
      by: 'Next time someone brings a problem',
      why: 'Say what you think they are feeling, then wait. Solving too early reads as dismissal.',
    },
  ],
  'Audience Adaptability': [
    {
      type: 'Read',
      title: 'The Culture Map',
      by: 'Erin Meyer',
      why: 'The same sentence lands differently by room. This maps how and why.',
    },
    {
      type: 'Watch',
      title: 'Lead like the great conductors',
      by: 'Itay Talgam · TED',
      why: 'Six conductors, six ways to run a room, all of them functional.',
    },
    {
      type: 'Practice',
      title: 'Rewrite one update three ways',
      by: 'For your team, your peer, your boss',
      why: 'Same facts, three framings. The differences show you your default.',
    },
  ],
  'Executive Presence': [
    {
      type: 'Read',
      title: 'Talk Like TED',
      by: 'Carmine Gallo',
      why: 'Presence broken into things you can rehearse rather than things you are.',
    },
    {
      type: 'Watch',
      title: 'Why good leaders make you feel safe',
      by: 'Simon Sinek · TED',
      why: 'Presence read as a promise of safety rather than a performance of authority.',
    },
    {
      type: 'Practice',
      title: 'Speak second',
      by: 'In your next three meetings',
      why: 'Hold your view until one other person has spoken. Watch what changes.',
    },
  ],

  // --- Decision-Making & Judgment ------------------------------------------
  'Decision Quality & Pace': [
    {
      type: 'Read',
      title: 'Thinking in Bets',
      by: 'Annie Duke',
      why: 'Separate decision quality from outcome quality. The two are not the same.',
    },
    {
      type: 'Watch',
      title: 'Are we in control of our own decisions?',
      by: 'Dan Ariely · TED',
      why: 'How much of a decision is made by how the options were arranged.',
    },
    {
      type: 'Practice',
      title: 'State criteria before you decide',
      by: 'In your next decision meeting',
      why: 'Criteria first, options second. The order changes the conversation.',
    },
  ],
  'Decision-Making Under Uncertainty': [
    {
      type: 'Read',
      title: 'Superforecasting',
      by: 'Philip Tetlock · Dan Gardner',
      why: 'Good forecasters are not smarter. They update more honestly.',
    },
    {
      type: 'Watch',
      title: 'On being wrong',
      by: 'Kathryn Schulz · TED',
      why: 'Being wrong feels exactly like being right. That is the whole problem.',
    },
    {
      type: 'Practice',
      title: 'Write the number down',
      by: 'Before your next uncertain call',
      why: 'Put a percentage on it. Revisit in a month. Calibration needs a record.',
    },
  ],
  'Stakeholder Consideration': [
    {
      type: 'Read',
      title: 'Getting to Yes',
      by: 'Roger Fisher · William Ury',
      why: 'Positions are what people say they want. Interests are what they need.',
    },
    {
      type: 'Watch',
      title: 'Dare to disagree',
      by: 'Margaret Heffernan · TED',
      why: 'The stakeholder who disagrees is the one giving you information.',
    },
    {
      type: 'Practice',
      title: 'List who pays',
      by: 'Before announcing any decision',
      why: 'Name everyone whose work changes. Most misses are people, not logic.',
    },
  ],
  'Learning from Outcomes': [
    {
      type: 'Read',
      title: 'Black Box Thinking',
      by: 'Matthew Syed',
      why: 'Aviation learns from failure. Most industries hide it. The contrast is the lesson.',
    },
    {
      type: 'Watch',
      title: 'The power of believing that you can improve',
      by: 'Carol Dweck · TED',
      why: 'What you conclude from a bad outcome decides whether it teaches you anything.',
    },
    {
      type: 'Practice',
      title: 'The blameless five minutes',
      by: 'After anything that went wrong',
      why: 'What did we know, when, and what would have changed the call. No names.',
    },
  ],

  // --- Strategic Thinking ---------------------------------------------------
  Vision: [
    {
      type: 'Read',
      title: 'Start with Why',
      by: 'Simon Sinek',
      why: 'A vision people repeat is one they can say in their own words.',
    },
    {
      type: 'Watch',
      title: 'How great leaders inspire action',
      by: 'Simon Sinek · TED',
      why: 'The short version of the book, and enough to test the idea on your own team.',
    },
    {
      type: 'Practice',
      title: 'Ask three people to say it back',
      by: 'This week',
      why: 'If the three answers differ, the vision is not landing — the retelling is the test.',
    },
  ],
  'Systems Thinking': [
    {
      type: 'Read',
      title: 'Thinking in Systems',
      by: 'Donella Meadows',
      why: 'Where to push on a system, and why the obvious place is usually wrong.',
    },
    {
      type: 'Watch',
      title: 'As work gets more complex, 6 rules to simplify',
      by: 'Yves Morieux · TED',
      why: 'Adding structure to a complicated system usually makes it slower, not clearer.',
    },
    {
      type: 'Practice',
      title: 'Trace one recurring problem upstream',
      by: 'Pick the one that keeps coming back',
      why: 'Follow it three steps back from where you noticed it. Fix it there.',
    },
  ],
  'Future Orientation': [
    {
      type: 'Read',
      title: 'The Innovator’s Dilemma',
      by: 'Clayton Christensen',
      why: 'How competent organisations lose by doing exactly what worked before.',
    },
    {
      type: 'Watch',
      title: 'Where good ideas come from',
      by: 'Steven Johnson · TED',
      why: 'Ideas arrive slowly and in company. Useful for how you schedule thinking.',
    },
    {
      type: 'Practice',
      title: 'The two-year question',
      by: 'Once a month, on paper',
      why: 'What is true today that will not be in two years? Write one answer.',
    },
  ],
  'Pattern Recognition': [
    {
      type: 'Read',
      title: 'Thinking, Fast and Slow',
      by: 'Daniel Kahneman',
      why: 'Pattern recognition and pattern invention feel identical from the inside.',
    },
    {
      type: 'Watch',
      title: 'The paradox of choice',
      by: 'Barry Schwartz · TED',
      why: 'A pattern in behaviour that most leaders read as indecision.',
    },
    {
      type: 'Practice',
      title: 'Three instances or it is a coincidence',
      by: 'Before you name a trend',
      why: 'Write the three down. If you cannot, you are reacting to the most recent one.',
    },
  ],
  'Long-Term Planning': [
    {
      type: 'Read',
      title: 'Good Strategy Bad Strategy',
      by: 'Richard Rumelt',
      why: 'Most plans are goals with dates. This is the difference, stated plainly.',
    },
    {
      type: 'Watch',
      title: 'Why it’s time to forget the pecking order at work',
      by: 'Margaret Heffernan · TED',
      why: 'What actually compounds over years, and what only looks like it does.',
    },
    {
      type: 'Practice',
      title: 'Name the one constraint',
      by: 'Before writing any plan',
      why: 'A plan that does not name what limits you is a wish list with dates on it.',
    },
  ],
  'Competitive Intelligence': [
    {
      type: 'Read',
      title: 'Playing to Win',
      by: 'A.G. Lafley · Roger Martin',
      why: 'Strategy as five linked choices, including where you deliberately will not play.',
    },
    {
      type: 'Watch',
      title: 'How frustration can make us more creative',
      by: 'Tim Harford · TED',
      why: 'Constraint as an advantage, which is what most competitive positions are.',
    },
    {
      type: 'Practice',
      title: 'Argue the competitor’s case',
      by: 'For ten minutes, out loud',
      why: 'Make their best argument. What you cannot answer is where to look.',
    },
  ],
  'Resource Allocation': [
    {
      type: 'Read',
      title: 'Essentialism',
      by: 'Greg McKeown',
      why: 'Allocation is subtraction. Everything you fund, you fund instead of something.',
    },
    {
      type: 'Watch',
      title: 'How to make choosing easier',
      by: 'Sheena Iyengar · TED',
      why: 'Why more options produce worse allocation, not better.',
    },
    {
      type: 'Practice',
      title: 'Publish the not-doing list',
      by: 'Alongside your next priorities',
      why: 'Naming what you dropped is what makes the priorities real to the team.',
    },
  ],

  // --- Execution & Follow-Through --------------------------------------------
  'Project Management': [
    {
      type: 'Read',
      title: 'The Goal',
      by: 'Eliyahu Goldratt',
      why: 'A novel about bottlenecks that changed how a generation runs work.',
    },
    {
      type: 'Watch',
      title: 'Build a tower, build a team',
      by: 'Tom Wujec · TED',
      why: 'Why teams that prototype early beat teams that plan longer.',
    },
    {
      type: 'Practice',
      title: 'Find the constraint before adding people',
      by: 'On your slowest workstream',
      why: 'Staffing around a bottleneck moves the queue, not the finish date.',
    },
  ],
  Prioritization: [
    {
      type: 'Read',
      title: 'Essentialism',
      by: 'Greg McKeown',
      why: 'The disciplined pursuit of less. Written for people who are good at everything.',
    },
    {
      type: 'Watch',
      title: 'Why work doesn’t happen at work',
      by: 'Jason Fried · TED',
      why: 'Priorities fail on interruption more often than on ranking.',
    },
    {
      type: 'Practice',
      title: 'Rank, do not rate',
      by: 'On your current list',
      why: 'No ties. Forced ordering surfaces the trade-off you have been avoiding.',
    },
  ],
  'Deadline Management': [
    {
      type: 'Read',
      title: 'Making Things Happen',
      by: 'Scott Berkun',
      why: 'Schedules as a communication problem, which is where most of them fail.',
    },
    {
      type: 'Watch',
      title: 'Inside the mind of a master procrastinator',
      by: 'Tim Urban · TED',
      why: 'Funny, and accurate about why deadlines slip quietly rather than loudly.',
    },
    {
      type: 'Practice',
      title: 'Flag risk at 48 hours, not at the date',
      by: 'On every deliverable this month',
      why: 'A date missed with warning is a schedule. Missed without, it is a surprise.',
    },
  ],
  'Quality Standards': [
    {
      type: 'Read',
      title: 'The Score Takes Care of Itself',
      by: 'Bill Walsh',
      why: 'A standard of performance is built one observable behaviour at a time.',
    },
    {
      type: 'Watch',
      title: 'Every kid needs a champion',
      by: 'Rita Pierson · TED',
      why: 'Standards and belief are the same act, delivered together or not at all.',
    },
    {
      type: 'Practice',
      title: 'Define done, in writing, once',
      by: 'For your most-repeated deliverable',
      why: 'Most quality arguments are definition arguments wearing other clothes.',
    },
  ],
  'Follow-Through': [
    {
      type: 'Read',
      title: 'Atomic Habits',
      by: 'James Clear',
      why: 'Follow-through is a systems problem, not a willpower one.',
    },
    {
      type: 'Watch',
      title: 'The puzzle of motivation',
      by: 'Dan Pink · TED',
      why: 'Why the incentives you reach for first often reduce follow-through.',
    },
    {
      type: 'Practice',
      title: 'Close the loop out loud',
      by: 'On everything you asked for',
      why: 'Tell them it landed and what it changed. Silence teaches people not to bother.',
    },
  ],
  'Process Improvement': [
    {
      type: 'Read',
      title: 'The Lean Startup',
      by: 'Eric Ries',
      why: 'Small loops beat big launches, and the argument generalises past startups.',
    },
    {
      type: 'Watch',
      title: 'How to manage for collective creativity',
      by: 'Linda Hill · TED',
      why: 'Improvement as something a group does, not something a leader installs.',
    },
    {
      type: 'Practice',
      title: 'Go and watch it happen',
      by: 'Once, in person, this month',
      why: 'Watch the work where it is done. The gap from the documented process is the finding.',
    },
  ],
  'Results Orientation': [
    {
      type: 'Read',
      title: 'Measure What Matters',
      by: 'John Doerr',
      why: 'Objectives are direction; key results are the argument that you got there.',
    },
    {
      type: 'Watch',
      title: 'Grit: the power of passion and perseverance',
      by: 'Angela Duckworth · TED',
      why: 'Sustained results track persistence more closely than talent.',
    },
    {
      type: 'Practice',
      title: 'Name the number before you start',
      by: 'On your next initiative',
      why: 'Decide what would count as working, in advance, while it is still falsifiable.',
    },
  ],

  // --- Team Development & Coaching -------------------------------------------
  'Talent Identification': [
    {
      type: 'Read',
      title: 'Hidden Potential',
      by: 'Adam Grant',
      why: 'Most talent spotting measures head starts and calls them ability.',
    },
    {
      type: 'Watch',
      title: 'Why the best hire might not have the perfect resume',
      by: 'Regina Hartley · TED',
      why: 'The case for reading a CV for what it survived, not what it lists.',
    },
    {
      type: 'Practice',
      title: 'Name the trajectory, not the level',
      by: 'For each person on your team',
      why: 'Where were they a year ago? Rate of change is the more useful signal.',
    },
  ],
  Coaching: [
    {
      type: 'Read',
      title: 'The Coaching Habit',
      by: 'Michael Bungay Stanier',
      why: 'Seven questions. The whole book is a defence against advice-giving.',
    },
    {
      type: 'Watch',
      title: 'Want to help someone? Shut up and listen!',
      by: 'Ernesto Sirolli · TED',
      why: 'The failure mode of helping, argued from the field rather than the theory.',
    },
    {
      type: 'Practice',
      title: 'Answer with a question, three times',
      by: 'In your next one-to-one',
      why: 'You will want to solve it. Count how hard it is not to.',
    },
  ],
  Mentoring: [
    {
      type: 'Read',
      title: 'Trillion Dollar Coach',
      by: 'Schmidt · Rosenberg · Eagle',
      why: 'What Bill Campbell actually did, recorded by the people he did it to.',
    },
    {
      type: 'Watch',
      title: 'Everyday leadership',
      by: 'Drew Dudley · TED',
      why: 'The influence you have already had and do not know about.',
    },
    {
      type: 'Practice',
      title: 'Tell them what you see',
      by: 'To one person, unprompted',
      why: 'Name a strength they have not claimed yet. Most people cannot see their own.',
    },
  ],
  Delegation: [
    {
      type: 'Read',
      title: 'Turn the Ship Around!',
      by: 'L. David Marquet',
      why: 'Moving authority to where the information is, on a nuclear submarine.',
    },
    {
      type: 'Watch',
      title: 'Listen, learn... then lead',
      by: 'Stanley McChrystal · TED',
      why: 'Delegation under real stakes, and what it costs to hold on too long.',
    },
    {
      type: 'Practice',
      title: 'Hand over the decision, not the task',
      by: 'Once this week',
      why: 'Give the criteria and let them choose. Tasks delegate; judgement develops.',
    },
  ],
  'Giving Feedback': [
    {
      type: 'Read',
      title: 'Radical Candor',
      by: 'Kim Scott',
      why: 'Care personally and challenge directly. Dropping either produces a known failure.',
    },
    {
      type: 'Watch',
      title: 'The power of vulnerability',
      by: 'Brené Brown · TED',
      why: 'Why feedback lands or bounces, framed around what it costs to give.',
    },
    {
      type: 'Practice',
      title: 'Situation, behaviour, impact',
      by: 'On your next piece of feedback',
      why: 'Three sentences, no adjectives about the person. Notice how much shorter it gets.',
    },
  ],
  'Career Development': [
    {
      type: 'Read',
      title: 'Designing Your Life',
      by: 'Bill Burnett · Dave Evans',
      why: 'A structure for career conversations that is not a ladder diagram.',
    },
    {
      type: 'Watch',
      title: 'What baby boomers can learn from millennials at work',
      by: 'Chip Conley · TED',
      why: 'Development running in both directions across a team.',
    },
    {
      type: 'Practice',
      title: 'Ask what they want to be known for',
      by: 'In your next development chat',
      why: 'Better than "where do you see yourself" — it gets a real answer.',
    },
  ],
  'Performance Management': [
    {
      type: 'Read',
      title: 'High Output Management',
      by: 'Andy Grove',
      why: 'Still the clearest account of what a manager’s output actually is.',
    },
    {
      type: 'Watch',
      title: 'How to break bad management habits before they reach the next generation',
      by: 'Elizabeth Lyle · TED',
      why: 'The habits that get passed down before anyone notices them forming.',
    },
    {
      type: 'Practice',
      title: 'Separate the two conversations',
      by: 'At your next review',
      why: 'Performance and pay in one meeting means only one of them gets heard.',
    },
  ],
  'Team Building': [
    {
      type: 'Read',
      title: 'The Five Dysfunctions of a Team',
      by: 'Patrick Lencioni',
      why: 'The pyramid is a cliché because the diagnosis holds up.',
    },
    {
      type: 'Watch',
      title: 'How to turn a group of strangers into a team',
      by: 'Amy Edmondson · TED',
      why: 'Teaming as an activity rather than a structure you assemble once.',
    },
    {
      type: 'Practice',
      title: 'Run one meeting you do not lead',
      by: 'This month',
      why: 'Hand it over entirely and take notes. You will learn what you usually crowd out.',
    },
  ],

  // --- Emotional Intelligence & Regulation ------------------------------------
  'Self-Awareness': [
    {
      type: 'Read',
      title: 'Insight',
      by: 'Tasha Eurich',
      why: 'Internal and external self-awareness are different skills. Most people have one.',
    },
    {
      type: 'Watch',
      title: 'On being wrong',
      by: 'Kathryn Schulz · TED',
      why: 'The felt experience of being wrong is the absence of any feeling at all.',
    },
    {
      type: 'Practice',
      title: 'Ask one person what you are like in a bad week',
      by: 'Once, and then be quiet',
      why: 'Ask someone who will answer honestly. Do not defend the answer.',
    },
  ],
  'Self-Regulation': [
    {
      type: 'Read',
      title: 'Emotional Intelligence',
      by: 'Daniel Goleman',
      why: 'The amygdala hijack, named and explained. Useful vocabulary for a real event.',
    },
    {
      type: 'Watch',
      title: 'How to make stress your friend',
      by: 'Kelly McGonigal · TED',
      why: 'How you read your own arousal changes what it does to you.',
    },
    {
      type: 'Practice',
      title: 'The delayed send',
      by: 'On anything written while annoyed',
      why: 'Draft it, wait an hour, reread. Send perhaps a third of them.',
    },
  ],
  'Social Awareness': [
    {
      type: 'Read',
      title: 'Primal Leadership',
      by: 'Goleman · Boyatzis · McKee',
      why: 'A leader’s mood is contagious, measurably, whether or not it is intended.',
    },
    {
      type: 'Watch',
      title: 'The power of introverts',
      by: 'Susan Cain · TED',
      why: 'Half your team is being read wrong by a standard built for the other half.',
    },
    {
      type: 'Practice',
      title: 'Read the room before you fill it',
      by: 'At the start of your next meeting',
      why: 'Thirty seconds of noticing before you speak. Adjust the agenda if it needs it.',
    },
  ],
  'Relationship Management': [
    {
      type: 'Read',
      title: 'Give and Take',
      by: 'Adam Grant',
      why: 'Givers occupy both the top and bottom of most performance distributions.',
    },
    {
      type: 'Watch',
      title: 'How to build (and rebuild) trust',
      by: 'Frances Frei · TED',
      why: 'Trust as three components, so a broken one can be diagnosed.',
    },
    {
      type: 'Practice',
      title: 'Repair one thing',
      by: 'This week',
      why: 'Pick the relationship you have been routing around. Say one true sentence about it.',
    },
  ],
  'Stress Management': [
    {
      type: 'Read',
      title: 'Burnout',
      by: 'Emily Nagoski · Amelia Nagoski',
      why: 'Completing the stress cycle is a separate act from removing the stressor.',
    },
    {
      type: 'Watch',
      title: 'How to make stress your friend',
      by: 'Kelly McGonigal · TED',
      why: 'The reframe is doing real work here, not just positive thinking.',
    },
    {
      type: 'Practice',
      title: 'Protect one block, defend it',
      by: 'Every week',
      why: 'Ninety minutes, no meetings, same slot. Defensibility matters more than length.',
    },
  ],

  // --- Accountability & Ownership ---------------------------------------------
  'Personal Accountability': [
    {
      type: 'Read',
      title: 'Extreme Ownership',
      by: 'Jocko Willink · Leif Babin',
      why: 'Blunt, occasionally overstated, and correct about where the line sits.',
    },
    {
      type: 'Watch',
      title: 'Why good leaders make you feel safe',
      by: 'Simon Sinek · TED',
      why: 'Taking the hit is what buys the authority, not the other way round.',
    },
    {
      type: 'Practice',
      title: 'Say the miss first',
      by: 'Next time something slips',
      why: 'Name it before anyone asks. The speed of the admission is the signal.',
    },
  ],
  'Holding Others Accountable': [
    {
      type: 'Read',
      title: 'Crucial Accountability',
      by: 'Patterson · Grenny · McMillan · Switzler',
      why: 'The follow-up to Crucial Conversations, aimed squarely at broken commitments.',
    },
    {
      type: 'Watch',
      title: 'Dare to disagree',
      by: 'Margaret Heffernan · TED',
      why: 'The cost of the conversation you keep not having.',
    },
    {
      type: 'Practice',
      title: 'Name the gap within 48 hours',
      by: 'Every time',
      why: 'Late accountability reads as a grudge. Early reads as a standard.',
    },
  ],
  Transparency: [
    {
      type: 'Read',
      title: 'No Rules Rules',
      by: 'Reed Hastings · Erin Meyer',
      why: 'Radical candour at company scale, including where it cost them.',
    },
    {
      type: 'Watch',
      title: 'How to build (and rebuild) trust',
      by: 'Frances Frei · TED',
      why: 'Transparency is one input to trust, and not automatically the strongest.',
    },
    {
      type: 'Practice',
      title: 'Share the reasoning, not just the call',
      by: 'On your next decision',
      why: 'People argue with conclusions. They engage with reasoning.',
    },
  ],
  Integrity: [
    {
      type: 'Read',
      title: 'Leadership on the Line',
      by: 'Ronald Heifetz · Marty Linsky',
      why: 'What it actually costs to hold a position, written without romance.',
    },
    {
      type: 'Watch',
      title: 'Everyday leadership',
      by: 'Drew Dudley · TED',
      why: 'Integrity as accumulated small moments rather than one big stand.',
    },
    {
      type: 'Practice',
      title: 'Keep the small promise',
      by: 'The one you would not be caught breaking',
      why: 'Nobody is checking. That is exactly why it registers.',
    },
  ],
  Ownership: [
    {
      type: 'Read',
      title: 'The Oz Principle',
      by: 'Connors · Smith · Hickman',
      why: 'Above and below the line, as a shared vocabulary a team can actually use.',
    },
    {
      type: 'Watch',
      title: 'Listen, learn... then lead',
      by: 'Stanley McChrystal · TED',
      why: 'Ownership distributed down rather than concentrated at the top.',
    },
    {
      type: 'Practice',
      title: 'Assign one name, not a team',
      by: 'On every open item',
      why: 'Shared ownership is the most common way something quietly becomes nobody’s.',
    },
  ],
  Reliability: [
    {
      type: 'Read',
      title: 'Atomic Habits',
      by: 'James Clear',
      why: 'Reliability is a design problem before it is a character one.',
    },
    {
      type: 'Watch',
      title: 'Inside the mind of a master procrastinator',
      by: 'Tim Urban · TED',
      why: 'Where the gap between intending and doing actually opens.',
    },
    {
      type: 'Practice',
      title: 'Halve what you commit to',
      by: 'For one month',
      why: 'Then hit all of it. Reliability is built by promising less, not trying harder.',
    },
  ],

  // --- Change & Adaptability ---------------------------------------------------
  Adaptability: [
    {
      type: 'Read',
      title: 'Range',
      by: 'David Epstein',
      why: 'Breadth as an advantage in exactly the environments that change.',
    },
    {
      type: 'Watch',
      title: 'What it takes to be a great leader',
      by: 'Roselinde Torres · TED',
      why: 'Three questions that separate adapting from repeating.',
    },
    {
      type: 'Practice',
      title: 'Change your mind in public',
      by: 'Once, when the evidence warrants it',
      why: 'Say what changed it. It gives everyone else permission to do the same.',
    },
  ],
  'Change Leadership': [
    {
      type: 'Read',
      title: 'Switch',
      by: 'Chip Heath · Dan Heath',
      why: 'Direct the rider, motivate the elephant, shape the path. It holds up in practice.',
    },
    {
      type: 'Watch',
      title: 'How to manage for collective creativity',
      by: 'Linda Hill · TED',
      why: 'Change led as something a group produces rather than receives.',
    },
    {
      type: 'Practice',
      title: 'Find the bright spot',
      by: 'Before designing the rollout',
      why: 'Someone is already doing it right. Start by copying them, loudly.',
    },
  ],
  Resilience: [
    {
      type: 'Read',
      title: 'Option B',
      by: 'Sheryl Sandberg · Adam Grant',
      why: 'Resilience as a practice built after the fact, not a trait you had first.',
    },
    {
      type: 'Watch',
      title: 'Grit: the power of passion and perseverance',
      by: 'Angela Duckworth · TED',
      why: 'The distinction between endurance and stubbornness, drawn carefully.',
    },
    {
      type: 'Practice',
      title: 'Separate the setback from the story',
      by: 'After the next one',
      why: 'Write what happened and what you concluded, in two columns. Compare them.',
    },
  ],
  Innovation: [
    {
      type: 'Read',
      title: 'Originals',
      by: 'Adam Grant',
      why: 'Where new ideas actually come from, and who tends to carry them.',
    },
    {
      type: 'Watch',
      title: 'Where good ideas come from',
      by: 'Steven Johnson · TED',
      why: 'The slow hunch and the adjacent possible. Both change how you schedule.',
    },
    {
      type: 'Practice',
      title: 'Kill one thing to fund one thing',
      by: 'This quarter',
      why: 'Innovation with no subtraction is just an extra job for the same people.',
    },
  ],
  'Learning Agility': [
    {
      type: 'Read',
      title: 'Think Again',
      by: 'Adam Grant',
      why: 'Rethinking as a discipline, including why expertise makes it harder.',
    },
    {
      type: 'Watch',
      title: 'The power of believing that you can improve',
      by: 'Carol Dweck · TED',
      why: 'The short form of the mindset argument, and enough to apply it.',
    },
    {
      type: 'Practice',
      title: 'Learn one thing badly, in public',
      by: 'This quarter',
      why: 'Be visibly a beginner at something. It changes what your team risks trying.',
    },
  ],
  'Comfort with Ambiguity': [
    {
      type: 'Read',
      title: 'Antifragile',
      by: 'Nassim Nicholas Taleb',
      why: 'Argumentative and worth it: some things gain from disorder rather than survive it.',
    },
    {
      type: 'Watch',
      title: 'Are we in control of our own decisions?',
      by: 'Dan Ariely · TED',
      why: 'How much certainty is manufactured by how the question was framed.',
    },
    {
      type: 'Practice',
      title: 'Say "I do not know yet"',
      by: 'Out loud, when it is true',
      why: 'Add what would resolve it and by when. Ambiguity named is not weakness.',
    },
  ],

  // --- Collaboration & Stakeholder Management -----------------------------------
  'Partnership Building': [
    {
      type: 'Read',
      title: 'Give and Take',
      by: 'Adam Grant',
      why: 'Partnerships compound for givers who are not doormats. The distinction matters.',
    },
    {
      type: 'Watch',
      title: 'Why it’s time to forget the pecking order at work',
      by: 'Margaret Heffernan · TED',
      why: 'Social capital outperforming individual stars, with the research behind it.',
    },
    {
      type: 'Practice',
      title: 'Spend credit before you need it',
      by: 'One conversation this month',
      why: 'Help someone with no ask attached. Partnerships built at the point of need are transactions.',
    },
  ],
  'Stakeholder Management': [
    {
      type: 'Read',
      title: 'The First 90 Days',
      by: 'Michael Watkins',
      why: 'Stakeholder mapping done properly, and useful well past ninety days.',
    },
    {
      type: 'Watch',
      title: 'How to build (and rebuild) trust',
      by: 'Frances Frei · TED',
      why: 'Which of the three components you are missing with which stakeholder.',
    },
    {
      type: 'Practice',
      title: 'Two conversations before the room',
      by: 'Before your next big ask',
      why: 'Nobody should hear a significant proposal for the first time in the meeting.',
    },
  ],
  'Conflict Resolution': [
    {
      type: 'Read',
      title: 'Difficult Conversations',
      by: 'Stone · Patton · Heen',
      why: 'Every hard conversation is three conversations. Naming them defuses most of it.',
    },
    {
      type: 'Watch',
      title: 'Dare to disagree',
      by: 'Margaret Heffernan · TED',
      why: 'Conflict avoided is information destroyed, argued through a real case.',
    },
    {
      type: 'Practice',
      title: 'State their case first',
      by: 'Before you state yours',
      why: 'To their satisfaction, not yours. Then disagree. It changes the whole exchange.',
    },
  ],
  'Cross-Functional Collaboration': [
    {
      type: 'Read',
      title: 'Team of Teams',
      by: 'Stanley McChrystal',
      why: 'Why efficient silos lose to networks that share context.',
    },
    {
      type: 'Watch',
      title: 'As work gets more complex, 6 rules to simplify',
      by: 'Yves Morieux · TED',
      why: 'Coordination failures dressed up as structural problems.',
    },
    {
      type: 'Practice',
      title: 'Go and sit with the other team',
      by: 'Half a day this month',
      why: 'Not a meeting. Watch their work. Most friction is invisible from a status update.',
    },
  ],
  Negotiation: [
    {
      type: 'Read',
      title: 'Never Split the Difference',
      by: 'Chris Voss',
      why: 'Tactical empathy from hostage negotiation, and it transfers further than expected.',
    },
    {
      type: 'Watch',
      title: '10 ways to have a better conversation',
      by: 'Celeste Headlee · TED',
      why: 'Most negotiations are lost on listening well before they are lost on terms.',
    },
    {
      type: 'Practice',
      title: 'Label the objection out loud',
      by: 'In your next negotiation',
      why: '"It sounds like the timeline is the real problem." Then stop talking.',
    },
  ],

  // --- Culture & Norm-Shaping ------------------------------------------------------
  'Culture Shaping': [
    {
      type: 'Read',
      title: 'The Culture Code',
      by: 'Daniel Coyle',
      why: 'Culture as observable signals of safety, vulnerability, and purpose.',
    },
    {
      type: 'Watch',
      title: 'Why good leaders make you feel safe',
      by: 'Simon Sinek · TED',
      why: 'The circle of safety, and what happens to a culture without one.',
    },
    {
      type: 'Practice',
      title: 'Watch what you tolerate',
      by: 'For two weeks',
      why: 'The standard is not what you say. It is the worst behaviour you walk past.',
    },
  ],
  'Norm Setting': [
    {
      type: 'Read',
      title: 'The Advantage',
      by: 'Patrick Lencioni',
      why: 'Organisational health as the thing that makes the strategy work at all.',
    },
    {
      type: 'Watch',
      title: 'How to turn a group of strangers into a team',
      by: 'Amy Edmondson · TED',
      why: 'Norms set explicitly and early, rather than left to settle on their own.',
    },
    {
      type: 'Practice',
      title: 'Write down three norms',
      by: 'With the team, not for them',
      why: 'Unwritten norms exist anyway. Writing them makes them arguable.',
    },
  ],
  'Psychological Safety': [
    {
      type: 'Read',
      title: 'The Fearless Organization',
      by: 'Amy Edmondson',
      why: 'The primary source, from the researcher who defined the term.',
    },
    {
      type: 'Watch',
      title: 'How to turn a group of strangers into a team',
      by: 'Amy Edmondson · TED',
      why: 'The same argument in fifteen minutes, if the book is a bigger commitment than you have.',
    },
    {
      type: 'Practice',
      title: 'Report your own mistake first',
      by: 'At your next team meeting',
      why: 'Safety is granted downward. Nobody goes first if you never do.',
    },
  ],
  Inclusion: [
    {
      type: 'Read',
      title: 'The Person You Mean to Be',
      by: 'Dolly Chugh',
      why: 'Written for people who already believe in it and still get it wrong.',
    },
    {
      type: 'Watch',
      title: 'The power of introverts',
      by: 'Susan Cain · TED',
      why: 'A dimension of inclusion most teams never think to check.',
    },
    {
      type: 'Practice',
      title: 'Track who speaks',
      by: 'In your next three meetings',
      why: 'Tally it on paper. The distribution is usually worse than the impression.',
    },
  ],
  'Values Alignment': [
    {
      type: 'Read',
      title: 'Dare to Lead',
      by: 'Brené Brown',
      why: 'Operationalising values into behaviours, which is where most values work stops.',
    },
    {
      type: 'Watch',
      title: 'How great leaders inspire action',
      by: 'Simon Sinek · TED',
      why: 'Alignment follows from a stated why, not from a poster.',
    },
    {
      type: 'Practice',
      title: 'Name the value you traded away',
      by: 'After your next hard call',
      why: 'Every real decision costs one. Saying which builds more trust than claiming none did.',
    },
  ],
  'Employee Experience': [
    {
      type: 'Read',
      title: 'The Making of a Manager',
      by: 'Julie Zhuo',
      why: 'The daily texture of managing, from someone who learned it in public.',
    },
    {
      type: 'Watch',
      title: 'Why work doesn’t happen at work',
      by: 'Jason Fried · TED',
      why: 'The experience problem most leaders create and then measure around.',
    },
    {
      type: 'Practice',
      title: 'Ask about the worst part of the week',
      by: 'In every one-to-one this month',
      why: 'Not how are things. The specific question gets the specific answer.',
    },
  ],
  'Organizational Learning': [
    {
      type: 'Read',
      title: 'An Everyone Culture',
      by: 'Robert Kegan · Lisa Lahey',
      why: 'Organisations built so that development is the work rather than beside it.',
    },
    {
      type: 'Watch',
      title: 'Building a psychologically safe workplace',
      by: 'Amy Edmondson · TEDx',
      why: 'Learning requires the safety to report what did not work.',
    },
    {
      type: 'Practice',
      title: 'Write the lesson where others will find it',
      by: 'After the next project',
      why: 'A lesson learned in one head is not organisational learning.',
    },
  ],
};

export function getRootRecommendations(subTraitName) {
  const key = String(subTraitName || '').trim();
  if (RECS_BY_SUBTRAIT[key]) return RECS_BY_SUBTRAIT[key];
  // Loose match by trait name (e.g. "Communication & Clarity" might match "Clarity")
  const loose = Object.keys(RECS_BY_SUBTRAIT).find((k) =>
    key.toLowerCase().includes(k.toLowerCase())
  );
  if (loose) return RECS_BY_SUBTRAIT[loose];
  return DEFAULT_RECS;
}

/** Subtraits with no curated entry yet — they fall through to DEFAULT_RECS. */
export function uncoveredSubtraits(allSubtraitNames = []) {
  return allSubtraitNames.filter((n) => !RECS_BY_SUBTRAIT[String(n || '').trim()]);
}
