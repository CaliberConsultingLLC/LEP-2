import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, hairlines, radii, type } from '../styles/tokens';

const defaultColumns = [
  { key: 'impact', label: 'Impact' },
  { key: 'effort', label: 'Effort' },
];

function formatValue(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return Math.round(value);
  return value;
}

export default function StatTable({
  columns = defaultColumns,
  rows = [],
  compact = false,
  sx,
}) {
  const template = `minmax(56px, 0.82fr) repeat(${columns.length}, minmax(58px, 1fr))`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: template,
        overflow: 'hidden',
        border: hairlines.default,
        borderRadius: radii.md,
        bgcolor: colors.surface1,
        ...sx,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          minHeight: compact ? 30 : 34,
          borderBottom: hairlines.default,
          bgcolor: colors.sand50,
        }}
      />
      {columns.map((column) => (
        <Box
          key={column.key}
          sx={{
            minHeight: compact ? 30 : 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: compact ? 1 : 1.2,
            borderBottom: hairlines.default,
            bgcolor: column.highlight
              ? 'color-mix(in srgb, var(--amber-soft) 30%, var(--sand-50))'
              : colors.sand50,
          }}
        >
          <Typography sx={{ ...type.monoLabel, fontSize: compact ? 8.5 : 9 }}>
            {column.label}
          </Typography>
        </Box>
      ))}

      {rows.map((row, rowIndex) => (
        <React.Fragment key={row.key || row.label}>
          <Box
            sx={{
              minHeight: compact ? 34 : 40,
              display: 'flex',
              alignItems: 'center',
              px: compact ? 1 : 1.2,
              borderTop: rowIndex === 0 ? 0 : hairlines.soft,
            }}
          >
            <Typography
              sx={{
                ...type.monoLabel,
                fontSize: compact ? 8.5 : 9.5,
                color: row.color || colors.textSecondary,
              }}
            >
              {row.label}
            </Typography>
          </Box>
          {columns.map((column) => (
            <Box
              key={`${row.key || row.label}-${column.key}`}
              sx={{
                minHeight: compact ? 34 : 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                px: compact ? 1 : 1.2,
                borderTop: rowIndex === 0 ? 0 : hairlines.soft,
                bgcolor: column.highlight ? 'color-mix(in srgb, var(--amber-soft) 14%, transparent)' : undefined,
              }}
            >
              <Typography
                sx={{
                  ...type.statNumber,
                  fontSize: compact ? 14 : 17,
                  color: row.valueColor || colors.textPrimary,
                }}
              >
                {formatValue(row[column.key])}
              </Typography>
            </Box>
          ))}
        </React.Fragment>
      ))}
    </Box>
  );
}
