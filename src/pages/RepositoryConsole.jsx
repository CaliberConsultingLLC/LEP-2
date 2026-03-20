import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProcessTopRail from '../components/ProcessTopRail';

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function showValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function RepositoryConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [rows, setRows] = useState({ users: [], campaigns: [], meta: {} });
  const loadData = async (activeSession) => {
    if (!activeSession?.active || !activeSession?.token) {
      navigate('/dev-repository-login', { replace: true });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/get-repository-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Repository-Session': activeSession.token,
        },
        body: JSON.stringify({ scope: 'all' }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'repository-fetch-failed');
      }

      setRows({
        users: Array.isArray(payload?.users) ? payload.users : [],
        campaigns: Array.isArray(payload?.campaigns) ? payload.campaigns : [],
        meta: payload?.meta || {},
      });
    } catch (fetchErr) {
      if (String(fetchErr?.message || '').toLowerCase().includes('unauthorized')) {
        localStorage.removeItem('repositoryAdminSession');
        navigate('/dev-repository-login', { replace: true });
        return;
      }
      setError(fetchErr?.message || 'Could not load repository data.');
      setRows({ users: [], campaigns: [], meta: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('repositoryAdminSession') || 'null');
      setSession(stored);
      loadData(stored);
    } catch {
      navigate('/dev-repository-login', { replace: true });
    }
  }, [navigate]);

  const users = rows.users || [];
  const campaigns = rows.campaigns || [];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage:
            'linear-gradient(120deg, rgba(14,26,40,0.86), rgba(22,38,56,0.84)), url(/LEP2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        },
        '&:after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'radial-gradient(760px 360px at 82% 16%, rgba(61,90,120,0.2), transparent 70%), radial-gradient(620px 320px at 12% 40%, rgba(63,92,121,0.16), transparent 75%)',
        },
      }}
    >
      <ProcessTopRail titleOverride="Repository Console" />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Stack spacing={2.2}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.2, md: 2.8 },
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
              boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: { xs: '1.45rem', md: '1.8rem' },
                    fontWeight: 800,
                    color: '#13263A',
                  }}
                >
                  Repository Console
                </Typography>
                <Typography sx={{ mt: 0.6, color: 'rgba(19,38,58,0.68)' }}>
                  Readonly repository for user progress, campaign activity, and Monday readiness checks.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`Users: ${users.length}`} />
                <Chip label={`Campaigns: ${campaigns.length}`} />
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => loadData(session)}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => {
                    localStorage.removeItem('repositoryAdminSession');
                    navigate('/dev-repository-login', { replace: true });
                  }}
                >
                  Log Out
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}
          {!error && session?.active && (
            <Alert severity="info">
              Signed in as `{session?.username || 'repository-admin'}`. This view is readonly and does not expose passwords.
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,253,0.9))',
              boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
              overflow: 'hidden',
            }}
          >
            <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ px: 1.5, pt: 1.5 }}>
              <Tab label="User Repository" />
              <Tab label="Campaign Repository" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </Stack>
              ) : tab === 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>UID</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Current Stage</TableCell>
                        <TableCell>Current Step</TableCell>
                        <TableCell>Summary</TableCell>
                        <TableCell>Campaign Bundle</TableCell>
                        <TableCell>Self Complete</TableCell>
                        <TableCell>Welcome Email</TableCell>
                        <TableCell>Last Reset</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Industry</TableCell>
                        <TableCell>Team Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((row) => (
                        <TableRow key={`${row.uid}-${row.email}`}>
                          <TableCell>{showValue(row.name)}</TableCell>
                          <TableCell>{showValue(row.email)}</TableCell>
                          <TableCell sx={{ maxWidth: 180, wordBreak: 'break-word' }}>{showValue(row.uid)}</TableCell>
                          <TableCell>{fmtDate(row.createdAt)}</TableCell>
                          <TableCell>{showValue(row.currentStage)}</TableCell>
                          <TableCell>{showValue(row.currentStep)}</TableCell>
                          <TableCell>{row.summaryReady ? `Ready${row.summarySavedAt ? ` • ${fmtDate(row.summarySavedAt)}` : ''}` : '—'}</TableCell>
                          <TableCell>{row.campaignBundleReady ? 'Ready' : '—'}</TableCell>
                          <TableCell>{row.selfCompleted ? 'Yes' : '—'}</TableCell>
                          <TableCell>{showValue(row.welcomeEmailStatus)}</TableCell>
                          <TableCell>{row.lastPasswordResetAt ? `${fmtDate(row.lastPasswordResetAt)}${row.lastPasswordResetStatus ? ` • ${row.lastPasswordResetStatus}` : ''}` : '—'}</TableCell>
                          <TableCell>{showValue(row.role)}</TableCell>
                          <TableCell>{showValue(row.industry)}</TableCell>
                          <TableCell>{showValue(row.teamSize)}</TableCell>
                        </TableRow>
                      ))}
                      {!users.length && (
                        <TableRow>
                          <TableCell colSpan={14} align="center">No user records found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>UID</TableCell>
                        <TableCell>Campaign ID</TableCell>
                        <TableCell>Bundle ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Responses</TableCell>
                        <TableCell>Traits</TableCell>
                        <TableCell>Statements</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaigns.map((row) => (
                        <TableRow key={row.campaignId}>
                          <TableCell>{showValue(row.name)}</TableCell>
                          <TableCell>{showValue(row.email)}</TableCell>
                          <TableCell sx={{ maxWidth: 180, wordBreak: 'break-word' }}>{showValue(row.uid)}</TableCell>
                          <TableCell sx={{ maxWidth: 180, wordBreak: 'break-word' }}>{showValue(row.campaignId)}</TableCell>
                          <TableCell sx={{ maxWidth: 160, wordBreak: 'break-word' }}>{showValue(row.bundleId)}</TableCell>
                          <TableCell>{showValue(row.campaignType)}</TableCell>
                          <TableCell>{showValue(row.campaignStatus)}</TableCell>
                          <TableCell>{showValue(row.responsesCount)}</TableCell>
                          <TableCell>{showValue(row.traitsCount)}</TableCell>
                          <TableCell>{showValue(row.statementsCount)}</TableCell>
                          <TableCell>{fmtDate(row.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                      {!campaigns.length && (
                        <TableRow>
                          <TableCell colSpan={11} align="center">No campaign records found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

export default RepositoryConsole;
