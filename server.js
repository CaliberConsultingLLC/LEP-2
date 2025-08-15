import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Admin initialization (works locally and in prod) ---
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Expecting FIREBASE_SERVICE_ACCOUNT to be a JSON string of the service account
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  // Falls back to ADC if running in an environment with GOOGLE_APPLICATION_CREDENTIALS set
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential,
  projectId: process.env.GCLOUD_PROJECT || 'leadership-evolution-project',
});

const db = admin.firestore();

// --- OpenAI client (from env) ---
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set — OpenAI routes will fail until you add it.');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !error.message.includes('rateLimitExceeded')) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed due to rate limit, retrying in ${delayMs}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}

app.get('/test', (req, res) => {
  res.send('Server is running!');
});

app.get('/get-latest-response', async (req, res) => {
  try {
    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();
    res.json(latestResponse);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Error fetching response', details: error.message });
  }
});

app.get('/get-ai-summary', async (req, res) => {
  try {
    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();

    const formality = latestResponse.feedbackFormality || 5;
    const tone = latestResponse.feedbackTone || 5;
    const practicality = latestResponse.feedbackPracticality || 5;

    const personaInstruction = `
      The user wants feedback at a formality level of ${formality} 
      (on a scale of 1-10, 1=Very Informal, 10=Very Formal, where Informal is like a comedian or good friend, and Formal is like a professional coach)
      and a tone level of ${tone} 
      (on a scale of 1-10, 1=Very Harsh, 10=Very Empathetic, where Harsh is blunt and concise, and Empathetic is elaborate and soft)
      and a practicality level of ${practicality} 
      (on a scale of 1-10, 1=Very Practical, 10=Very Inspirational, where Practical focuses on actionable steps, and Inspirational emphasizes vision and motivation).
    `;

    const prompt = `
      ${personaInstruction}
      You are a seasoned leadership coach, providing personalized insights directly to the user based on their leadership intake responses.
      Write directly to the user, using a conversational tone tailored to their preferred formality, tone, and practicality levels.
      Use only the following predefined leadership traits for 'Your Leadership Strengths' and 'Potential Blind Spots' sections: 
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.
      Select exactly two traits for 'Your Leadership Strengths' and two traits for 'Potential Blind Spots' from this list.

      The response must follow this **EXACT structure** with these exact section headers. 
      There should be **no bullet points, no symbols, and no special characters**.
      Each section should contain clean text only — a plain text header followed by plain text content.
      Ensure leadership traits in 'Your Leadership Strengths' and 'Potential Blind Spots' are underlined in the output using <u> tags.

      Use this structure:

      Leadership Summary
      Provide a 1-2 sentence elevator pitch summarizing the leader's overall style, approach, and personality. This should be insightful and not a recap of their answers.

      Your Leadership Strengths
      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      Potential Blind Spots
      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      High-Impact Development Tips
      Inspirational Perspective
      A perspective about themselves that might inspire growth or change.

      Practical Next Step
      One practical action they could implement tomorrow.

      NO bullet points.
      NO asterisks.
      NO dashes.
      NO markdown symbols other than <u> for underlining traits.
      ONLY clean section headers, underlined trait names, and clean descriptive text underneath each.

      Analyze the following leadership responses: ${JSON.stringify(latestResponse)}
    `;

    const completion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 350,
        messages: [{ role: 'system', content: prompt }],
      })
    );
    const analysis = completion.choices[0].message.content.trim();
    res.json({ aiSummary: analysis });
  } catch (error) {
    console.error('Error generating AI summary:', error.message, error.stack);
    res.status(500).json({ error: 'Error generating AI summary', details: error.message });
  }
});

