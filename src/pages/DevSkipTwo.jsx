// src/pages/DevSkipTwo.jsx
import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CampaignBuilder from './CampaignBuilder'; // reuse your builder component

import DevSkipOne from './DevSkipOne'; // not used; just example of reuse

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const pickMany = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

const INDUSTRIES  = ['Technology','Healthcare','Finance','Education','Manufacturing'];
const ROLES       = ['Manager','Director','VP','Founder','Lead'];
const RESOURCES   = ['Time','Budget','Talent','Tools','Mentorship'];
const COMM_STYLES = ['Clear','Encouraging','Inspiring','Direct','Supportive'];
const AGENTS      = ['balancedMentor','formalEmpatheticCoach','bluntPracticalFriend'];

// 32 statements (1..10). If you have 33 in your list, change the length below accordingly.
const RANDOM_NORMS = Array.from({ length: 32 }, () => rnd(1,10));

export default function DevSkipTwo() {
  const [formData, setFormData] = useState(null);
  const [norms, setNorms] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
      }

      const intake = {
  sessionId,
  name: "Dev User",
  industry: "Technology",
  role: "Team Lead",
  responsibilities: "Dev test scenario",
  teamSize: rnd(1, 10),
  leadershipExperience: rnd(0, 10),
  careerExperience: rnd(0, 20),
  resourcePick: pick(RESOURCE_PICK),
  coffeeImpression: pick(COFFEE_IMPRESSION),
  projectApproach: pick(PROJECT_APPROACH),
  energyDrains: shuffle(ENERGY_DRAINS).slice(0, 3),
  crisisResponse: shuffle(CRISIS_RESPONSE),
  pushbackFeeling: "A bit anxious but focused on learning.",
  roleModelTrait: shuffle(ROLE_MODEL_TRAIT).slice(0, 2),
  successMetric: pick(SUCCESS_METRIC),
  warningLabel: pick(WARNING_LABEL),
  leaderFuel: shuffle(LEADER_FUEL),
  proudMoment: "My team shipped a critical feature under pressure.",
  selfReflection: "I need to be more decisive in conflict.",
  selectedAgent: pick(AGENTS),
  timestamp: new Date().toISOString(),
};

// norms stays as you had:
const normsDoc = { sessionId, responses: Array.from({ length: 32 }, () => rnd(1,10)), timestamp: new Date().toISOString() };


      try {
        await setDoc(doc(db, 'responses', sessionId), intake, { merge: true });
        await setDoc(doc(db, 'societalNorms', sessionId), normsDoc, { merge: true });
        setFormData(intake);
        setNorms(normsDoc);

        const res = await fetch('/get-ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(intake)
        });
        const data = await res.json();
        setAiSummary(data.aiSummary || '(no summary returned)');
      } catch (e) {
        console.error('[DevSkip2] error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Box p={6}><Typography>Building scenario…</Typography></Box>;

  return (
    <Box sx={{
      p:5, minHeight:'100vh', width:'100vw',
      backgroundImage:'linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.5)), url(/LEP1.jpg)',
      backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat'
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb:3, fontFamily:'Gemunu Libre, sans-serif' }}>
          Dev Skip 2 — Random Intake + Norms + Summary + Campaign Preview
        </Typography>

        <Stack spacing={2}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6">Randomized Intake Payload</Typography>
            <pre style={{ whiteSpace:'pre-wrap', fontSize:12 }}>{JSON.stringify(formData, null, 2)}</pre>
          </Paper>

          <Paper sx={{ p:2 }}>
            <Typography variant="h6">Randomized Societal Norms</Typography>
            <pre style={{ whiteSpace:'pre-wrap', fontSize:12 }}>{JSON.stringify(norms, null, 2)}</pre>
          </Paper>

          <Paper sx={{ p:2 }}>
            <Typography variant="h6">AI Summary</Typography>
            <Typography sx={{ whiteSpace:'pre-wrap' }}>{aiSummary}</Typography>
          </Paper>

          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Campaign Builder (Inline Preview)</Typography>
            {/* CampaignBuilder already reads sessionId + Firestore; mounting it here will render the plan */}
            <CampaignBuilder />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
