import React from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import StatTable from '../components/StatTable';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  buttons,
  chips,
  colors,
  hairlines,
  radii,
  shadows,
  surfaces,
  type,
} from '../styles/tokens';

const colorTokens = [
  ['navy950', colors.navy950],
  ['navy900', colors.navy900],
  ['navy800', colors.navy800],
  ['navy700', colors.navy700],
  ['navy600', colors.navy600],
  ['navy500', colors.navy500],
  ['navy400', colors.navy400],
  ['navy300', colors.navy300],
  ['amber', colors.amber],
  ['amberSoft', colors.amberSoft],
  ['orange', colors.orange],
  ['orangeDeep', colors.orangeDeep],
  ['green', colors.green],
  ['greenSoft', colors.greenSoft],
  ['sand50', colors.sand50],
  ['sand100', colors.sand100],
  ['sand200', colors.sand200],
  ['sand300', colors.sand300],
  ['surface1', colors.surface1],
  ['surface2', colors.surface2],
  ['surface3', colors.surface3],
  ['textPrimary', colors.textPrimary],
  ['textSecondary', colors.textSecondary],
  ['borderSoft', colors.borderSoft],
  ['ringFocus', colors.ringFocus],
];

const radiusTokens = [
  ['sm', radii.sm],
  ['md', radii.md],
  ['lg', radii.lg],
  ['xl', radii.xl],
  ['pill', radii.pill],
];

const shadowTokens = [
  ['none', shadows.none],
  ['card', shadows.card],
  ['cardHover', shadows.cardHover],
  ['inset', shadows.inset],
  ['overlay', shadows.overlay],
  ['buttonPrimary', shadows.buttonPrimary],
  ['buttonPrimaryHover', shadows.buttonPrimaryHover],
  ['buttonSecondary', shadows.buttonSecondary],
  ['appBar', shadows.appBar],
];

