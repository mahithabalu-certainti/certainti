import React, { Suspense } from 'react';
import { Modal, Box, Typography, IconButton, Grid } from '@mui/material';
import { ListTableColumn } from '../../../../../components/table/types';
import { CloseIcon, InfoIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';

interface QrePercentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  content: React.ReactNode;
  qrePercent?: number;
}

interface AttributeValueRow {
  id: string;
  attribute: string;
  value: string;
  [key: string]: unknown;
}

interface AssessmentDetailsRow {
  id: string;
  questionCategory: string;
  question: string;
  answer: string;
  weight: number;
  [key: string]: unknown;
}

const QrePercentHistoryModal: React.FC<QrePercentHistoryModalProps> = ({
  open,
  onClose,
  content,
  qrePercent,
}) => {
  const projectSummaryData: AttributeValueRow[] = [];
  const assessmentDetailsData: AssessmentDetailsRow[] = [];
  // console.log(content, 'contet')
  try {
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      const parsedContent = JSON.parse(content);

      Object.entries(parsedContent).forEach(([key, value]) => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'answer' in value &&
          'weight' in value
        ) {
          const typedValue = value as {
            question?: string;
            answer: string;
            weight: number;
          };
          assessmentDetailsData.push({
            id: `assessment-${key}`,
            questionCategory: key,
            question: typedValue.question ?? '-',
            answer: typedValue.answer ?? '-',
            weight: typedValue.weight ?? 0,
          });
        } else {
          projectSummaryData.push({
            id: key,
            attribute: key,
            value: String(value ?? '-'),
          });
        }
      });
    }
  } catch (error) {
    console.log('error parsing content:', error);
  }

  const formattedItems = projectSummaryData
    .filter((row) => row.attribute.toLowerCase() === 'stage')
    .map((row) => ({
      label: row.attribute
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: row.value || '-',
    }));

  if (qrePercent !== undefined) {
    formattedItems.push({
      label: 'QRE Percent Score',
      value: `${qrePercent}%`,
    });
  }

  const assessmentDetailsColumns: ListTableColumn<AssessmentDetailsRow>[] = [
    {
      id: 'questionCategory',
      label: 'Criteria',
      sortId: 'questionCategory',
      width: 350,
      render: (row) => row.questionCategory,
    },
    {
      id: 'weight',
      label: 'Weight',
      sortId: 'weight',
      width: 100,
      render: (row) => row.weight,
    },
    {
      id: 'answer',
      label: 'Answer',
      sortId: 'answer',
      width: 100,
      render: (row) => row.answer,
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby='qre-percent-modal'
      onClick={onClose}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '60%',
          transform: 'translate(-50%, -50%)',
          height: 200,
          width: 900,
          bgcolor: '#Fff',
          borderRadius: '4px',
          overflowY: 'auto',
          outline: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #CBD6E2',
            p: '8px 16px',
          }}
        >
          <Typography
            variant='h6'
            component='h2'
            sx={{
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              color: '#2D3E4F',
              lineHeight: '21px',
              textTransform: 'capitalize' as const,
            }}
          >
            RD Assessment Details
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              px: 2,
              py: 1,
              // borderBottom: '1px solid #CBD6E2',
              backgroundColor: 'white',
              minHeight: '40px', // Matches singleLineView
            }}
          >
            <Grid container spacing={2}>
              {/* First Item */}
              <Grid item xs={4} sx={{ display: 'flex', gap: 1 }}>
                {formattedItems[0] && (
                  <>
                    <Typography
                      variant='caption'
                      sx={{
                        color: '#7D98B6',
                        fontSize: '13px',
                        fontWeight: 600,
                        minWidth: 'fit-content',
                      }}
                    >
                      {formattedItems[0].label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2D3E4F',
                      }}
                    >
                      {formattedItems[0].value}
                    </Typography>
                  </>
                )}
              </Grid>

              {/* Second Item */}
              <Grid item xs={4} sx={{ display: 'flex', gap: 1 }}>
                {formattedItems[1] && (
                  <>
                    <Typography
                      variant='caption'
                      sx={{
                        color: '#7D98B6',
                        fontSize: '13px',
                        fontWeight: 600,
                        minWidth: 'fit-content',
                      }}
                    >
                      {formattedItems[1].label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2D3E4F',
                      }}
                    >
                      {formattedItems[1].value}
                    </Typography>
                  </>
                )}
              </Grid>

              {/* Third Item - Empty */}
              <Grid item xs={4}>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ px: 2 }}>
            <div className='border-x border-t border-[#CBD6E2]'>
              <ListTable<AssessmentDetailsRow>
                data={assessmentDetailsData}
                columns={assessmentDetailsColumns}
                getRowId={(row) => row.id}
                tableStyle={{ maxHeight: '150px' }}
                actionWidth={0}
              />
            </div>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

interface ContentCellProps {
  content: string;
}

export const ContentCell: React.FC<
  ContentCellProps & { qrePercent?: number }
> = ({ content, qrePercent }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <IconButton
        size='small'
        onClick={() => setIsModalOpen(true)}
        sx={{
          color: '#60A5FA',
          '&:hover': {
            color: '#3B82F6',
            backgroundColor: 'rgba(96, 165, 250, 0.04)',
          },
        }}
      >
        <Suspense fallback={<div style={{ width: 20, height: 20 }} />}>
          <InfoIcon />
        </Suspense>
      </IconButton>
      <QrePercentHistoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={content}
        qrePercent={qrePercent}
      />
    </>
  );
};

export default QrePercentHistoryModal;
