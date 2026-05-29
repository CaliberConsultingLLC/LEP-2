import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { useNavigate } from 'react-router-dom';

const navySerif = '"Fraunces", Georgia, "Times New Roman", serif';
const sansBody = '"Manrope", "Inter", system-ui, sans-serif';
const monoEyebrow = '"JetBrains Mono", ui-monospace, monospace';

const tiers = [
  {
    id: 'individual',
    label: 'Self-Directed',
    title: 'Individual',
    price: null,
    tagline: 'For the leader going first.',
    featured: false,
    features: [
      'Full intake + personalized reflection',
      'Five calibrated growth traits',
      'Select three campaign focuses',
      'Team survey (up to 10 respondents)',
      'Year-long dashboard + check-in prompts',
    ],
    cta: 'Get Started',
    ctaRoute: '/user-info',
  },
  {
    id: 'team',
    label: 'For Managers + Their Teams',
    title: 'Team',
    price: null,
    tagline: 'For the leader who brings the team along.',
    featured: true,
    features: [
      'Everything in Individual',
      'Unlimited team survey respondents',
      'Comparative perception-vs-reality analytics',
      'Shared campaign language for the team',
      'Manager + team dashboard view',
    ],
    cta: 'Get Started',
    ctaRoute: '/user-info',
  },
  {
    id: 'organization',
    label: 'Enterprise',
    title: 'Organization',
    price: 'Custom',
    tagline: 'For organizations serious about leadership at scale.',
    featured: false,
    features: [
      'Everything in Team',
      'Org-wide dashboard and aggregated insights',
      'Cohort campaigns across leadership levels',
      'Dedicated onboarding and success support',
      'Custom integrations and data export',
    ],
    cta: 'Contact Us',
    ctaRoute: null,
  },
];

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. You can complete the full intake and receive your reflection at no cost. Upgrading unlocks the team survey and campaign dashboard.',
  },
  {
    q: 'How does the team survey work?',
    a: 'After you select your three focus traits, Compass generates a short survey (5–7 minutes) that goes to your team. It\'s anonymous. They rate specific, observable behaviors tied to your chosen traits. You see the aggregated results.',
  },
  {
    q: 'Does my HR team or manager need to be involved?',
    a: 'No. Compass is built to be self-directed. Your reflection and results belong to you. You choose what to share and with whom.',
  },
  {
    q: 'What happens after the year?',
    a: 'Your data lives in your dashboard. You can run a new intake anytime and start a new campaign. Many leaders treat it as an annual leadership audit.',
  },
];

