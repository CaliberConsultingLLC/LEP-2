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
    q: 'What do I get from the first sitting?',
    a: 'A written reflection of how you lead, three traits to grow, a self-assessment, and a team survey on the same statements. That sitting opens the year on the dashboard: Signal, Evidence, then one practice.',
  },
  {
    q: 'What is the Signal?',
    a: 'After your team answers, Signal is the reading of how those traits are landing. It is a pattern across the statements, not a verdict or a personality score.',
  },
  {
    q: 'What is the difference between Effort and Efficacy?',
    a: 'Effort is how much you try the behavior. Efficacy is how well it lands for the people around you. Your team rates the same sentences; they are not scoring your intent.',
  },
  {
    q: 'When should I invite my team?',
    a: 'After you finish your self-assessment. The team gets a different link. You will see the aggregate — never who said what.',
  },
  {
    q: 'How many people need to answer?',
    a: 'More responses make a steadier Signal. If only a few people answer, treat the pattern as a sketch, not a conclusion.',
  },
  {
    q: 'Which trait should I practice first?',
    a: 'Start with the trait your team can actually feel this stretch — often the one with the widest gap between how hard you try and how clearly it lands.',
  },
  {
    q: 'What if my self-rating and the team Signal disagree?',
    a: 'That difference is useful. Sit with Signal and Evidence before you pick a practice. The point is what they experience, not proving the number wrong.',
  },
  {
    q: 'Can I share this with my boss or HR?',
    a: 'Share the pattern and the practice you chose. Do not share individual answers. Compass does not show who said what.',
  },
  {
    q: 'What is a practice in Compass?',
    a: 'One visible behavior your team should be able to notice in a normal week — not a list of goals. You will take a second reading later to see whether it is landing.',
  },
  {
    q: 'How do I know the year is working?',
    a: 'Look for a clearer Signal on the traits you chose, a smaller gap between Effort and Efficacy, and a practice your team can name without a slide deck.',
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
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', textTransform: 'none' }}
              >
                Return to Compass
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ fontFamily: 'Gemunu Libre, sans-serif', textTransform: 'none' }}
              >
                Dashboard
              </Button>
            </Stack>
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
