// One legal document, set the way a legal page on any website is set: title,
// who it is from and when it took effect, then numbered sections. Nothing
// here is decorative — the numbers are referred to by the Terms themselves
// ("Sections 6, 7, 9 … survive termination"), so they have to be real.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { LEGAL_COMPANY } from '../data/legalVersions';
import { formatEffective } from '../data/legalDocs';
import { colors, fonts } from '../styles/tokens';

const bodySx = {
  fontFamily: fonts.sans,
  fontSize: 15,
  lineHeight: 1.65,
  color: colors.inkSoft,
  mb: 1.5,
};

function Lead({ lead, text }) {
  return (
    <>
      <Box component="strong" sx={{ color: colors.ink, fontWeight: 700 }}>{lead}</Box>
      {' '}{text}
    </>
  );
}

function Block({ block }) {
  if (typeof block === 'string') return <Typography sx={bodySx}>{block}</Typography>;
  if (block.sub) {
    return (
      <Typography component="h4" sx={{
        fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, color: colors.ink, mt: 2, mb: 0.75,
      }}>
        {block.sub}
      </Typography>
    );
  }
  if (block.lead) return <Typography sx={bodySx}><Lead {...block} /></Typography>;
  if (block.caps) {
    return (
      <Typography sx={{ ...bodySx, fontSize: 13, lineHeight: 1.6, letterSpacing: '0.01em' }}>
        {block.caps}
      </Typography>
    );
  }
  if (block.list) {
    return (
      <Box component="ul" sx={{ ...bodySx, pl: 3, '& li': { mb: 0.75 }, '& li::marker': { color: colors.orangeDeep } }}>
        {block.list.map((item) => (
          <li key={typeof item === 'string' ? item : item.lead}>
            {typeof item === 'string' ? item : <Lead {...item} />}
          </li>
        ))}
      </Box>
    );
  }
  return null;
}

export default function LegalDocument({ doc }) {
  if (!doc) return null;

  if (doc.kind === 'help') {
    return (
      <Box component="article">
        <Typography component="h1" sx={{
          fontFamily: fonts.serif, fontSize: { xs: 28, md: 34 }, fontWeight: 500,
          letterSpacing: '-0.02em', lineHeight: 1.12, color: colors.ink, mb: 2.5,
        }}>
          {doc.title}
        </Typography>
        {doc.body.map((para) => <Typography key={para} sx={bodySx}>{para}</Typography>)}
      </Box>
    );
  }

  return (
    <Box component="article">
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: colors.orangeDeep, mb: 1.25,
      }}>
        The Compass
      </Typography>
      <Typography component="h1" sx={{
        fontFamily: fonts.serif, fontSize: { xs: 28, md: 36 }, fontWeight: 500,
        letterSpacing: '-0.02em', lineHeight: 1.1, color: colors.ink, mb: 1.25,
      }}>
        {doc.title}
      </Typography>
      <Typography sx={{
        fontFamily: fonts.sans, fontSize: 13.5, color: colors.inkSoft, mb: 3,
        pb: 2.5, borderBottom: `1px solid ${colors.sand200}`,
      }}>
        {LEGAL_COMPANY} · Effective {formatEffective(doc.effective)}
      </Typography>

      {doc.intro.map((para) => <Typography key={para} sx={bodySx}>{para}</Typography>)}

      {doc.sections.map((section, i) => (
        <Box key={section.heading} component="section" sx={{ mt: 3.5 }}>
          <Typography component="h2" sx={{
            fontFamily: fonts.serif, fontSize: 20, fontWeight: 500, color: colors.ink, mb: 1.25,
            display: 'flex', gap: 1.25,
          }}>
            <Box component="span" sx={{ color: colors.orangeDeep, minWidth: 22 }}>{i + 1}.</Box>
            <span>{section.heading}</span>
          </Typography>
          {section.blocks.map((block, j) => <Block key={j} block={block} />)}
        </Box>
      ))}
    </Box>
  );
}
