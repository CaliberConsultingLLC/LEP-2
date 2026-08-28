import React, { useMemo, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import { useCairnTheme } from '../config/runtimeFlags';
import { isCampaignReady, normalizeCampaignItems } from '../utils/campaignState';
import { campaignIsLocked } from '../data/chapterMap';
import { ensureCampaignBundle } from '../utils/campaignBundle';
import { buttons, colors, fonts, radii, surfaces } from '../styles/tokens';
import CampaignStageHeader, { stageType } from '../components/CampaignStageCopy';
import traitSystem from '../data/traitSystem';

const parseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function traitCardMeta(item, index) {
  const selectedTraits = parseJson(localStorage.getItem('selectedTraits'), []);
  const selectedId = String(selectedTraits[index] || item?.traitId || '');
  const parts = selectedId.split('-').filter(Boolean);
  const coreTraits = traitSystem?.CORE_TRAITS || [];
  const core = coreTraits.find((t) =>
    t.id === parts[0]
    || t.id === item?.traitId
    || t.name === item?.traitName
    || t.name === item?.trait
  ) || null;
  const subId = parts.slice(1).join('-');
  const sub = core?.subTraits?.find((s) =>
    s.id === subId
    || s.name === item?.title
    || s.name === item?.subTrait
  ) || null;
  return {
    coreName: core?.name || item?.traitName || item?.trait || `Trait ${index + 1}`,
    subName: sub?.name || item?.title || item?.subTrait || '',
    statements: Array.isArray(item?.statements) ? item.statements.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 5) : [],
  };
}

function CampaignVerify() {
  const navigate = useNavigate();
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(() => campaignIsLocked());

  const campaign = useMemo(
    () => normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), [])),
    []
  );
  const cards = useMemo(
    () => campaign.map((item, index) => traitCardMeta(item, index)),
    [campaign]
  );
  const ready = isCampaignReady(campaign);

  const lockIn = async () => {
    if (locking) return;
    setLocking(true);
    setError(null);
    try {
      await ensureCampaignBundle({ lock: true });
      setLocked(true);
      navigate('/self-assessment');
    } catch (err) {
      console.error('Failed to lock campaign:', err);
      setError(err?.message || 'Could not lock this campaign. Please try again.');
      setLocking(false);
    }
  };

  const ctaLabel = locking ? 'Locking in…' : 'Lock in My Growth Campaign';

  if (useCairnTheme) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)', overflowX: 'hidden' }}>
        <ProcessTopRail
          chapterId="campaign"
          activeStepId="verify"
          chip={{ variant: 'sequence', label: 'Traits', current: cards.length, total: 3 }}
        />
        <CompassLayout afterTopbar>
          <Box sx={{ width: '100%', maxWidth: 1120, mx: 'auto' }}>
            <CampaignStageHeader
              eyebrow="Growth Campaign"
              title="Review and Submit"
              subtitle="Three traits. Fifteen statements. If this is the work you will put in front of your team, lock it in."
            />

            {!ready && (
              <Alert severity="error" sx={{ fontFamily: fonts.sans, mb: 2 }}>
                No campaign data found. Please return to the campaign builder.
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ fontFamily: fonts.sans, mb: 2 }}>{error}</Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 2.5, md: 3 },
                alignItems: 'stretch',
              }}
            >
              {cards.map((card, index) => {
                const parentName = card.subName && card.coreName && card.subName !== card.coreName
                  ? card.coreName
                  : '';
                return (
                <Box
                  key={`${card.coreName}-${card.subName}-${index}`}
                  sx={{
                    ...surfaces.card,
                    p: { xs: 3, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    textAlign: 'left',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fonts.sans,
                      fontWeight: 800,
                      fontSize: 15,
                      lineHeight: 1.2,
                      color: colors.ink,
                    }}
                  >
                    {card.subName || card.coreName}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fonts.serif,
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 1.35,
                      color: colors.inkSoft,
                      mt: 0.45,
                      minHeight: '1.35em',
                    }}
                  >
                    {parentName || '\u00A0'}
                  </Typography>
                  <Box
                    aria-hidden
                    sx={{
                      flexShrink: 0,
                      width: '100%',
                      height: '2px',
                      bgcolor: colors.orange,
                      mt: 1.35,
                      mb: 1.5,
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {card.statements.map((statement, sIdx) => (
                      <Box
                        key={`${index}-${sIdx}`}
                        sx={{
                          display: 'flex',
                          gap: 1.15,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: radii.circle,
                            flexShrink: 0,
                            mt: '1px',
                            bgcolor: colors.sand100,
                            border: `1px solid ${colors.sand200}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: fonts.mono,
                            fontSize: 10,
                            fontWeight: 700,
                            color: colors.orangeDeep,
                          }}
                        >
                          {sIdx + 1}
                        </Box>
                        <Typography sx={{ ...stageType.cardBody, flex: 1, color: colors.ink }}>
                          {statement}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.25, mb: 2 }}>
              <Box
                component="button"
                type="button"
                disabled={!ready || locking}
                onClick={locked ? () => navigate('/self-assessment') : lockIn}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  cursor: !ready || locking ? 'not-allowed' : 'pointer',
                  opacity: !ready || locking ? 0.65 : 1,
                  ...buttons.primary,
                  borderRadius: radii.pill,
                }}
              >
                {ctaLabel}
              </Box>
            </Box>
          </Box>
        </CompassLayout>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--sand-50, #FBF7F0)' }}>
      <ProcessTopRail chapterId="campaign" activeStepId="verify" />
      <CompassLayout afterTopbar>
        <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', mb: 2 }}>
            Review your growth campaign
          </Typography>
          {!ready && <Alert severity="error">No campaign data found.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {cards.map((card, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>{card.subName || card.coreName}</Typography>
              {card.statements.map((statement, sIdx) => (
                <Typography key={sIdx} sx={{ mt: 0.75 }}>{sIdx + 1}. {statement}</Typography>
              ))}
            </Box>
          ))}
          <Box
            component="button"
            type="button"
            disabled={!ready || locking}
            onClick={locked ? () => navigate('/self-assessment') : lockIn}
            sx={{ all: 'unset', cursor: 'pointer', ...buttons.primary, borderRadius: radii.pill }}
          >
            {ctaLabel}
          </Box>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default CampaignVerify;
