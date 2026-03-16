import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { FieldExpression, BracketItem } from '../mapping-table.types';

const CHIP_STYLES: Record<
  string,
  { bg: string; border: string; color: string; deletColor: string }
> = {
  chip: {
    bg: '#f0f9ff',
    border: '#0176D3',
    color: '#0176D3',
    deletColor: '#0176D3',
  },
  manual: {
    bg: '#f0fdf4',
    border: '#22c55e',
    color: '#16a34a',
    deletColor: '#16a34a',
  },
  function: {
    bg: '#f3e8ff',
    border: '#9333ea',
    color: '#7e22ce',
    deletColor: '#7e22ce',
  },
  number: {
    bg: '#fff7ed',
    border: '#f97316',
    color: '#ea580c',
    deletColor: '#ea580c',
  },
  bracket: {
    bg: '#fdf4e9',
    border: '#c2803b',
    color: '#7c4a15',
    deletColor: '#7c4a15',
  },
  conditional: {
    bg: '#fdf2f8',
    border: '#f472b6',
    color: '#9d174d',
    deletColor: '#9d174d',
  },
  sumOf: {
    bg: '#f7fee7',
    border: '#3f6212',
    color: '#3f6212',
    deletColor: '#3f6212',
  },
  operator: {
    bg: '#f7fa3245',
    border: '#b9bb3dff',
    color: '#000',
    deletColor: '#616220ff',
  },
};

function buildChipSx(
  type: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const s = CHIP_STYLES[type] ?? CHIP_STYLES.operator;
  return {
    fontSize: type === 'operator' ? '14px' : '11px',
    height: '20px',
    maxWidth: type === 'operator' ? '60px' : '200px',
    backgroundColor: s.bg,
    borderColor: s.border,
    color: s.color,
    margin: '1px',
    borderRadius: '4px',
    ...(type === 'function' ||
    type === 'bracket' ||
    type === 'conditional' ||
    type === 'sumOf'
      ? { cursor: 'pointer' }
      : {}),
    ...(type === 'function'
      ? { '&:hover': { backgroundColor: '#e9d5ff' } }
      : {}),
    ...(type === 'bracket'
      ? { borderStyle: 'dashed', '&:hover': { backgroundColor: '#fae5c8' } }
      : {}),
    ...(type === 'conditional'
      ? { '&:hover': { backgroundColor: '#cffafe' } }
      : {}),
    ...(type === 'sumOf' ? { '&:hover': { backgroundColor: '#ecfccb' } } : {}),
    '& .MuiChip-deleteIcon': {
      fontSize: '14px',
      color: s.deletColor,
      '&:hover': { color: '#ef4444' },
    },
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px',
      ...(type === 'operator'
        ? {
            paddingBottom: extra?.value === '*' ? '0px' : '2px',
            paddingTop: extra?.value === '*' ? '6px' : '0px',
          }
        : {}),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    ...extra,
  };
}

interface ExpressionChipProps {
  item: FieldExpression;
  idx: number;
  rid: string;
  getDisplayName: (value: string, rid: string) => string;
  buildBracketDisplayLabel: (items: BracketItem[], rid: string) => string;
  buildConditionalDisplayLabel: (
    conditionalData: FieldExpression['conditionalData'],
    rid: string
  ) => string;
  onDelete: (idx: number) => void;
  onFunctionClick?: (idx: number) => void;
  onBracketClick?: (idx: number) => void;
  onConditionalClick?: (idx: number) => void;
  onSumOfClick?: (idx: number) => void;
}

const ExpressionChip: React.FC<ExpressionChipProps> = ({
  item,
  idx,
  rid,
  getDisplayName,
  buildBracketDisplayLabel,
  buildConditionalDisplayLabel,
  onDelete,
  onFunctionClick,
  onBracketClick,
  onConditionalClick,
  onSumOfClick,
}) => {
  if (item.type === 'chip') {
    const label = getDisplayName(item.value, rid);
    return (
      <Tooltip title={label} arrow placement='top'>
        <Chip
          label={label}
          size='small'
          variant='outlined'
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('chip')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'manual') {
    return (
      <Tooltip title={item.value} arrow placement='top'>
        <Chip
          label={item.value}
          size='small'
          variant='outlined'
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('manual')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'function') {
    return (
      <Tooltip title={item.value} arrow placement='top'>
        <Chip
          label={item.value}
          size='small'
          variant='outlined'
          onClick={() => onFunctionClick?.(idx)}
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('function')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'number') {
    return (
      <Tooltip title={item.value} arrow placement='top'>
        <Chip
          label={item.value}
          size='small'
          variant='outlined'
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('number')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'bracket') {
    const label = `(${buildBracketDisplayLabel(item.bracketItems || [], rid)})`;
    return (
      <Tooltip title={label} arrow placement='top'>
        <Chip
          label={label}
          size='small'
          variant='outlined'
          onClick={() => onBracketClick?.(idx)}
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('bracket')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'conditional') {
    const label = buildConditionalDisplayLabel(item.conditionalData, rid);
    return (
      <Tooltip title={label} arrow placement='top'>
        <Chip
          label={label}
          size='small'
          variant='outlined'
          onClick={() => onConditionalClick?.(idx)}
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('conditional')}
        />
      </Tooltip>
    );
  }

  if (item.type === 'sumOf') {
    const label = `SUM(${
      item.sumOfArg?.type === 'chip'
        ? getDisplayName(item.sumOfArg.value, rid)
        : item.sumOfArg?.value || ''
    })`;
    return (
      <Tooltip title={label} arrow placement='top'>
        <Chip
          label={label}
          size='small'
          variant='outlined'
          onClick={() => onSumOfClick?.(idx)}
          onDelete={() => onDelete(idx)}
          sx={buildChipSx('sumOf')}
        />
      </Tooltip>
    );
  }

  // operator
  return (
    <Chip
      label={item.value}
      size='small'
      variant='outlined'
      onDelete={() => onDelete(idx)}
      sx={buildChipSx('operator', { value: item.value })}
    />
  );
};

export default ExpressionChip;