function FeatureItem({ text, onDark }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="flex-start">
      <CheckRoundedIcon
        sx={{
          fontSize: 16,
          color: onDark ? '#F4CEA1' : '#E07A3F',
          mt: 0.25,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontFamily: sansBody,
          fontWeight: 500,
          fontSize: '0.92rem',
          lineHeight: 1.5,
          color: onDark ? 'rgba(255,248,240,0.80)' : '#44566C',
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Box
      sx={{
        borderBottom: '1px solid rgba(15,28,46,0.10)',
        py: { xs: 2, md: 2.5 },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setOpen((v) => !v)}
        sx={{ cursor: 'pointer', gap: 2 }}
      >
        <Typography
          sx={{
            fontFamily: navySerif,
            fontWeight: 600,
            fontSize: { xs: '1.05rem', md: '1.2rem' },
            letterSpacing: '-0.015em',
            color: '#10223C',
            lineHeight: 1.3,
          }}
        >
          {q}
        </Typography>
        <Box
          sx={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1.5px solid rgba(224,122,63,0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C0612A',
            transition: 'background-color 180ms ease',
            bgcolor: open ? 'rgba(224,122,63,0.08)' : 'transparent',
          }}
        >
          {open
            ? <RemoveRoundedIcon sx={{ fontSize: 16 }} />
            : <AddRoundedIcon sx={{ fontSize: 16 }} />
          }
        </Box>
      </Stack>
      {open && (
        <Typography
          sx={{
            fontFamily: sansBody,
            fontWeight: 500,
            fontSize: '0.96rem',
            lineHeight: 1.7,
            color: '#44566C',
            mt: 1.6,
            maxWidth: 680,
          }}
        >
          {a}
        </Typography>
      )}
    </Box>
  );
}

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FBF7F0',
        color: '#10223C',
        overflowX: 'hidden',
        fontFamily: sansBody,
      }}
    >
      {/* ── MINIMAL NAV ── */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 72,
          px: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid rgba(15,28,46,0.08)',
        }}
      >
        <Box
          sx={{
            fontFamily: '"Cinzel", "Times New Roman", Georgia, serif',
            fontWeight: 600,
            fontSize: 23,
            letterSpacing: '-0.045em',
            fontVariant: 'small-caps',
            color: '#10223C',
            userSelect: 'none',
          }}
        >
          The Compass
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => navigate(-1)}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1.8,
            py: 0.85,
            borderRadius: 999,
            border: '1.5px solid rgba(15,28,46,0.18)',
            fontFamily: sansBody,
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#44566C',
            transition: '160ms ease',
            '&:hover': {
              borderColor: '#C0612A',
              color: '#C0612A',
            },
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
          Back
        </Box>
      </Box>

      {/* ── HERO BAND ── */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 7, md: 10 },
          background: 'linear-gradient(180deg, #060F22 0%, #0A1830 40%, #10223C 100%)',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* Stars */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'radial-gradient(2px 2px at 8% 22%, rgba(255,255,255,0.85), transparent 55%)',
              'radial-gradient(1.6px 1.6px at 23% 10%, rgba(255,255,255,0.75), transparent 55%)',
              'radial-gradient(2.2px 2.2px at 42% 28%, rgba(255,255,255,0.88), transparent 55%)',
              'radial-gradient(1.4px 1.4px at 61% 14%, rgba(255,255,255,0.70), transparent 55%)',
              'radial-gradient(2px 2px at 79% 24%, rgba(255,255,255,0.82), transparent 55%)',
              'radial-gradient(1.8px 1.8px at 91% 8%, rgba(255,255,255,0.90), transparent 55%)',
              'radial-gradient(1px 1px at 15% 38%, rgba(255,255,255,0.42), transparent 60%)',
              'radial-gradient(1px 1px at 55% 6%, rgba(255,255,255,0.38), transparent 60%)',
              'radial-gradient(1px 1px at 72% 34%, rgba(255,255,255,0.40), transparent 60%)',
              'radial-gradient(2px 2px at 32% 18%, rgba(244,206,161,0.80), transparent 55%)',
              'radial-gradient(1.6px 1.6px at 68% 26%, rgba(244,206,161,0.65), transparent 55%)',
              'radial-gradient(1.2px 1.2px at 88% 16%, rgba(244,206,161,0.55), transparent 60%)',
            ].join(', '),
            maskImage: 'linear-gradient(180deg, #000 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2.4} alignItems="center">
            <Typography
              sx={{
                fontFamily: monoEyebrow,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#F4CEA1',
              }}
            >
              Simple Pricing
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: navySerif,
                fontWeight: 500,
                fontSize: { xs: '2.4rem', md: '3.4rem' },
                lineHeight: 1.05,
                letterSpacing: '-0.035em',
                color: '#FFF8F0',
              }}
            >
              The right plan for where you are.
            </Typography>
            <Typography
              sx={{
                fontFamily: sansBody,
                fontWeight: 500,
                fontSize: { xs: '1rem', md: '1.12rem' },
                lineHeight: 1.6,
                color: 'rgba(255,248,240,0.72)',
                maxWidth: 580,
              }}
            >
              Whether you&apos;re an individual leader building self-awareness or an organization investing in team-level development, Compass meets you there.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ── PRICING TIERS ── */}
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: '#FBF7F0' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 3 }} alignItems="stretch">
            {tiers.map((tier) => (
              <Grid key={tier.id} item xs={12} md={4}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  {/* "Most Popular" banner for featured tier */}
                  {tier.featured && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -1,
                        left: 0,
                        right: 0,
                        height: 36,
                        borderRadius: '20px 20px 0 0',
                        bgcolor: '#E07A3F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: monoEyebrow,
                          fontWeight: 700,
                          fontSize: '0.62rem',
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: '#FFF8F0',
                        }}
                      >
                        Most Popular
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: '20px',
                      bgcolor: tier.featured ? '#10223C' : '#FFFFFF',
                      border: tier.featured
                        ? '1.5px solid rgba(244,206,161,0.30)'
                        : '1px solid rgba(15,28,46,0.08)',
                      boxShadow: tier.featured
                        ? '0 24px 56px rgba(15,28,46,0.22)'
                        : '0 8px 24px rgba(15,28,46,0.06)',
                      p: { xs: 3, md: 3.5 },
                      pt: tier.featured ? { xs: 4.5, md: 5 } : { xs: 3, md: 3.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                    }}
                  >
                    {/* Label pill */}
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1.4,
                        py: 0.45,
                        borderRadius: 999,
                        bgcolor: tier.featured
                          ? 'rgba(244,206,161,0.12)'
                          : 'rgba(224,122,63,0.08)',
                        border: `1px solid ${tier.featured ? 'rgba(244,206,161,0.28)' : 'rgba(224,122,63,0.22)'}`,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: monoEyebrow,
                          fontWeight: 700,
                          fontSize: '0.6rem',
                          letterSpacing: '0.20em',
                          textTransform: 'uppercase',
                          color: tier.featured ? '#F4CEA1' : '#C0612A',
                        }}
                      >
                        {tier.label}
                      </Typography>
                    </Box>

                    {/* Tier name + price */}
                    <Stack spacing={0.6}>
                      <Typography
                        sx={{
                          fontFamily: navySerif,
                          fontWeight: 600,
                          fontSize: '1.9rem',
                          letterSpacing: '-0.02em',
                          color: tier.featured ? '#FFF8F0' : '#10223C',
                          lineHeight: 1,
                        }}
                      >
                        {tier.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: navySerif,
                          fontWeight: 500,
                          fontSize: { xs: '2rem', md: '2.4rem' },
                          letterSpacing: '-0.03em',
                          color: tier.featured ? '#F4CEA1' : '#E07A3F',
                          lineHeight: 1,
                        }}
                      >
                        {tier.price ?? (
                          <Box component="span">
                            <Box component="span" sx={{ fontSize: '1rem', fontFamily: monoEyebrow, letterSpacing: '0.1em', verticalAlign: 'middle', mr: 0.5 }}>
                              PRICE
                            </Box>
                            <Box component="span" sx={{ fontSize: '1.1rem', fontFamily: sansBody, color: tier.featured ? 'rgba(244,206,161,0.45)' : 'rgba(224,122,63,0.45)' }}>
                              TBD
                            </Box>
                          </Box>
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: sansBody,
                          fontWeight: 500,
                          fontSize: '0.92rem',
                          lineHeight: 1.45,
                          color: tier.featured ? 'rgba(255,248,240,0.60)' : '#44566C',
                          fontStyle: 'italic',
                        }}
                      >
                        {tier.tagline}
                      </Typography>
                    </Stack>

                    {/* Divider */}
                    <Box sx={{ borderTop: `1px solid ${tier.featured ? 'rgba(244,206,161,0.15)' : 'rgba(15,28,46,0.08)'}` }} />

                    {/* Features */}
                    <Stack spacing={1.4} sx={{ flex: 1 }}>
                      {tier.features.map((f) => (
                        <FeatureItem key={f} text={f} onDark={tier.featured} />
                      ))}
                    </Stack>

                    {/* CTA */}
                    <Box
                      component="button"
                      type="button"
                      onClick={() => tier.ctaRoute ? navigate(tier.ctaRoute) : undefined}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        mt: 1,
                        px: 2.4,
                        py: 1.2,
                        borderRadius: 999,
                        bgcolor: tier.featured ? '#E07A3F' : 'transparent',
                        border: tier.featured ? 'none' : `1.5px solid ${tier.id === 'organization' ? 'rgba(15,28,46,0.22)' : 'rgba(224,122,63,0.55)'}`,
                        color: tier.featured ? '#FFF8F0' : (tier.id === 'organization' ? '#44566C' : '#C0612A'),
                        fontFamily: sansBody,
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.8,
                        boxShadow: tier.featured ? '0 12px 28px rgba(224,122,63,0.30)' : 'none',
                        transition: '160ms ease',
                        '&:hover': {
                          bgcolor: tier.featured ? '#C0612A' : 'rgba(224,122,63,0.06)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {tier.cta}
                      <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Trust line */}
          <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 5 } }}>
            <Typography
              sx={{
                fontFamily: sansBody,
                fontWeight: 500,
                fontSize: '0.82rem',
                color: '#44566C',
              }}
            >
              Free to start &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; Your data belongs to you
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ── FAQ ── */}
      <Box
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: '#FFFFFF',
          borderTop: '1px solid rgba(15,28,46,0.06)',
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={1.2} alignItems="center" sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
            <Typography
              sx={{
                fontFamily: monoEyebrow,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#C0612A',
              }}
            >
              Common Questions
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontFamily: navySerif,
                fontWeight: 600,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: '#10223C',
              }}
            >
              Good questions deserve straight answers.
            </Typography>
          </Stack>

          <Box sx={{ borderTop: '1px solid rgba(15,28,46,0.10)' }}>
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── BOTTOM CTA ── */}
      <Box
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: '#FBF7F0',
          borderTop: '1px solid rgba(15,28,46,0.06)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={3} alignItems="center">
            <Typography
              sx={{
                fontFamily: navySerif,
                fontWeight: 600,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: '#10223C',
              }}
            >
              Ready to find your signal?
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={() => navigate('/user-info')}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                px: 3.8,
                py: 1.5,
                borderRadius: 999,
                bgcolor: '#E07A3F',
                color: '#FFF8F0',
                fontFamily: sansBody,
                fontWeight: 800,
                fontSize: '1.02rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.9,
                boxShadow: '0 18px 42px rgba(224,122,63,0.32)',
                transition: '180ms ease',
                '&:hover': { bgcolor: '#C0612A', transform: 'translateY(-1px)' },
              }}
            >
              Start Your Compass
              <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography
              sx={{
                fontFamily: sansBody,
                fontWeight: 500,
                fontSize: '0.78rem',
                color: '#44566C',
              }}
            >
              Free to start &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; 15 minutes to your first reflection
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          px: { xs: 2.5, md: 5 },
          py: 2.4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(15,28,46,0.06)',
          bgcolor: '#FBF7F0',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box component="img" src="/CompassLogo.png" alt="" aria-hidden sx={{ width: 18, height: 18, opacity: 0.7 }} />
          <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#44566C' }}>
            &copy; {new Date().getFullYear()} North Star Partners
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {[
            { label: 'Privacy', onClick: () => {} },
            { label: 'Terms', onClick: () => {} },
            { label: 'FAQ', onClick: () => navigate('/faq') },
            { label: 'Contact', onClick: () => {} },
          ].map((link, idx, arr) => (
            <React.Fragment key={link.label}>
              <Box
                component="button"
                type="button"
                onClick={link.onClick}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  color: '#44566C',
                  transition: 'color 160ms ease',
                  '&:hover': { color: '#C0612A' },
                }}
              >
                {link.label}
              </Box>
              {idx < arr.length - 1 && (
                <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'rgba(15,28,46,0.25)' }}>&nbsp;&middot;&nbsp;</Typography>
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
