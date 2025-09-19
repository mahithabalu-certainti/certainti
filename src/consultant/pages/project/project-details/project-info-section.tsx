import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Skeleton,
  Grid,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { TruncateWithTooltip } from '../../../../components';
import { EditIcon } from '../../../../assets';

interface ProjectInfoItem {
  label: string;
  key?: string;
  value: string | React.ReactNode;
  className?: string;
  hide?: boolean;
  editable?: boolean;
  onSave?: (value: string) => void;
}

interface InfoSectionColumn {
  items: ProjectInfoItem[];
}

interface ProjectInfoSectionProps {
  columns: InfoSectionColumn[];
  className?: string;
  loading?: boolean;
  error?: boolean;
  onAdjustmentFactorChange?: (value: string) => void;
}

export const ProjectInfoSection: React.FC<ProjectInfoSectionProps> = ({
  columns,
  className = '',
  loading = false,
  error,
  onAdjustmentFactorChange,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiEstimatedQre, setAiEstimatedQre] = useState<number>(0);

  useEffect(() => {
    if (isEditing || isSaving) return;

    let adjustment = '';
    let aiQre = 0;

    for (const column of columns) {
      for (const item of column.items) {
        if (item.key === 'adjustment_factor') {
          adjustment =
            typeof item.value === 'string' ? item.value.replace('%', '') : '';
        }
        if (item.key === 'ai_estimated_qre') {
          aiQre =
            typeof item.value === 'string'
              ? Number(item.value.replace('%', '')) || 0
              : 0;
        }
      }
    }

    setAdjustmentValue(adjustment);
    setOriginalValue(adjustment);
    setAiEstimatedQre(aiQre);
  }, [columns, isEditing, isSaving]);

  const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAdjustmentValue('');
      return;
    }

    // Allow only numbers with up to 2 decimals
    if (/^-?\d+(\.\d{0,2})?$/.test(value)) {
      let num = Number(value);

      const maxAllowed = 100 - aiEstimatedQre;
      const minAllowed = -100;

      if (num > maxAllowed) num = maxAllowed;
      if (num < minAllowed) num = minAllowed;

      setAdjustmentValue(num.toString());
    }
  };

  const handleSaveAdjustment = async () => {
    if (!adjustmentValue || adjustmentValue === originalValue) {
      setIsEditing(false);
      return;
    }
    if (onAdjustmentFactorChange) {
      setIsSaving(true);
      try {
        await onAdjustmentFactorChange(adjustmentValue);
        setAdjustmentValue(adjustmentValue);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to save adjustment factor:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveAdjustment();
    } else if (e.key === 'Escape') {
      setAdjustmentValue(originalValue);
      setIsEditing(false);
    } else if (e.key === 'e') e.preventDefault();
  };

  const handleBlur = () => {
    handleSaveAdjustment();
  };

  const renderValue = (
    item: ProjectInfoItem,
    value: string | React.ReactNode
  ) => {
    // Special handling for editable adjustment factor
    if (item.key === 'adjustment_factor' && item.editable) {
      if (isEditing) {
        return (
          <TextField
            value={adjustmentValue}
            onChange={handleAdjustmentChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyPress}
            variant='outlined'
            size='small'
            disabled={isSaving}
            autoFocus
            inputProps={{
              min: -100,
              max: 100,
              style: {
                fontSize: '12px',
                color: '#425A76',
                width: isSaving ? '90px' : '100px',
              },
              type: 'number',
              step: '0.1',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  {isSaving ? <CircularProgress size={13} thickness={5} /> : ''}
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-input': {
                padding: '0px 8px',
              },
              '& .MuiOutlinedInput-root': {
                height: '24px',
                backgroundColor: 'white',
                borderRadius: '2px',
                '& fieldset': {
                  borderColor: '#CBD6E2',
                },
                '&:hover fieldset': {
                  borderColor: '#60A5FA',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#60A5FA',
                },
              },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
              '& input[type=number]': {
                '-moz-appearance': 'textfield',
              },
            }}
          />
        );
      } else {
        return (
          <div
            className='inline-flex items-center justify-between h-[20px] min-w-[40px] group'
            onDoubleClick={() => setIsEditing(true)}
          >
            <span className='font-medium text-[14px] text-[#2D3E4F] cursor-pointer'>
              {adjustmentValue ? `${adjustmentValue}%` : '-'}
            </span>
            <Tooltip title='Edit Adjustment Factor' placement='top' arrow>
              <button
                className='w-6 h-[28px] cursor-pointer flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <React.Suspense fallback={null}>
                  <EditIcon
                    className='w-3.5 h-3.5'
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(16%) sepia(14%) saturate(749%) hue-rotate(169deg) brightness(93%) contrast(86%)',
                    }}
                  />
                </React.Suspense>
              </button>
            </Tooltip>
          </div>
        );
      }
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'active' || lowerValue === 'inactive') {
        return (
          <Typography
            component='span'
            sx={{
              fontSize: '14px',
              color: lowerValue === 'active' ? '#199806' : '#f44336',
              fontWeight: 500,
            }}
          >
            {value === 'Active' ? 'Active' : 'In-Active'}
          </Typography>
        );
      }
    }
    return value;
  };

  const loadingRows = 4;
  const totalColumns = 3;

  const rowCount =
    Array.isArray(columns) && columns[0]?.items?.length
      ? columns[0].items.length
      : 0;

  const getGridSize = (totalColumns: number) => {
    if (totalColumns <= 6) {
      return 12 / totalColumns;
    }
    return 2;
  };

  if (error) {
    return (
      <Box
        className={`flex items-center justify-center p-4 border-b-2 border-[#CBD6E2] bg-white max-h-[40px] text-red-500 ${className}`}
      >
        Failed to load details
      </Box>
    );
  }

  return (
    <Box
      className={`flex flex-col gap-3 px-4 py-2 border-b border-[#CBD6E2] bg-white min-h-[140px] max-h-[160px] ${className}`}
    >
      {loading ? (
        <>
          {[...Array(loadingRows)].map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${totalColumns * 2},1fr)`,
                alignItems: 'center',
                mt: 0.5,
              }}
            >
              {[...Array(totalColumns)].map((__, colIndex) => (
                <React.Fragment key={colIndex}>
                  <Skeleton variant='text' width='40%' height={18} />
                  <Skeleton variant='text' width='80%' height={18} />
                </React.Fragment>
              ))}
            </Box>
          ))}
        </>
      ) : (
        <>
          {[...Array(rowCount)].map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <Grid container spacing={2}>
                {columns.map((column, colIndex) => {
                  const item = column.items?.[rowIndex];
                  if (!item || item.hide) return null;

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={getGridSize(columns.length)}
                      key={colIndex}
                      sx={{ display: 'flex', gap: 1 }}
                    >
                      <Typography
                        variant='caption'
                        sx={{
                          color: '#7D98B6',
                          fontSize: '13px',
                          fontWeight: 600,
                          minWidth: 'fit-content',
                        }}
                      >
                        {item.label}
                      </Typography>
                      {item.editable ? (
                        renderValue(item, item.value)
                      ) : (
                        <TruncateWithTooltip
                          text={String(item.value)}
                          className={`font-medium text-[14px] text-[#2D3E4F] ${item.className}`}
                        >
                          {renderValue(item, item.value) || '-'}
                        </TruncateWithTooltip>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </React.Fragment>
          ))}
        </>
      )}
    </Box>
  );
};