app.get('/get-campaign', async (req, res) => {
  try {
    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();

    const formality = latestResponse.feedbackFormality || 5;
    const tone = latestResponse.feedbackTone || 5;
    const practicality = latestResponse.feedbackPracticality || 5;

    const personaInstruction = `
      The user wants feedback at a formality level of ${formality} 
      (on a scale of 1-10, 1=Very Informal, 10=Very Formal, where Informal is like a comedian or good friend, and Formal is like a professional coach)
      and a tone level of ${tone} 
      (on a scale of 1-10, 1=Very Harsh, 10=Very Empathetic, where Harsh is blunt and concise, and Empathetic is elaborate and soft)
      and a practicality level of ${practicality} 
      (on a scale of 1-10, 1=Very Practical, 10=Very Inspirational, where Practical focuses on actionable steps, and Inspirational emphasizes vision and motivation).
    `;

    const summaryPrompt = `
      ${personaInstruction}
      You are a seasoned leadership coach, providing personalized insights directly to the user based on their leadership intake responses.
      Write directly to the user, using a conversational tone tailored to their preferred formality, tone, and practicality levels.
      Use only the following predefined leadership traits for 'Your Leadership Strengths' and 'Potential Blind Spots' sections: 
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.
      Select exactly two traits for 'Your Leadership Strengths' and two traits for 'Potential Blind Spots' from this list.

      The response must follow this **EXACT structure** with these exact section headers. 
      There should be **no bullet points, no symbols, and no special characters**.
      Each section should contain clean text only — a plain text header followed by plain text content.
      Ensure leadership traits in 'Your Leadership Strengths' and 'Potential Blind Spots' are underlined in the output using <u> tags.

      Use this structure:

      Leadership Summary
      Provide a 1-2 sentence elevator pitch summarizing the leader's overall style, approach, and personality. This should be insightful and not a recap of their answers.

      Your Leadership Strengths
      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      Potential Blind Spots
      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      High-Impact Development Tips
      Inspirational Perspective
      A perspective about themselves that might inspire growth or change.

      Practical Next Step
      One practical action they could implement tomorrow.

      NO bullet points.
      NO asterisks.
      NO dashes.
      NO markdown symbols other than <u> for underlining traits.
      ONLY clean section headers, underlined trait names, and clean descriptive text underneath each.

      Analyze the following leadership responses: ${JSON.stringify(latestResponse)}
    `;

    const summaryCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 350,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: summaryPrompt },
        ],
      })
    );
    const analysis = summaryCompletion.choices[0].message.content.trim();

    const campaignPrompt = `
      You are an expert leadership coach and organizational psychologist. Your task is to generate a personalized leadership continuous improvement campaign for the leader based on the following leadership analysis:

      ${analysis}

      First, select 5 core leadership traits that the leader should focus on improving from the following list:
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.

      For each selected trait, create 3 team-facing survey statements. Each statement should describe a clear, observable behavior associated with that trait — something the team would be able to observe and rate.

      These statements will be rated by the team using a dual-axis 9-box grid (Effort vs. Efficacy).

      Output the results in this format — no bullets, no special characters, just clean text:

      Trait: [Trait Name]
      1. [Survey statement 1]
      2. [Survey statement 2]
      3. [Survey statement 3]

      Do this for all 5 traits. Keep your language professional and clear.
    `;

    const campaignCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: campaignPrompt },
        ],
      })
    );
    const campaignText = campaignCompletion.choices[0].message.content.trim();
    const lines = campaignText.split('\n').map(line => line.trim()).filter(line => line);
    const traits = [];
    let currentTrait = null;

    lines.forEach(line => {
      if (line.startsWith('Trait:')) {
        if (currentTrait) {
          traits.push(currentTrait);
        }
        currentTrait = { trait: line.replace('Trait:', '').trim(), statements: [] };
      } else if (currentTrait && line.match(/^\d+\./)) {
        currentTrait.statements.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    });

    if (currentTrait) {
      traits.push(currentTrait);
    }

    res.json({ campaign: traits });
  } catch (error) {
    console.error('Error generating campaign:', error.message, error.stack);
    res.status(500).json({ error: 'Error generating campaign', details: error.message });
  }
});

