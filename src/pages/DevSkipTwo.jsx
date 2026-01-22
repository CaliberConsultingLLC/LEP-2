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

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 10 societal norm question texts (Insights)
const SOCIETAL_NORMS_QUESTIONS = [
  "When challenges arise, I share the answer from my experience and expertise.",
  "I visibly react before I respond to difficult or bad news that is shared with me about the company",
  "When the correction/learning from a team member's mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.",
  "I am intentional about hiring employees that equally fit the need and the company culture and values.",
  "My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation",
  "I am known among employees for one-line phrases like \"do what's right,\" \"challenges mean learning,\" or \"We're in this together.\" Perhaps, jokes about it exist among employees.",
  "I have more answers than I do questions in our team discussions.",
  "It is important that our employee performance metrics are are directly connected to their work AND in their control.",
  "I communicate processes, vision, and expectations so much that I am tired of hearing it.",
  "When I am struggling professionally, I openly share that information with my team."
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
const [norms, setNorms] = useState(Array.from({ length: 10 }, () => rnd(1, 10)));
const [loading, setLoading] = useState(true);

const [summary, setSummary] = useState('');
const [campaignText, setCampaignText] = useState('');
const [campaignData, setCampaignData] = useState(null); // ← array of {trait, statements}
const [campaignLoading, setCampaignLoading] = useState(false);
const [campaignError, setCampaignError] = useState('');


  // Ensure aiSummary is present for CampaignBuilder
 useEffect(() => {
  const passed = location.state?.aiSummary;
  const fromLS = (typeof window !== 'undefined' && localStorage.getItem('aiSummary')) || '';
  const s = (passed && passed.trim()) ? passed : fromLS;
  if (passed && passed.trim()) {
    localStorage.setItem('aiSummary', passed);
  }
  if (s && s.trim()) setSummary(s.trim());
}, [location.state]);


  // Helper: fetch campaign text (no UI from builder)
const fetchCampaign = async () => {
  const s = summary || (typeof window !== 'undefined' && localStorage.getItem('aiSummary')) || '';
  if (!sessionId || !s) return; // wait until ready

  setCampaignLoading(true);
  setCampaignError('');
  setCampaignText('');
  setCampaignData(null);

  try {
    // The API expects { aiSummary } and returns { campaign: [...] }
    // See repo api/get-campaign.js and CampaignBuilder.jsx.
    const res = await fetch('/api/get-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ aiSummary: s })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data?.campaign)) {
        setCampaignData(data.campaign);   // ← use structured data
      } else {
        // tolerate legacy/text
        const fallback = (data.campaignText || data.text || '').trim();
        if (!fallback) throw new Error('Empty campaign payload');
        setCampaignText(fallback);
      }
    } else {
      // rare: plain text response
      const txt = (await res.text()).trim();
      if (!txt) throw new Error('Empty campaign text');
      setCampaignText(txt);
    }
  } catch (e) {
    console.error('[DevSkipTwo] fetchCampaign error:', e);
    setCampaignError('Failed to load campaign: ' + e.message);
  } finally {
    setCampaignLoading(false);
  }
};





// When both are ready, fetch the campaign text
useEffect(() => {
  if (!loading && sessionId && summary) {
    fetchCampaign();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading, sessionId, summary]);


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
          if (Array.isArray(data.responses) && data.responses.length === 10) {
            setNorms(data.responses);
          } else {
            // normalize to 10 values if legacy doc is wrong length
            const fresh = Array.from({ length: 10 }, () => rnd(1, 10));
            setNorms(fresh);
            await setDoc(normsRef, { sessionId: sess, responses: fresh, timestamp: new Date().toISOString() }, { merge: true });
          }
        } else {
          const fresh = Array.from({ length: 10 }, () => rnd(1, 10));
          setNorms(fresh);
          await setDoc(normsRef, { sessionId: sess, responses: fresh, timestamp: new Date().toISOString() }, { merge: true });
        }
      } catch (e) {
        console.error('[DevSkipTwo] init norms error:', e);
      } finally {
  setLoading(false);
  // no fetch here; we wait for summary + sessionId readiness
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
  } catch (e) {
    console.error('[DevSkipTwo] save norms error:', e);
  } finally {
  setLoading(false);
  fetchCampaign();
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
  p: 5,
  minHeight: '100vh',
  width: '100%',
  overflowX: 'hidden',
  backgroundImage: 'linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,.6)), url(/LEP2.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
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

            <Section title="Insights (1–10)">
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
  sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', alignSelf: 'flex-start' }}
>
  <Typography variant="h6" sx={{ mb: 1 }}>Campaign Builder Preview</Typography>
  <Divider sx={{ mb: 2 }} />

  {campaignLoading && (
  <Typography variant="body2" sx={{ opacity: 0.7 }}>Generating…</Typography>
)}

{!campaignLoading && campaignError && (
  <Typography variant="body2" color="error">{campaignError}</Typography>
)}

{!campaignLoading && !campaignError && !campaignText && (
  <Typography variant="body2" sx={{ opacity: 0.7 }}>
    No campaign content yet.
  </Typography>
)}

{!campaignLoading && !campaignError && (campaignData || campaignText) && (
  <Box sx={{ maxHeight: '70vh', overflow: 'auto', pr: 1 }}>
    {campaignData ? (
      <Stack spacing={2}>
        {campaignData.map((item, i) => (
          <Box key={i}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {item.trait}
            </Typography>
            <Stack spacing={0.5}>
              {item.statements.map((st, j) => (
                <Stack key={j} direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ mt: '6px' }}>•</Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {st}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    ) : (
      <Stack spacing={1}>
        {(() => {
          const lines = (campaignText || '')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          return lines.map((line, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <Box sx={{ mt: '6px' }}>•</Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {line.replace(/^[-*•]\s*/, '')}
              </Typography>
            </Stack>
          ));
        })()}
      </Stack>
    )}
  </Box>
)}


</Paper>

          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
