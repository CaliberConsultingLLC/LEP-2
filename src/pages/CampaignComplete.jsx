import React, { useMemo } from 'react';
import { Container, Box, Typography, Stack, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';

function CampaignComplete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaignData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`campaign_${id}`) || '{}');
    } catch {
      return {};
    }
  }, [id]);
  const isSelfCampaign = campaignData?.campaignType === 'self';
  const traitMetrics = useMemo(() => {
    let ratings = {};
    try {
      ratings = JSON.parse(localStorage.getItem(`latestSurveyRatings_${id}`) || '{}');
    } catch {
      ratings = {};
    }

    const traits = Array.isArray(campaignData?.campaign) ? campaignData.campaign.slice(0, 3) : [];
    let cursor = 0;
    return traits.map((trait) => {
      const statements = Array.isArray(trait?.statements) ? trait.statements : [];
      const rows = statements
        .map((_, idx) => ratings[String(cursor + idx)])
        .filter((row) => row != null && row.effort != null && row.efficacy != null);

      const effortAvg = rows.length
        ? rows.reduce((sum, row) => sum + Number(row.effort || 0), 0) / rows.length
        : 0;
      const efficacyAvg = rows.length
        ? rows.reduce((sum, row) => sum + Number(row.efficacy || 0), 0) / rows.length
        : 0;
      const overall = (effortAvg + efficacyAvg) / 2;
      cursor += statements.length;
      return {
        trait: trait?.trait || `Trait ${cursor}`,
        effort: effortAvg,
        efficacy: efficacyAvg,
        score: overall,
      };
    });
  }, [campaignData, id]);

  const polar = (cx, cy, radius, angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + (radius * Math.cos(angleRad)),
      y: cy + (radius * Math.sin(angleRad)),
    };
  };

  const describeArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polar(cx, cy, radius, startAngle);
    const end = polar(cx, cy, radius, endAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };

  if (isSelfCampaign) {
    localStorage.setItem(`selfCampaignCompleted_${id}`, 'true');
    localStorage.setItem('selfCampaignCompleted', 'true');
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        // full bleed bg
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
        },
        // dark overlay
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
        },
      }}
    >
      <ProcessTopRail />
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: { xs: 2, md: 3.5 } }}>
        <Box
          sx={{
            p: 6,
            border: '1px solid black',
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: 'white',
            opacity: 0.925,
            width: '100%',
          }}
        >
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 'bold', mb: 3 }}>
            {isSelfCampaign ? 'Benchmark Complete' : 'Thank You for Your Feedback'}
          </Typography>
          <Stack spacing={2} alignItems="stretch">
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.125rem', mb: 2 }}>
              {isSelfCampaign
                ? 'Your personal benchmark is now saved separately from team responses. Next, return to the transition page to unlock and share your team campaign link.'
                : 'Your feedback is a catalyst for growth. Once all results are in, your leader will get a report that helps them understand their path forward. They will be required to log actions associated with this feedback, all of which will be visible to you prior to taking the next campaign in 6 months. Transparency is key here.'}
            </Typography>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', mb: 2, color: 'text.secondary' }}>
              {isSelfCampaign
                ? 'Compass will use this benchmark to calculate Perception Gaps as leader-vs-team comparisons across each statement and trait.'
                : 'This process ensures anonymity—no data is stored or linked to you. Together, we’re building a culture of trust and continuous improvement.'}
            </Typography>
            {traitMetrics.length > 0 && (
              <Box
                sx={{
                  border: '1px solid rgba(69,112,137,0.24)',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: 'rgba(245,248,252,0.92)',
                }}
              >
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.2rem', fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  Final Results Preview
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.1 }}>
                  <svg width="280" height="220" viewBox="0 0 280 220" role="img" aria-label="Final three-trait recap rings">
                    {traitMetrics.map((metric, idx) => {
                      const radius = 90 - (idx * 22);
                      const cx = 140;
                      const cy = 140;
                      const efficacyPct = Math.max(0, Math.min(1, Number(metric.efficacy || 0) / 10));
                      const effortPct = Math.max(0, Math.min(1, Number(metric.effort || 0) / 10));
                      return (
                        <g key={`ring-${metric.trait}`}>
                          <path d={describeArc(cx, cy, radius, 180, 0)} fill="none" stroke="rgba(99,147,170,0.2)" strokeWidth="14" />
                          <path d={describeArc(cx, cy, radius, 180, 180 - (efficacyPct * 180))} fill="none" stroke="#6393AA" strokeWidth="14" />
                          <path d={describeArc(cx, cy, radius, 180, 360)} fill="none" stroke="rgba(224,122,63,0.2)" strokeWidth="14" />
                          <path d={describeArc(cx, cy, radius, 180, 180 + (effortPct * 180))} fill="none" stroke="#E07A3F" strokeWidth="14" />
                        </g>
                      );
                    })}
                    <circle cx="140" cy="140" r="34" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.1)" />
                    <text x="140" y="137" textAnchor="middle" style={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '14px', fontWeight: 700, fill: '#1a202c' }}>
                      Recap
                    </text>
                    <text x="140" y="153" textAnchor="middle" style={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '12px', fontWeight: 700, fill: '#1a202c' }}>
                      3 Traits
                    </text>
                  </svg>
                </Box>
                <Stack spacing={0.45}>
                  {traitMetrics.map((metric) => (
                    <Typography key={`legend-${metric.trait}`} sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.92rem', color: 'text.secondary', textAlign: 'left' }}>
                      {metric.trait}: Score {metric.score.toFixed(1)} | Efficacy {metric.efficacy.toFixed(1)} | Effort {metric.effort.toFixed(1)}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(isSelfCampaign ? '/campaign-verify' : '/')}
              sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', px: 4, py: 1, bgcolor: '#457089', '&:hover': { bgcolor: '#375d78' } }}
            >
              {isSelfCampaign ? 'Return to Campaign Flow' : 'Return to Home'}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default CampaignComplete;