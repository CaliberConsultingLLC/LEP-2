import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import { LEGAL_DOCS } from '../data/legalDocs';
import { FAQ_PATH, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../data/supportLinks';
import { buttons, colors, fonts, radii, surfaces, type } from '../styles/tokens';

function Documents() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surface2 }}>
      <ProcessTopRail utilityOnly />
      <CompassLayout>
        <Box sx={{ ...surfaces.card, p: { xs: 2.4, md: 3.4 }, maxWidth: 720, mx: 'auto' }}>
          <Typography sx={{ ...type.eyebrow, mb: 1 }}>Documents</Typography>
          <Typography sx={{ ...type.lead, mb: 1.2 }}>What Compass is, how data is used, and how to get help.</Typography>
          <Typography sx={{ ...type.bodyMuted, mb: 2.4 }}>
            Compass is an AI-powered independent development plan (IDP). These pages are the
            reference copy for your account — not a substitute for a lawyer if your organization
            needs a signed contract.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1, mb: 3 }}>
            {LEGAL_DOCS.map((doc) => (
              <Box
                key={doc.id}
                component="a"
                href={`#${doc.id}`}
                sx={{
                  ...buttons.outlinedPrimary,
                  textDecoration: 'none',
                  fontSize: 12.5,
                  py: '8px',
                  px: '14px',
                }}
              >
                {doc.title}
              </Box>
            ))}
            <Box
              component={RouterLink}
              to={FAQ_PATH}
              sx={{ ...buttons.outlinedPrimary, textDecoration: 'none', fontSize: 12.5, py: '8px', px: '14px' }}
            >
              FAQ
            </Box>
          </Stack>

          <Stack spacing={3.2}>
            {LEGAL_DOCS.map((doc) => (
              <Box
                key={doc.id}
                id={doc.id}
                sx={{
                  scrollMarginTop: 88,
                  pb: 2.4,
                  borderBottom: `1px solid ${colors.sand200}`,
                  '&:last-of-type': { borderBottom: 'none', pb: 0 },
                }}
              >
                <Typography sx={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 500, color: colors.textPrimary, mb: 1.2 }}>
                  {doc.title}
                </Typography>
                {doc.body.map((para) => (
                  <Typography key={para} sx={{ ...type.body, mb: 1.2, color: colors.textSecondary }}>
                    {para}
                  </Typography>
                ))}
              </Box>
            ))}
          </Stack>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: radii.md,
              border: `1px solid ${colors.sand200}`,
              bgcolor: colors.sand50,
            }}
          >
            <Typography sx={{ ...type.monoLabel, mb: 0.8 }}>Support</Typography>
            <Typography sx={type.body}>
              <Box
                component="a"
                href={SUPPORT_MAILTO}
                sx={{ color: colors.orangeDeep, fontWeight: 700, textDecoration: 'none' }}
              >
                {SUPPORT_EMAIL}
              </Box>
            </Typography>
          </Box>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default Documents;
