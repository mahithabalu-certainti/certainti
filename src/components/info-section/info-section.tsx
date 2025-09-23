import React from 'react';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { TruncateWithTooltip } from '../truncate-with-tooltip';

interface InfoSectionColumn {
  items: {
    label: string;
    value: string | React.ReactNode;
    className?: string;
    hide?: boolean;
  }[];
}

interface InfoSectionProps {
  columns: InfoSectionColumn[];
  className?: string;
  loading?: boolean;
  error?: boolean;
  singleLineView?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  columns,
  className = '',
  loading = false,
  singleLineView = false,
  error,
}) => {
  const renderValue = (value: string | React.ReactNode) => {
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

  const loadingRows = singleLineView ? 1 : 2;
  const totalColumns = 3;

  if (error) {
    return (
      <Box
        className={`flex items-center justify-center p-4 border-b-2 border-[#CBD6E2] bg-white max-h-[40px]  text-red-500 ${className}`}
      >
        Failed to load details
      </Box>
    );
  }

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

  return (
    <Box
      className={`flex flex-col gap-3 px-4 py-2 border-b border-[#CBD6E2] bg-white max-h-[${singleLineView ? '80px' : '160px'}] min-h-[${singleLineView ? '40px' : '80px'}] ${className}`}
    >
      {loading ? (
        <>
          {[...Array(loadingRows)].map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${totalColumns * 2}, ${
                  singleLineView ? 'auto' : '1fr'
                })`,
                alignItems: 'center',
                mt: singleLineView ? 0 : 0.5,
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
                      <TruncateWithTooltip
                        text={String(item.value)}
                        className={`font-medium text-[14px] text-[#2D3E4F] ${item.className}`}
                      >
                        {renderValue(item.value)}
                      </TruncateWithTooltip>
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

export default InfoSection;
