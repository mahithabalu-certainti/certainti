import React, { Suspense } from 'react';
import { Modal, Box, Typography, IconButton, Divider } from '@mui/material';
import { InfoIcon } from '../../../../../assets/icons';
import ListTable from '../../../../../components/table/list-table';
import { ListTableColumn } from '../../../../../components/table/types';

interface QrePercentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  content: React.ReactNode;
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
}) => {
  let projectSummaryData: AttributeValueRow[] = [];
  let assessmentDetailsData: AssessmentDetailsRow[] = [];

  try {
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      const parsedContent = JSON.parse(content);

      // Project Summary Data
      projectSummaryData.push({
        id: 'stage',
        attribute: 'stage',
        value: parsedContent.stage ?? '-',
      });
      projectSummaryData.push({
        id: 'max_qre_percent',
        attribute: 'max_qre_percent',
        value: parsedContent.max_qre_percent ?? '-',
      });

      // Assessment Details Data
      assessmentDetailsData = Object.entries(parsedContent)
        .filter(([key]) => key !== 'stage' && key !== 'max_qre_percent')
        .map(([key, value]: [string, any], index) => ({
          id: `assessment-${index}`,
          questionCategory: key, // Using key as question category
          question: key, // Also using key as question
          answer: value.answer ?? '-',
          weight: value.weight ?? 0,
        }));
    }
  } catch (error) {
    // Not a JSON string, will display as is.
  }

  const sectionHeaderStyle = {
    border: '1px solid #CBD6E2',
    fontWeight: 'bold',
    fontSize: '14px',
    fontFamily: "'Mulish', 'Lexend', sans-serif",
    color: '#2D3E4F',
    lineHeight: '21px',
    backgroundColor: '#ECECEC',
    py: 0.5,
    pl: 2,
    height: '30px',
    textTransform: 'capitalize' as const,
  };

  const projectSummaryColumns: ListTableColumn<AttributeValueRow>[] = [
    {
      id: 'attribute',
      label: 'Attribute',
      sortId: 'attribute',
      width: 200,
      render: (row) => row.attribute,
    },
    {
      id: 'value',
      label: 'Value',
      sortId: 'value',
      width: 350,
      render: (row) => row.value,
    },
  ];

  const assessmentDetailsColumns: ListTableColumn<AssessmentDetailsRow>[] = [
    {
      id: 'questionCategory',
      label: 'Question Category',
      sortId: 'questionCategory',
      width: 150,
      render: (row) => row.questionCategory,
    },
    {
      id: 'question',
      label: 'Question',
      sortId: 'question',
      width: 200,
      render: () => '-',
    },
    {
      id: 'answer',
      label: 'Answer',
      sortId: 'answer',
      width: 100,
      render: (row) => row.answer,
    },
    {
      id: 'weight',
      label: 'Weight',
      sortId: 'weight',
      width: 100,
      render: (row) => row.weight,
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
          height: 500,
          width: 900,
          bgcolor: '#FCFCFC',
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '2px',
          overflowY: 'auto',
          pt: 2,
        }}
        onClick={(e) => e.stopPropagation()}
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
            height: '30px',
            px: 2,
            textTransform: 'capitalize' as const,
          }}
        >
          Project Content
        </Typography>

        <Box>
          <Typography variant='subtitle1' sx={sectionHeaderStyle}>
            Project Summary
          </Typography>
          <div className='border-x border-b border-[#CBD6E2]'>
            <ListTable<AttributeValueRow>
              data={projectSummaryData}
              columns={projectSummaryColumns}
              getRowId={(row) => row.id}
              tableStyle={{ maxHeight: '150px' }}
              actionWidth={0}
            />
          </div>

          <Typography variant='subtitle1' sx={{ ...sectionHeaderStyle, mt: 2 }}>
            Assessment Details
          </Typography>
          <div className='border-x border-b border-[#CBD6E2]'>
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
    </Modal>
  );
};

interface ContentCellProps {
  content: string;
}

export const ContentCell: React.FC<ContentCellProps> = ({ content }) => {
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
      />
    </>
  );
};

export default QrePercentHistoryModal;