app.post('/dismiss-trait', async (req, res) => {
  try {
    const { dismissedTrait, currentTraits } = req.body;

    if (!dismissedTrait || !currentTraits) {
      return res.status(400).json({ error: 'Missing required fields: dismissedTrait and currentTraits' });
    }

    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();

    const formality = latestResponse.feedbackFormality || 5;
    const tone = latestResponse.feedbackTone || 5;
    const practicality = latestResponse.feedbackPracticality || 5;

    const personaInstruction = `
      The user wants feedback at a formality level of ${formality} 
      (on a scale of 1-10, 1=Very Informal, 10=Very Formal, where Informal is like a comedian or good friend, and Formal is like a professional coach)
      and a tone level of ${tone} 
      (on a scale of 1-10, 1=Very Harsh, 10=Very Empathetic, where Harsh is blunt and concise, and Empathetic is elaborate and soft)
      and a practicality level of ${practicality} 
      (on a scale of 1-10, 1=Very Practical, 10=Very Inspirational, where Practical focuses on actionable steps, and Inspirational emphasizes vision and motivation).
    `;

    const summaryPrompt = `
      ${personaInstruction}
      You are a seasoned leadership coach, providing personalized insights directly to the user based on their leadership intake responses.
      Write directly to the user, using a conversational tone tailored to their preferred formality, tone, and practicality levels.
      Use only the following predefined leadership traits for 'Your Leadership Strengths' and 'Potential Blind Spots' sections: 
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.
      Select exactly two traits for 'Your Leadership Strengths' and two traits for 'Potential Blind Spots' from this list.

      The response must follow this **EXACT structure** with these exact section headers. 
      There should be **no bullet points, no symbols, and no special characters**.
      Each section should contain clean text only — a plain text header followed by plain text content.
      Ensure leadership traits in 'Your Leadership Strengths' and 'Potential Blind Spots' are underlined in the output using <u> tags.

      Use this structure:

      Leadership Summary
      Provide a 1-2 sentence elevator pitch summarizing the leader's overall style, approach, and personality. This should be insightful and not a recap of their answers.

      Your Leadership Strengths
      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      Potential Blind Spots
      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      High-Impact Development Tips
      Inspirational Perspective
      A perspective about themselves that might inspire growth or change.

      Practical Next Step
      One practical action they could implement tomorrow.

      NO bullet points.
      NO asterisks.
      NO dashes.
      NO markdown symbols other than <u> for underlining traits.
      ONLY clean section headers, underlined trait names, and clean descriptive text underneath each.

      Analyze the following leadership responses: ${JSON.stringify(latestResponse)}
    `;

    const summaryCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 350,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: summaryPrompt },
        ],
      })
    );
    const analysis = summaryCompletion.choices[0].message.content.trim();

    // Generate a new trait with 3 statements to replace the dismissed trait
    const currentTraitNames = currentTraits.map(trait => trait.trait);
    const campaignPrompt = `
      You are an expert leadership coach and organizational psychologist. Your task is to generate a single new leadership trait with 3 team-facing survey statements for a continuous improvement campaign, based on the following leadership analysis:

      ${analysis}

      The new trait must be selected from the following list, but it must NOT be one of the following already-used traits: ${currentTraitNames.join(', ')}.
      Available traits:
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.

      For the selected trait, create exactly 3 team-facing survey statements. Each statement must describe a clear, observable behavior associated with that trait — something the team would be able to observe and rate.

      These statements will be rated by the team using a dual-axis 9-box grid (Effort vs. Efficacy).

      Output the results in this exact format — no bullets, no special characters, just clean text:

      Trait: [Trait Name]
      1. [Survey statement 1]
      2. [Survey statement 2]
      3. [Survey statement 3]

      Keep your language professional and clear. Do not include any additional text beyond the specified format.
    `;

    const campaignCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 200,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: campaignPrompt },
        ],
      })
    );
    const campaignText = campaignCompletion.choices[0].message.content.trim();
    const lines = campaignText.split('\n').map(line => line.trim()).filter(line => line);
    let newTrait = null;

    lines.forEach(line => {
      if (line.startsWith('Trait:')) {
        newTrait = { trait: line.replace('Trait:', '').trim(), statements: [] };
      } else if (newTrait && line.match(/^\d+\./)) {
        newTrait.statements.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    });

    if (!newTrait || newTrait.statements.length !== 3) {
      return res.status(500).json({ error: 'Failed to generate a new trait with 3 statements' });
    }

    const updatedTraits = currentTraits.filter(trait => trait.trait !== dismissedTrait);
    updatedTraits.push(newTrait);

    res.json({ campaign: updatedTraits });
  } catch (error) {
    console.error('Error dismissing trait:', error.message, error.stack);
    res.status(500).json({ error: 'Error dismissing trait', details: error.message });
  }
});

