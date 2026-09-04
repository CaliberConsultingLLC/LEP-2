import React from 'react';
import { Box, Stack, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import { DOCUMENTS_PATH, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../data/supportLinks';
import { buttons, colors, fonts, radii, surfaces, type } from '../styles/tokens';

const FAQ_ITEMS = [
  {
    q: 'What is Compass?',
    a: 'An AI-powered independent development plan (IDP). It is how you improve as a leader — not a course, not a coach, and not a personality quiz.',
  },
  {
    q: 'What do I get from the first sitting?',
    a: 'A written reflection of how you lead, three traits to grow, a self-assessment, and a team survey on the same statements. That sitting opens the year on the dashboard: the signal, the evidence, and your action plan together.',
  },
  {
    q: 'What is the Compass score?',
    a: 'The combined reading of how a behavior is landing. Higher means the team sees it more clearly. It is a pattern across statements, not a verdict or a personality score.',
  },
  {
    q: 'What is the Signal?',
    a: 'After your team answers, Signal is the reading of how those traits are landing. It is a pattern across the statements, not a verdict.',
  },
  {
    q: 'What is the difference between Effort and Effectiveness?',
    a: 'Effort is how much you try the behavior. Effectiveness is how well it lands for the people around you. Your team rates the same sentences; they are not scoring your intent.',
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
    a: 'Look for a clearer Signal on the traits you chose, a smaller gap between Effort and Effectiveness, and a practice your team can name without a slide deck.',
  },
  {
    q: 'How do I get help?',
    a: `Email ${SUPPORT_EMAIL}. Include the email on your account and what you were doing. We cannot tell you who said what on the team survey.`,
  },
];

function Faq() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surface2 }}>
      <ProcessTopRail utilityOnly />
      <CompassLayout>
        <Box sx={{ ...surfaces.card, p: { xs: 2.4, md: 3.4 }, maxWidth: 720, mx: 'auto' }}>
          <Typography sx={{ ...type.eyebrow, mb: 1 }}>Help</Typography>
          <Typography sx={{ ...type.lead, mb: 1.2 }}>FAQ</Typography>
          <Typography sx={{ ...type.bodyMuted, mb: 2.4 }}>
            Short answers on what Compass is, how scores work, and what your team sees.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1, mb: 2.4 }}>
            <Box
              component={RouterLink}
              to={DOCUMENTS_PATH}
              sx={{ ...buttons.outlinedPrimary, textDecoration: 'none', fontSize: 12.5, py: '8px', px: '14px' }}
            >
              Documents
            </Box>
            <Box
              component="a"
              href={SUPPORT_MAILTO}
              sx={{ ...buttons.outlinedPrimary, textDecoration: 'none', fontSize: 12.5, py: '8px', px: '14px' }}
            >
              Email support
            </Box>
          </Stack>

          <Stack spacing={1.1}>
            {FAQ_ITEMS.map((item) => (
              <Accordion
                key={item.q}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: `${radii.md} !important`,
                  border: `1px solid ${colors.sand200}`,
                  bgcolor: colors.surface1,
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.orangeDeep }} />}>
                  <Typography sx={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ ...type.body, color: colors.textSecondary }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default Faq;
