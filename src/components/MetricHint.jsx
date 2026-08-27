import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { fonts } from '../styles/tokens';

/**
 * Hover explanation for a score or label. Wraps in a span so it can sit
 * inside buttons without stealing the click.
 */
export default function MetricHint({ title, children, underline = false }) {
  if (!title) return children;
  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={180}
      title={title}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 280,
            px: 1.4,
            py: 1,
            fontFamily: fonts.sans,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.45,
          },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          cursor: 'help',
          borderBottom: underline ? '1px dotted currentColor' : 'none',
          display: 'inline',
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}