app.post('/dismiss-statement', async (req, res) => {
  try {
    const { traitName, statementIndex, currentTraits } = req.body;

    if (!traitName || statementIndex === undefined || !currentTraits) {
      return res.status(400).json({ error: 'Missing required fields: traitName, statementIndex, and currentTraits' });
    }

    const snapshot = await withRetry(() =>
      db.collection('responses').orderBy('timestamp', 'desc').limit(1).get()
    );
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No responses found' });
    }
    const latestResponse = snapshot.docs[0].data();

    const formality = latestResponse.feedbackFormality || 5;
    const tone = latestResponse.feedbackTone || 5;
    const practicality = latestResponse.feedbackPracticality || 5;

    const personaInstruction = `
      The user wants feedback at a formality level of ${formality} 
      (on a scale of 1-10, 1=Very Informal, 10=Very Formal, where Informal is like a comedian or good friend, and Formal is like a professional coach)
      and a tone level of ${tone} 
      (on a scale of 1-10, 1=Very Harsh, 10=Very Empathetic, where Harsh is blunt and concise, and Empathetic is elaborate and soft)
      and a practicality level of ${practicality} 
      (on a scale of 1-10, 1=Very Practical, 10=Very Inspirational, where Practical focuses on actionable steps, and Inspirational emphasizes vision and motivation).
    `;

    const summaryPrompt = `
      ${personaInstruction}
      You are a seasoned leadership coach, providing personalized insights directly to the user based on their leadership intake responses.
      Write directly to the user, using a conversational tone tailored to their preferred formality, tone, and practicality levels.
      Use only the following predefined leadership traits for 'Your Leadership Strengths' and 'Potential Blind Spots' sections: 
      Visionary Thinking – Creating and articulating a compelling long-term vision, Strategic Planning – Developing and implementing effective strategies, Big Picture Thinking – Understanding broader industry and market trends, Innovation & Creativity – Driving new ideas and approaches, Decision-Making Under Uncertainty – Making sound decisions with incomplete information, Active Listening – Engaging in attentive and responsive listening, Clear & Concise Communication – Expressing ideas effectively, Persuasion & Negotiation – Convincing others and managing conflicts constructively, Storytelling & Messaging – Using narratives to inspire and engage, Public Speaking & Presentation Skills – Conveying messages confidently and effectively, Self-Awareness – Recognizing one's own strengths, weaknesses, and emotions, Self-Regulation – Managing emotions and impulses effectively, Empathy – Understanding and considering others' emotions and perspectives, Social Awareness – Navigating social dynamics within teams and organizations, Resilience & Stress Management – Maintaining composure under pressure, Coaching & Mentoring – Developing and supporting team members' growth, Delegation – Assigning tasks appropriately while empowering others, Performance Management – Setting expectations and providing feedback, Recognition & Motivation – Encouraging and rewarding achievements, Conflict Resolution – Mediating and resolving disputes effectively, Building Trust – Establishing credibility and reliability, Cross-Functional Collaboration – Working across teams and departments, Networking & Relationship Management – Cultivating beneficial partnerships, Cultural & Diversity Awareness – Valuing different perspectives and backgrounds, Stakeholder Engagement – Managing relationships with key internal and external stakeholders, Accountability – Taking responsibility for outcomes, Problem-Solving – Identifying and addressing challenges effectively, Prioritization & Time Management – Managing tasks efficiently, Decision-Making & Judgment – Evaluating options and making sound choices, Driving Results – Ensuring that goals and objectives are met, Change Management – Leading teams through organizational change, Agility & Adaptability – Adjusting quickly to new challenges and circumstances, Growth Mindset – Embracing learning and continuous improvement, Crisis Management – Navigating and leading through crises, Experimentation & Risk-Taking – Encouraging innovation and calculated risks, Ethical Decision-Making – Upholding integrity in choices and actions, Transparency & Honesty – Communicating openly and honestly, Accountability for Ethics & Values – Holding oneself and others to high ethical standards, Fairness & Equity – Ensuring just treatment of team members, Corporate Social Responsibility (CSR) – Leading with sustainability and social impact in mind, Customer-Centric Thinking – Prioritizing customer needs and experiences, Service Orientation – Maintaining high-quality service standards, Brand & Reputation Management – Safeguarding and enhancing brand integrity, Stakeholder Value Creation – Balancing diverse interests to create positive outcomes, Negotiation & Diplomacy – Managing expectations and resolving conflicts with external parties, Technology & Digital Fluency – Staying current with digital trends and tools, Process Improvement – Identifying and implementing efficiency-enhancing changes, Agile & Lean Thinking – Using iterative approaches for better execution, Data-Driven Decision-Making – Leveraging analytics to inform strategy, Future-Oriented Leadership – Anticipating and preparing for future trends.
      Select exactly two traits for 'Your Leadership Strengths' and two traits for 'Potential Blind Spots' from this list.

      The response must follow this **EXACT structure** with these exact section headers. 
      There should be **no bullet points, no symbols, and no special characters**.
      Each section should contain clean text only — a plain text header followed by plain text content.
      Ensure leadership traits in 'Your Leadership Strengths' and 'Potential Blind Spots' are underlined in the output using <u> tags.

      Use this structure:

      Leadership Summary
      Provide a 1-2 sentence elevator pitch summarizing the leader's overall style, approach, and personality. This should be insightful and not a recap of their answers.

      Your Leadership Strengths
      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      <u>Trait Name</u>
      Brief example or description of how this strength shows up in practice.

      Potential Blind Spots
      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      <u>Blind Spot Name</u>
      Brief description of how this blind spot might show up in practice.

      High-Impact Development Tips
      Inspirational Perspective
      A perspective about themselves that might inspire growth or change.

      Practical Next Step
      One practical action they could implement tomorrow.

      NO bullet points.
      NO asterisks.
      NO dashes.
      NO markdown symbols other than <u> for underlining traits.
      ONLY clean section headers, underlined trait names, and clean descriptive text underneath each.

      Analyze the following leadership responses: ${JSON.stringify(latestResponse)}
    `;

    const summaryCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 350,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: summaryPrompt },
        ],
      })
    );
    const analysis = summaryCompletion.choices[0].message.content.trim();

    // Find the trait and its current statements
    const targetTrait = currentTraits.find(trait => trait.trait === traitName);
    if (!targetTrait) {
      return res.status(400).json({ error: `Trait ${traitName} not found in current campaign` });
    }

    const currentStatements = targetTrait.statements;
    const dismissedStatement = currentStatements[statementIndex];

    // Generate a new statement for the trait
    const statementPrompt = `
      You are an expert leadership coach and organizational psychologist. Your task is to generate a single new team-facing survey statement for the leadership trait "${traitName}" based on the following leadership analysis:

      ${analysis}

      The statement must describe a clear, observable behavior associated with the trait "${traitName}" — something the team would be able to observe and rate. It must be different from the following existing statements for this trait:
      ${currentStatements.join(', ')}

      The statement will be rated by the team using a dual-axis 9-box grid (Effort vs. Efficacy).

      Output the result as a single line of clean text, without any numbering or special characters:

      [Survey statement]

      Keep your language professional and clear. Do not include any additional text beyond the specified format.
    `;

    const statementCompletion = await withRetry(() =>
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 100,
        messages: [
          { role: 'system', content: 'You are a highly skilled leadership development advisor.' },
          { role: 'user', content: statementPrompt },
        ],
      })
    );
    const newStatement = statementCompletion.choices[0].message.content.trim();

    // Update the trait's statements
    const updatedTraits = currentTraits.map(trait => {
      if (trait.trait === traitName) {
        const updatedStatements = [...trait.statements];
        updatedStatements[statementIndex] = newStatement;
        return { ...trait, statements: updatedStatements };
      }
      return trait;
    });

    res.json({ campaign: updatedTraits });
  } catch (error) {
    console.error('Error dismissing statement:', error.message, error.stack);
    res.status(500).json({ error: 'Error dismissing statement', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LEP-2 API listening on http://localhost:${PORT}`);
});