function PageSection({ eyebrow, title, children }) {
  return (
    <Box component="section" sx={{ mb: { xs: 4.5, md: 6 } }}>
      <Typography sx={{ ...type.eyebrow, mb: 0.8 }}>{eyebrow}</Typography>
      <Typography sx={{ ...type.lead, mb: 2 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function TokenCard({ name, children }) {
  return (
    <Box sx={{ ...surfaces.cardFlat, p: 1.6 }}>
      <Typography sx={{ ...type.monoLabel, mb: 1 }}>{name}</Typography>
      {children}
    </Box>
  );
}

function ColorSwatch({ name, value }) {
  return (
    <TokenCard name={name}>
      <Box
        sx={{
          height: 76,
          borderRadius: radii.md,
          border: hairlines.default,
          bgcolor: value,
          boxShadow: shadows.inset,
          mb: 1,
        }}
      />
      <Typography sx={{ ...type.bodyMuted, fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
        {value}
      </Typography>
    </TokenCard>
  );
}

function RadiusSample({ name, value }) {
  return (
    <TokenCard name={name}>
      <Box
        sx={{
          height: 74,
          borderRadius: value,
          border: hairlines.default,
          bgcolor: colors.surface2,
        }}
      />
    </TokenCard>
  );
}

function ShadowSample({ name, value }) {
  return (
    <TokenCard name={name}>
      <Box
        sx={{
          height: 74,
          borderRadius: radii.lg,
          border: hairlines.default,
          bgcolor: colors.surface1,
          boxShadow: value,
        }}
      />
    </TokenCard>
  );
}

export default function DesignSystem() {
  const [isDark, toggleDark] = useDarkMode();

  const statRows = [
    { key: 'team', label: 'Team', impact: 62, effort: 78, color: colors.navy900 },
    { key: 'self', label: 'Self', impact: 74, effort: 52, color: colors.orange },
    { key: 'gap', label: 'Gap', impact: '+12', effort: '-26', color: colors.textSecondary },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surface2, color: colors.textPrimary }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2.4, md: 5 }, py: { xs: 4, md: 6 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: { xs: 4, md: 5 } }}
        >
          <Box>
            <Typography sx={{ ...type.eyebrow, mb: 1 }}>Compass Cairn</Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: { xs: 36, md: 52 },
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: colors.textPrimary,
                mb: 1.2,
              }}
            >
              Design System
            </Typography>
            <Typography sx={{ ...type.bodyMuted, maxWidth: 650 }}>
              Live samples from `cairn-theme.css`, the same system used by Summary,
              Trait Selection, Intake, Guide Select, and the campaign flow.
            </Typography>
          </Box>
          <Button variant="contained" onClick={toggleDark} sx={buttons.primary}>
            {isDark ? 'Light mode' : 'Dark mode'}
          </Button>
        </Stack>

        <PageSection eyebrow="Foundations" title="Colors">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 1.5,
            }}
          >
            {colorTokens.map(([name, value]) => (
              <ColorSwatch key={name} name={name} value={value} />
            ))}
          </Box>
        </PageSection>

        <PageSection eyebrow="Shape" title="Radii">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 1.5,
            }}
          >
            {radiusTokens.map(([name, value]) => (
              <RadiusSample key={name} name={name} value={value} />
            ))}
          </Box>
        </PageSection>

        <PageSection eyebrow="Depth" title="Shadows">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {shadowTokens.map(([name, value]) => (
              <ShadowSample key={name} name={name} value={value} />
            ))}
          </Box>
        </PageSection>

        <PageSection eyebrow="Typography" title="Type Patterns">
          <Stack spacing={1.6} sx={{ ...surfaces.card, p: { xs: 2, md: 3 } }}>
            <Typography sx={type.eyebrow}>Eyebrow Label</Typography>
            <Typography sx={type.lead}>A calm leadership study, grounded in signal and practice.</Typography>
            <Typography sx={type.sectionTitle}>Section title with the Cairn serif voice</Typography>
            <Typography sx={type.body}>
              Body copy uses Manrope for clarity. It should be quiet, direct, and easy to scan.
            </Typography>
            <Typography sx={type.italicBody}>
              Interpretive copy uses Fraunces italic when the system is helping the leader sit with meaning.
            </Typography>
            <Typography sx={type.monoLabel}>Mono label</Typography>
            <Typography sx={type.statNumber}>72</Typography>
          </Stack>
        </PageSection>

        <PageSection eyebrow="Components" title="Surfaces, Buttons, Chips">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box sx={{ ...surfaces.card, p: 2.2 }}>
              <Typography sx={{ ...type.eyebrow, mb: 1 }}>Card</Typography>
              <Typography sx={type.bodyMuted}>Canonical card: radius lg, sand border, card shadow.</Typography>
            </Box>
            <Box sx={{ ...surfaces.cardFlat, p: 2.2 }}>
              <Typography sx={{ ...type.eyebrow, mb: 1 }}>Flat Card</Typography>
              <Typography sx={type.bodyMuted}>Nested card: same shape and border, no shadow.</Typography>
            </Box>
            <Box sx={{ ...surfaces.cardInner, p: 2.2 }}>
              <Typography sx={{ ...type.eyebrow, mb: 1 }}>Inner Card</Typography>
              <Typography sx={type.bodyMuted}>Small grouped surface: radius md, no shadow.</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.2} flexWrap="wrap" sx={{ rowGap: 1.2, mb: 2 }}>
            <Button variant="contained" sx={buttons.primary}>Primary Button</Button>
            <Button variant="contained" color="secondary" sx={buttons.secondary}>Secondary Button</Button>
            <Button variant="outlined" sx={buttons.outlinedPrimary}>Outlined Button</Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            <Chip label="Default Chip" />
            <Chip label="Primary Chip" color="primary" />
            <Box sx={{ ...chips.base, ...chips.active }}>Custom Active</Box>
          </Stack>
        </PageSection>

        <PageSection eyebrow="Data" title="Stat Table">
          <Box sx={{ ...surfaces.card, p: { xs: 2, md: 3 }, maxWidth: 430 }}>
            <Typography sx={{ ...type.eyebrow, mb: 1 }}>Focus Stats</Typography>
            <Typography sx={{ ...type.italicBody, mb: 2 }}>
              Numbers stay mono, aligned, and tabular. Labels stay compact.
            </Typography>
            <StatTable rows={statRows} />
          </Box>
        </PageSection>

        <Divider sx={{ my: 4 }} />
        <Typography sx={type.bodyMuted}>
          Rule: if a Compass component needs a visual value that is not shown here, add it to
          `cairn-theme.css` first.
        </Typography>
      </Box>
    </Box>
  );
}
