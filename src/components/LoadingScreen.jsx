import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

function LoadingScreen({ title = 'Loading…', subtitle, hint }) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: 'url(/LEP2.jpg)',
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
      }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 560,
            width: '100%',
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            bgcolor: 'rgba(255,255,255,0.9)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Stack direction="row" spacing={1.5}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.25}s`,
                  }}
                />
              ))}
            </Stack>
            <Typography
              sx={{
                fontFamily: 'Gemunu Libre, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '1rem',
                  color: 'text.secondary',
                }}
              >
                {subtitle}
              </Typography>
            )}
            {hint && (
              <Typography
                sx={{
                  fontFamily: 'Gemunu Libre, sans-serif',
                  fontSize: '0.95rem',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                }}
              >
                {hint}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
}

export default LoadingScreen;
