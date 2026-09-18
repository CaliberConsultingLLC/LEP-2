import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import LegalDocument from '../components/LegalDocument';
import { LEGAL_DOCS, formatEffective, legalDocById, legalDocPath } from '../data/legalDocs';
import { DOCUMENTS_PATH, FAQ_PATH, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../data/supportLinks';
import { colors, fonts, radii, surfaces, type } from '../styles/tokens';

// /documents is the index; /documents/:docId is one document on its own page,
// which is what the consent card opens in a new tab so the sign-up behind it
// is not lost. Each agreement is its own page because that is where people
// expect to find one, and a link to "the Terms" should land on the Terms.

const linkSx = { color: colors.orangeDeep, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } };

function DocRow({ doc }) {
  return (
    <Box
      component={RouterLink}
      to={legalDocPath(doc.id)}
      sx={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2,
        py: 1.6, borderBottom: `1px solid ${colors.sand200}`, textDecoration: 'none',
        '&:hover .doc-title': { color: colors.orangeDeep },
      }}
    >
      <Typography className="doc-title" sx={{ fontFamily: fonts.serif, fontSize: 19, color: colors.ink, transition: 'color 120ms' }}>
        {doc.title}
      </Typography>
      {doc.effective && (
        <Typography sx={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkSoft, whiteSpace: 'nowrap' }}>
          Effective {formatEffective(doc.effective)}
        </Typography>
      )}
    </Box>
  );
}

function Index() {
  const legal = LEGAL_DOCS.filter((d) => d.kind === 'legal');
  const help = LEGAL_DOCS.filter((d) => d.kind === 'help');
  return (
    <>
      <Typography sx={{ ...type.eyebrow, mb: 1 }}>Documents</Typography>
      <Typography sx={{ ...type.lead, mb: 1.2 }}>The agreements behind The Compass, and how to get help.</Typography>
      <Typography sx={{ ...type.bodyMuted, mb: 3 }}>
        Creating an account means agreeing to the Terms of Service, Privacy Policy and Consent to
        Participate. The Refund & Cancellation Policy is part of the Terms.
      </Typography>

      <Typography sx={{ ...type.monoLabel, mb: 0.5 }}>Legal</Typography>
      <Box sx={{ mb: 3.5 }}>{legal.map((doc) => <DocRow key={doc.id} doc={doc} />)}</Box>

      <Typography sx={{ ...type.monoLabel, mb: 0.5 }}>Help</Typography>
      <Box sx={{ mb: 1 }}>
        {help.map((doc) => <DocRow key={doc.id} doc={doc} />)}
        <Box
          component={RouterLink}
          to={FAQ_PATH}
          sx={{ display: 'block', py: 1.6, borderBottom: `1px solid ${colors.sand200}`, textDecoration: 'none' }}
        >
          <Typography sx={{ fontFamily: fonts.serif, fontSize: 19, color: colors.ink }}>FAQ</Typography>
        </Box>
      </Box>
    </>
  );
}

function Documents() {
  const { docId } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();

  // The documents used to be one long page with anchors, and links to
  // /documents#privacy are out there in old emails and bookmarks. Send them
  // to the page that is now the Privacy Policy.
  const hashId = hash.replace('#', '');
  useEffect(() => {
    if (!docId && hashId && legalDocById(hashId)) navigate(legalDocPath(hashId), { replace: true });
  }, [docId, hashId, navigate]);

  useEffect(() => { window.scrollTo(0, 0); }, [docId]);

  const doc = docId ? legalDocById(docId) : null;
  if (docId && !doc) return <Navigate to={DOCUMENTS_PATH} replace />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surface2 }}>
      <ProcessTopRail utilityOnly />
      <CompassLayout>
        <Box sx={{ ...surfaces.card, p: { xs: 2.4, md: 4.5 }, maxWidth: 780, mx: 'auto' }}>
          {doc ? (
            <>
              <Box component={RouterLink} to={DOCUMENTS_PATH} sx={{ ...linkSx, fontFamily: fonts.sans, fontSize: 13, display: 'inline-block', mb: 3 }}>
                ← All documents
              </Box>
              <LegalDocument doc={doc} />
            </>
          ) : (
            <Index />
          )}

          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: radii.md,
              border: `1px solid ${colors.sand200}`,
              bgcolor: colors.sand50,
            }}
          >
            <Typography sx={{ ...type.monoLabel, mb: 0.8 }}>Questions</Typography>
            <Typography sx={type.body}>
              <Box component="a" href={SUPPORT_MAILTO} sx={linkSx}>{SUPPORT_EMAIL}</Box>
            </Typography>
          </Box>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default Documents;
