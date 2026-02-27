import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Paper,
} from '@mui/material';
import fakeData from '../../data/fakeData.js';
import { Launch, CheckCircle } from '@mui/icons-material';

function GrowthCampaignTab() {
  const [copiedKey, setCopiedKey] = useState('');
  const now = new Date();
  const selfCampaignCompleted = String(localStorage.getItem('selfCampaignCompleted') || '').toLowerCase() === 'true';
  const needsSelfAssessment = (campaignId) => String(campaignId) === '123' || String(campaignId) === '125';
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const fmt = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const campaignRows = [
    { id: '123', title: 'Trailhead Campaign', openDate: addDays(now, -6), invited: 14 },
    { id: '124', title: 'Basecamp Campaign', openDate: addDays(now, -2), invited: 14 },
    { id: '125', title: 'Summit Campaign', openDate: addDays(now, 3), invited: 14 },
  ].map((row) => {
    const responses = fakeData.responses.filter((r) => String(r.campaignId) === row.id).length;
    const pct = Math.min(100, Math.round((responses / row.invited) * 100));
    return {
      ...row,
      responses,
      pct,
      closeDate: addDays(row.openDate, 10),
    };
  });
  const currentCampaign = campaignRows
    .filter((row) => row.openDate <= now)
    .sort((a, b) => b.openDate.getTime() - a.openDate.getTime())[0];
  const currentCampaignId = currentCampaign?.id || campaignRows[0]?.id;
  const getCampaignStatus = (row) => {
    if (row.id === '123') return 'Complete';
    if (row.pct >= 100) return 'Complete';
    if (now >= row.openDate && now <= row.closeDate) return 'Open';
    return 'Closed';
  };

  const getCampaignLink = (campaignId) => {
    try {
      const records = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
      if (String(campaignId) === '123' && records?.teamCampaignLink) return records.teamCampaignLink;
    } catch {
      // fallback to synthetic link below
    }
    if (typeof window === 'undefined') return `/campaign/${campaignId}`;
    return `${window.location.origin}/campaign/${campaignId}`;
  };

  const getCampaignPassword = (campaignId) => {
    try {
      const records = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
      if (String(campaignId) === '123' && records?.teamCampaignPassword) return records.teamCampaignPassword;
      const raw = localStorage.getItem('dashboardCredentials');
      if (!raw) return `campaign-${campaignId}-password`;
      const parsed = JSON.parse(raw);
      return parsed?.password || `campaign-${campaignId}-password`;
    } catch {
      return `campaign-${campaignId}-password`;
    }
  };

  const copyText = async (value, key) => {
    const text = String(value || '');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1300);
    } catch {
      setCopiedKey('');
    }
  };

  const openSelfAssessment = () => {
    const fallbackUrl = '/campaign/123?mode=self';
    try {
      const records = JSON.parse(localStorage.getItem('campaignRecords') || '{}');
      const selfUrl = records?.selfCampaignLink || (records?.selfCampaignId ? `${window.location.origin}/campaign/${records.selfCampaignId}?mode=self` : null);
      window.location.href = selfUrl || fallbackUrl;
    } catch {
      window.location.href = fallbackUrl;
    }
  };

  return (
    <Stack spacing={2.2} sx={{ width: '100%' }}>
      <Card
        sx={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,248,220,0.8))',
          border: '1px solid',
          borderColor: 'secondary.main',
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <CardContent>
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'text.primary',
              mb: 1.2,
              textAlign: 'center',
            }}
          >
            Growth Campaigns
          </Typography>
          <Box sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            {campaignRows.map((row) => (
              <Paper
                key={row.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: row.id === currentCampaignId ? 'rgba(224,122,63,0.45)' : 'rgba(69,112,137,0.28)',
                  background: row.id === currentCampaignId
                    ? 'linear-gradient(180deg, rgba(255,241,226,0.98), rgba(255,232,206,0.9))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,249,255,0.9))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                  <Stack direction="row" spacing={1.5} alignItems="stretch" sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        minWidth: 92,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'rgba(69,112,137,0.3)',
                        bgcolor: 'rgba(255,255,255,0.55)',
                        px: 1.1,
                        py: 0.9,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: 'Gemunu Libre, sans-serif',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: getCampaignStatus(row) === 'Open'
                            ? '#2F855A'
                            : getCampaignStatus(row) === 'Complete'
                              ? '#2B6CB0'
                              : '#9B2C2C',
                          lineHeight: 1.1,
                        }}
                      >
                        {getCampaignStatus(row)}
                      </Typography>
                    </Box>
                    <Box>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1.04rem', fontWeight: 700, color: 'text.primary' }}>
                      {row.title}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                      Opened: {fmt(row.openDate)} | Closes: {fmt(row.closeDate)}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '0.9rem', color: 'text.secondary' }}>
                      Response Rate: {row.pct}% ({row.responses}/{row.invited})
                    </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {needsSelfAssessment(row.id) && (
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={openSelfAssessment}
                          disabled={selfCampaignCompleted}
                          sx={{
                            fontFamily: 'Gemunu Libre, sans-serif',
                            textTransform: 'none',
                            whiteSpace: 'nowrap',
                            bgcolor: '#457089',
                            color: 'white',
                            minWidth: 124,
                            '&:hover': {
                              bgcolor: '#375d78',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'rgba(69,112,137,0.35)',
                              color: 'rgba(255,255,255,0.9)',
                            },
                          }}
                        >
                          Self Assessment
                        </Button>
                        {selfCampaignCompleted && (
                          <CheckCircle sx={{ color: '#2F855A', fontSize: '1.2rem' }} />
                        )}
                      </Stack>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!selfCampaignCompleted}
                      onClick={() => copyText(getCampaignLink(row.id), `${row.id}-link`)}
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        textTransform: 'none',
                        bgcolor: '#457089',
                        color: 'white',
                        minWidth: 122,
                        '&:hover': {
                          bgcolor: '#375d78',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(69,112,137,0.35)',
                          color: 'rgba(255,255,255,0.9)',
                        },
                      }}
                    >
                      {copiedKey === `${row.id}-link` ? 'Copied Link' : 'Campaign Link'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!selfCampaignCompleted}
                      onClick={() => copyText(getCampaignPassword(row.id), `${row.id}-password`)}
                      sx={{
                        fontFamily: 'Gemunu Libre, sans-serif',
                        textTransform: 'none',
                        bgcolor: '#457089',
                        color: 'white',
                        minWidth: 145,
                        '&:hover': {
                          bgcolor: '#375d78',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(69,112,137,0.35)',
                          color: 'rgba(255,255,255,0.9)',
                        },
                      }}
                    >
                      {copiedKey === `${row.id}-password` ? 'Copied Password' : 'Password'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default GrowthCampaignTab;
