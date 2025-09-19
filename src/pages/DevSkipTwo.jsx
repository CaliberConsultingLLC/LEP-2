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
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CampaignBuilder from './CampaignBuilder';

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
  const [sessionId, setSessionId] = useState(null);
  const [norms, setNorms] = useState(Array.from({ length: 32 }, () => rnd(1, 10)));
  const [loading, setLoading] = useState(true);
  const [builderKey, setBuilderKey] = useState(0); // force CampaignBuilder refresh on save

  useEffect(() => {
    (async () => {
      // carry-over session from DevSkipOne
      let sess = localStorage.getItem('sessionId');
      if (!sess) {
        sess = `sess-${Date.now()}`;
        localStorage.setItem('sessionId', sess);
      }
      setSessionId(sess);

      // DO NOT randomize intake here; require existing intake from DevSkipOne.
      // Randomize norms on first load (no prior norms doc), then persist.
      try {
        const normsRef = doc(db, 'societalNorms', sess);
        const normsSnap = await getDoc(normsRef);

        let currentNorms = norms;
        if (normsSnap.exists()) {
          const data = normsSnap.data();
          if (Array.isArray(data.responses) && data.responses.length > 0) {
            currentNorms = data.responses;
            setNorms(currentNorms);
          }
        } else {
          // first-time: write randomized norms
          await setDoc(normsRef, {
            sessionId: sess,
            responses: currentNorms,
            timestamp: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (e) {
        console.error('[DevSkipTwo] norms init error:', e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Re-Run Output: save norms only, refresh inline CampaignBuilder (no AI summary call here)
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
          {/* LEFT: Norms only */}
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
                  <Grid item xs={6} sm={4} md={3} key={`norm-${idx}`}>
                    <FieldCard>
                      <FormControl fullWidth size="small">
                        <InputLabel>{`Q${idx + 1}`}</InputLabel>
                        <Select
                          label={`Q${idx + 1}`}
                          value={val}
                          onChange={handleNormChange(idx)}
                          input={<OutlinedInput label={`Q${idx + 1}`} />}
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

          {/* RIGHT: Inline Campaign Builder (reflects intake from DevSkipOne + current norms) */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, minWidth: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider', alignSelf: 'flex-start' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Campaign Builder Preview</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ '& > *': { width: '100%' } }}>
                {/* Remount when norms saved to refresh view */}
                <CampaignBuilder key={builderKey} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
