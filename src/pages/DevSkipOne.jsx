// src/pages/DevSkipOne.jsx
import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore'; // REQUIRED
import { db } from '../firebase';                 // REQUIRED


const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

const RESOURCE_PICK = [
  "More time in the day to focus on priorities",
  "A larger budget to work with",
  "A mentor to guide your decision-making",
  "A team that just 'gets it'",
  "A dedicated time/space for reflection and planning",
  "A high performer to share the load",
];
const COFFEE_IMPRESSION = [
  "They really listen to us.",
  "They’ve got everything under control.",
  "They make us want to step up.",
  "They make our team better.",
  "They’re always thinking ahead.",
  "They hold a high bar for us.",
  "They trust us to deliver.",
];
const PROJECT_APPROACH = [
  "Create a detailed plan to guide the team.",
  "Dive into the most challenging aspect to lead by example.",
  "Gather the team for a collaborative brainstorming session.",
  "Focus on identifying and mitigating the biggest risks.",
  "Distribute tasks to the team and set clear check-in points.",
];
const ENERGY_DRAINS = [
  "Repeating myself to ensure understanding",
  "Addressing a team member’s inconsistent contributions",
  "Decoding unspoken concerns from the team",
  "Navigating frequent changes in priorities",
  "Meetings with limited or no outcomes",
  "Mediating conflicts within the team",
  "Pursuing goals that lack clear direction",
  "Balancing expectations from high-pressure stakeholders",
];
const CRISIS_RESPONSE = [
  "I stay calm and provide clear direction.",
  "I rally everyone to brainstorm solutions.",
  "I focus on verifying details to ensure accuracy.",
  "I empower the team to take the lead while I support.",
  "I take a hands-on role to address the issue quickly.",
];
const ROLE_MODEL_TRAIT = [
  "Connecting with people effortlessly",
  "Making tough decisions without hesitation",
  "Staying calm under pressure",
  "Painting a clear vision for the future",
  "Getting the best out of everyone",
  "Explaining complex ideas simply",
  "Knowing when to step back and listen",
];
const SUCCESS_METRIC = [
  "The team’s buzzing with energy and momentum.",
  "We hit our big goals or deadlines.",
  "Team members stepped up with their own ideas.",
  "I cleared roadblocks that were holding us back.",
  "Collaboration was smooth and drama-free.",
  "Someone acknowledged the progress we made.",
];
const WARNING_LABEL = [
  "Caution: May overthink the details.",
  "Warning: Moves fast—keep up!",
  "Buckle up, we change directions quickly here.",
  "Flammable: Sparks fly under pressure.",
  "Fragile: Avoid too much pushback.",
  "High voltage: Big ideas ahead.",
];
const LEADER_FUEL = [
  "Seeing the team gel and succeed together",
  "Nailing a tough project on time",
  "Solving a problem no one else could",
  "Hearing the team say they learned something",
  "My team getting the recognition it deserves",
  "Turning chaos into order",
];
const AGENTS = [
  "bluntPracticalFriend",
  "formalEmpatheticCoach",
  "balancedMentor",
  "comedyRoaster",
  "pragmaticProblemSolver",
  "highSchoolCoach",
];

export default function DevSkipOne() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // session
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
      }

      // random intake
      const payload = {
  sessionId,
  name: "Dev User",
  industry: "Technology",
  role: "Team Lead",
  responsibilities: "Dev test scenario",
  // sliders (match ranges in Intake)
  teamSize: rnd(1, 10),
  leadershipExperience: rnd(0, 10),
  careerExperience: rnd(0, 20),

  // radios / multi / ranking / text
  resourcePick: pick(RESOURCE_PICK),
  coffeeImpression: pick(COFFEE_IMPRESSION),
  projectApproach: pick(PROJECT_APPROACH),
  energyDrains: shuffle(ENERGY_DRAINS).slice(0, 3),               // multi (limit 3)
  crisisResponse: shuffle(CRISIS_RESPONSE),                        // ranking (preserve as array order)
  pushbackFeeling: "A bit anxious but focused on learning.",
  roleModelTrait: shuffle(ROLE_MODEL_TRAIT).slice(0, 2),           // multi (limit 2)
  successMetric: pick(SUCCESS_METRIC),
  warningLabel: pick(WARNING_LABEL),
  leaderFuel: shuffle(LEADER_FUEL),                                // ranking (array order)
  proudMoment: "My team shipped a critical feature under pressure.",
  selfReflection: "I need to be more decisive in conflict.",
  selectedAgent: pick(AGENTS),

  timestamp: new Date().toISOString(),
};

      try {
        await setDoc(doc(db, 'responses', sessionId), payload, { merge: true });
        setFormData(payload);

        // call your existing summary endpoint
        const res = await fetch('/get-ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setAiSummary(data.aiSummary || '(no summary returned)');
      } catch (e) {
        console.error('[DevSkip1] error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Box p={6}><Typography>Building scenario…</Typography></Box>;

// Ensure CampaignBuilder receives aiSummary (state + localStorage)
const saveRandomNormsAndGo = async () => {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    console.warn('[DevSkip1] Missing sessionId; cannot write norms.');
    return;
  }

  const responses = Array.from({ length: 32 }, () => Math.floor(Math.random() * 10) + 1);

  try {
    await setDoc(
      doc(db, 'societalNorms', sessionId),
      { sessionId, responses, timestamp: new Date().toISOString() },
      { merge: true }
    );

    // persist summary for builder fallbacks
    if (aiSummary && aiSummary.trim() !== '') {
      localStorage.setItem('aiSummary', aiSummary);
    }

    console.log('[DevSkip1] Norms saved. Going to /campaign-builder');
    navigate('/campaign-builder', { replace: true, state: { aiSummary: aiSummary || null } });
  } catch (e) {
    console.error('[DevSkip1] Failed to save norms:', e);
  }
};



  return (
    <Box sx={{
      p:5, minHeight:'100vh', width:'100vw',
      backgroundImage:'linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.5)), url(/LEP1.jpg)',
      backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat'
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb:3, fontFamily:'Gemunu Libre, sans-serif' }}>
          Dev Skip 1 — Random Intake + Summary
        </Typography>

        <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
          <Paper sx={{ p:2, flex:1 }}>
            <Typography variant="h6">Randomized Intake Payload</Typography>
            <pre style={{ whiteSpace:'pre-wrap', fontSize:12 }}>{JSON.stringify(formData, null, 2)}</pre>
          </Paper>
          <Paper sx={{ p:2, flex:1 }}>
            <Typography variant="h6">AI Summary</Typography>
            <Typography sx={{ whiteSpace:'pre-wrap' }}>{aiSummary}</Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt:2, flexWrap:'wrap' }}>
  <Button variant="contained" onClick={() => navigate('/summary')}>
    Open Summary Page
  </Button>
  <Button variant="outlined" onClick={saveRandomNormsAndGo}>
    Dev Skip Norms → Campaign Builder
  </Button>
</Stack>
      </Container>
    </Box>
  );
}
