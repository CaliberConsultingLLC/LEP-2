import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import { ExpandMore, HelpOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    q: 'How is my Compass Score calculated?',
    a: 'Your Compass Score blends efficacy and effort from team ratings, weighted toward efficacy to reflect outcomes, not just intent.',
  },
  {
    q: 'What does the gap between effort and efficacy mean?',
    a: 'A larger gap suggests you are putting in strong effort but your team is not consistently experiencing the intended impact.',
  },
  {
    q: 'Why do campaign response rates matter so much?',
    a: 'Higher response rates improve reliability. When too few responses are submitted, patterns may look sharper or weaker than reality.',
  },
  {
    q: 'When should I close a campaign?',
    a: 'Close the campaign once participation is broad enough to trust the signal. Ten days is a practical default window.',
  },
  {
    q: 'Can I run more than one campaign cycle?',
    a: 'Yes. Multiple campaign rounds help you compare trend lines and validate whether behavior changes are being felt by the team.',
  },
  {
    q: 'How do I know which trait to prioritize first?',
    a: 'Prioritize traits where the impact risk is highest and the gap is largest, especially when trust, clarity, or pace are affected.',
  },
  {
    q: 'What if team ratings conflict with my self-perception?',
    a: 'That is normal and useful. The difference often reveals hidden blind spots or communication mismatches worth investigating.',
  },
  {
    q: 'Can I share dashboard insights with stakeholders?',
    a: 'Yes. Share summary insights, trend direction, and action priorities while preserving individual response privacy and confidentiality.',
  },
  {
    q: 'How often should I update my action plans?',
    a: 'Review action plans weekly and refresh them each campaign cycle based on current data, not assumptions from past rounds.',
  },
  {
    q: 'What is the best indicator that growth is working?',
    a: 'Look for improved efficacy, narrowing effort-efficacy gaps, and stronger consistency across team feedback over consecutive campaigns.',
  },
];

function Faq() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflowX: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ py: 3.5 }}>
        <Paper
          sx={{
            p: { xs: 2, md: 2.8 },
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.26)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(236,242,252,0.9))',
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <HelpOutline sx={{ color: 'primary.main' }} />
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: { xs: '1.45rem', md: '1.7rem' },
                  fontWeight: 800,
                  color: 'text.primary',
                }}
              >
                Help & FAQ
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', textTransform: 'none' }}
            >
              Back to Dashboard
            </Button>
          </Stack>

          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '0.98rem',
              color: 'text.secondary',
              mb: 2,
            }}
          >
            Answers to the most common questions about campaigns, score interpretation, and next-step decisions.
          </Typography>

          <Stack spacing={1.1}>
            {FAQ_ITEMS.map((item) => (
              <Accordion
                key={item.q}
                disableGutters
                sx={{
                  borderRadius: '12px !important',
                  border: '1px solid rgba(69,112,137,0.24)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.02rem', fontWeight: 700 }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.98rem', color: 'text.secondary', lineHeight: 1.6 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default Faq;
