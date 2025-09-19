// src/pages/DevSkipTwo.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CampaignBuilder from './CampaignBuilder';

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 32 societal norm question texts
const SOCIETAL_NORMS_QUESTIONS = [
  'I speak up even when my view is unpopular.',
  'I change my mind when presented with new evidence.',
  'I proactively seek feedback from my team.',
  'I give direct feedback even when it’s uncomfortable.',
  'I prioritize outcomes over optics.',
  'I default to transparency unless there’s a clear reason not to.',
  'I share credit publicly and own mistakes personally.',
  'I separate urgency from importance when deciding.',
  'I invite dissent and protect the time for discussion.',
  'I close the loop on decisions with context.',
  'I document the “why” behind changes.',
  'I optimize for long-term trust over short-term wins.',
  'I ensure quieter voices are heard in meetings.',
  'I escalate only when truly blocked.',
  'I time-box experiments to reduce risk.',
  'I prefer clear ownership over consensus by default.',
  'I trade scope for quality when timelines are fixed.',
  'I choose simplicity over cleverness in plans.',
  'I default to “just enough process.”',
  'I measure progress with leading indicators.',
  'I balance speed and safety in production work.',
  'I write decisions down before socializing them.',
  'I distinguish hard constraints from preferences.',
  'I actively reduce toil for the team.',
  'I set expectations explicitly and early.',
  'I revisit decisions when assumptions change.',
  'I choose candor over comfort.',
  'I make space for reflection after delivery.',
  'I invite customers into problem framing.',
  'I treat incidents as learning opportunities.',
  'I bias toward action when uncertainty is high.',
  'I manage energy (not just time) for myself and the team.',
];

const FieldCard = ({ children }) => (
  <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { borderColor: 'primary.light' } }}>
    <CardContent sx={{ py: 1.5 }}>{children}</CardContent>
  </Card>
);

const Section = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      mb: 2,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85))',
      backdropFilter: 'blur(2px)',
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
    <Divider sx={{ mb: 2 }} />
    <Stack spacing={1.5}>{children}</Stack>
  </Paper>
);

export default function DevSkipTwo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionId, setSessionId] = useState(null);
  const [norms, setNorms] = useState(Array.from({ length: 32 }, () => rnd(1, 10)));
  const [loading, setLoading] = useState(true);
  const [builderKey, setBuilderKey] = useState(0);

  // Ensure aiSummary is present for CampaignBuilder
  useEffect(() => {
    const passed = location.state?.aiSummary;
    if (passed && typeof passed === 'string' && passed.trim()) {
      localStorage.setItem('aiSummary', passed);
    }
  }, [location.state]);


  useEffect(() => {
    (async () => {
      // carry over session from DevSkipOne
      let sess = localStorage.getItem('sessionId');
      if (!sess) {
        sess = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sess);
      }
      setSessionId(sess);

      try {
        // DO NOT re-randomize intake or call /get-ai-summary here
        // Randomize norms if none exist yet; otherwise load existing
        const normsRef = doc(db, 'societalNorms', sess);
        const normsSnap = await getDoc(normsRef);

        if (normsSnap.exists()) {
          const data = normsSnap.data();
          if (Array.isArray(data.responses) && data.responses.length === 32) {
            setNorms(data.responses);
          } else {
            // normalize to 32 values if legacy doc is wrong length
            const fresh = Array.from({ length: 32 }, () => rnd(1, 10));
            setNorms(fresh);
            await setDoc(normsRef, { sessionId: sess, responses: fresh, timestamp: new Date().toISOString() }, { merge: true });
          }
        } else {
          const fresh = Array.from({ length: 32 }, () => rnd(1, 10));
          setNorms(fresh);
          await setDoc(normsRef, { sessionId: sess, responses: fresh, timestamp: new Date().toISOString() }, { merge: true });
        }
      } catch (e) {
        console.error('[DevSkipTwo] init norms error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const randomizeNorms = () => {
    const n = Array.from({ length: 32 }, () => rnd(1, 10));
    setNorms(n);
  };

  const handleNormChange = (idx) => (e) => {
    const val = Number(e.target.value);
    setNorms((arr) => {
      const copy = [...arr];
      copy[idx] = val;
      return copy;
    });
  };

  // Save norms and refresh inline builder (no summary calls)
  const rerunOutput = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await setDoc(
        doc(db, 'societalNorms', sessionId),
        { sessionId, responses: norms, timestamp: new Date().toISOString() },
        { merge: true }
      );
      setBuilderKey((k) => k + 1);
    } catch (e) {
      console.error('[DevSkipTwo] save norms error:', e);
    } finally {
      setLoading(false);
    }
  };

  const goToCampaignBuilder = async () => {
    if (!sessionId) return;
    try {
      await setDoc(
        doc(db, 'societalNorms', sessionId),
        { sessionId, responses: norms, timestamp: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.error('[DevSkipTwo] save norms before navigate:', e);
    }
    navigate('/campaign-builder', { replace: true });
  };

  if (loading) {
    return (
      <Box p={6}>
        <Typography>Building scenario…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 5, minHeight: '100vh', width: '100vw',
      backgroundImage: 'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP1.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 3, fontFamily: 'Gemunu Libre, sans-serif' }}>
          Dev Skip 2 — Societal Norms (Randomize & Edit)
        </Typography>

        <Grid container spacing={2} alignItems="flex-start">
          {/* LEFT: Norms */}
          <Grid item xs={12} md={6}>
            <Section title="Actions">
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={rerunOutput}>Re-Run Output</Button>
                <Button variant="outlined" onClick={goToCampaignBuilder}>Go to Campaign Builder</Button>
                <Button variant="outlined" onClick={randomizeNorms}>Randomize Norms</Button>
              </Stack>
            </Section>

            <Section title="Societal Norms (1–10)">
              <Grid container spacing={1}>
                {norms.map((val, idx) => (
                  <Grid item xs={12} sm={12} md={6} key={`norm-${idx}`}>
                    <FieldCard>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        {`Q${idx + 1}. ${SOCIETAL_NORMS_QUESTIONS[idx]}`}
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel>{`Score (1–10)`}</InputLabel>
                        <Select
                          label="Score (1–10)"
                          value={val}
                          onChange={handleNormChange(idx)}
                          input={<OutlinedInput label="Score (1–10)" />}
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </FieldCard>
                  </Grid>
                ))}
              </Grid>
            </Section>
          </Grid>

          {/* RIGHT: Inline Campaign Builder (no summary UI on this page) */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                alignSelf: 'flex-start',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>Campaign Builder Preview</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  // contain the builder visually if it’s tall/wide
                  maxHeight: '70vh',
                  overflow: 'auto',
                  px: 1,
                }}
              >
                {/* If CampaignBuilder supports flags to hide summary fetching, pass them. Otherwise they will be ignored safely. */}
                <CampaignBuilder
  key={builderKey}
  embedded
  hideSummary
  aiSummary={(typeof window !== 'undefined' && localStorage.getItem('aiSummary')) || ''}
/>

              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
