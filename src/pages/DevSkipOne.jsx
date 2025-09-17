// src/pages/DevSkipOne.jsx
import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Stack, Typography, Button } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const pickMany = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

const COMM_STYLES = ['Clear', 'Encouraging', 'Inspiring', 'Direct', 'Supportive'];
const INDUSTRIES  = ['Technology','Healthcare','Finance','Education','Manufacturing'];
const ROLES       = ['Manager','Director','VP','Founder','Lead'];
const RESOURCES   = ['Time','Budget','Talent','Tools','Mentorship'];
const AGENTS      = ['balancedMentor','formalEmpatheticCoach','bluntPracticalFriend'];

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
        name: 'Dev User',
        industry: pick(INDUSTRIES),
        role: pick(ROLES),
        responsibilities: 'Dev test scenario',
        teamSize: rnd(3, 25),
        leadershipExperience: rnd(1, 20),
        careerExperience: rnd(2, 25),
        resourcePick: pick(RESOURCES),
        communicationStyle: pickMany(COMM_STYLES, 3),
        feedbackFormality: rnd(1,10),
        feedbackPracticality: rnd(1,10),
        feedbackTone: rnd(1,10),
        wins: ['Shipping a major release','Resolving key client issue','Team collaboration uptick'],
        impactfulAction: 'Quietly check in on their well-being',
        selectedAgent: pick(AGENTS),
        timestamp: new Date().toISOString()
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

        <Stack direction="row" spacing={2} sx={{ mt:2 }}>
          <Button variant="contained" onClick={() => navigate('/summary')}>Open Summary Page</Button>
          <Button variant="outlined" onClick={() => navigate('/campaign-builder')}>Open Campaign Builder</Button>
        </Stack>
      </Container>
    </Box>
  );
}
