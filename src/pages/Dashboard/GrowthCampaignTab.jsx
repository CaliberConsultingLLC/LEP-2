import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Campaign, Group, Link as LinkIcon, CheckCircle } from '@mui/icons-material';

function GrowthCampaignTab() {
  const navigate = useNavigate();

  return (
    <Stack spacing={4}>
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography
          sx={{
            fontFamily: 'Gemunu Libre, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
          }}
        >
          Growth Campaign
        </Typography>
        <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.secondary', maxWidth: 820, mx: 'auto' }}>
          Manage the campaign you share with your team, check participation, and keep the feedback loop active.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              boxShadow: 4,
              height: '100%',
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Campaign sx={{ color: 'primary.main', fontSize: 32 }} />
                <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
                  Your Active Campaign
                </Typography>
              </Stack>
              <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', color: 'text.secondary', mb: 3 }}>
                Keep your campaign updated, verify the statements you want your team to assess, and share the link when you're ready.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/campaign-builder')}
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', px: 4, py: 1.2 }}
                >
                  Open Campaign Builder
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/campaign-verify')}
                  sx={{ fontFamily: 'Gemunu Libre, sans-serif', px: 4, py: 1.2 }}
                >
                  Share Campaign Link
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,248,220,0.8))',
              border: '1px solid',
              borderColor: 'secondary.main',
              borderRadius: 3,
              boxShadow: 4,
              height: '100%',
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircle sx={{ color: 'secondary.main', fontSize: 28 }} />
                  <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.3rem', fontWeight: 700 }}>
                    Quick Status
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Campaign Ready" sx={{ bgcolor: 'rgba(47,133,90,0.12)', color: '#2F855A', fontWeight: 700 }} />
                  <Chip label="Share Link Available" sx={{ bgcolor: 'rgba(99,147,170,0.12)', color: '#2B6CB0', fontWeight: 700 }} />
                </Stack>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Group sx={{ color: 'primary.main' }} />
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'text.secondary' }}>
                      Invite team members to complete the survey.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LinkIcon sx={{ color: 'primary.main' }} />
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.95rem', color: 'text.secondary' }}>
                      Copy the campaign link from the verify screen.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default GrowthCampaignTab;
