import React, { useEffect, useMemo } from 'react';
import { Container, Box, Typography, Stack, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import ProcessTopRail from '../components/ProcessTopRail';
import CompassLayout from '../components/CompassLayout';
import CompassJourneySidebar from '../components/CompassJourneySidebar';
import { useCairnTheme } from '../config/runtimeFlags';
import { auth, db } from '../firebase';

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

  useEffect(() => {
    if (!isSelfCampaign) return;

    const completedAt = new Date().toISOString();
    localStorage.setItem(`selfCampaignCompleted_${id}`, 'true');
    localStorage.setItem('selfCampaignCompleted', 'true');

    try {
      const campaignRecords = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
      localStorage.setItem(
        'campaignRecords',
        JSON.stringify({
          ...campaignRecords,
          selfCompleted: true,
          selfCompletedAt: completedAt,
        })
      );
    } catch {
      // Keep local completion flags even if campaignRecords parsing fails.
    }

    const uid = String(auth?.currentUser?.uid || '').trim();
    if (!uid) return;

    setDoc(
      doc(db, 'responses', uid),
      {
        ownerUid: uid,
        campaignBundle: {
          campaignRecords: {
            selfCompleted: true,
            selfCompletedAt: completedAt,
          },
          savedAt: completedAt,
        },
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Unable to persist self campaign completion:', err);
    });
  }, [id, isSelfCampaign]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        ...(useCairnTheme
          ? { bgcolor: 'var(--sand-50, #FBF7F0)' }
          : {
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
              '&:after': {
                content: '""',
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'radial-gradient(1200px 800px at 20% 20%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))',
              },
            }),
      }}
    >
      <ProcessTopRail />
      <CompassLayout sidebar={<CompassJourneySidebar />} progress={71}>
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
      </CompassLayout>
    </Box>
  );
}

export default CampaignComplete;