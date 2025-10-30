import React, { Suspense } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import { CloseIcon, InfoIcon } from '../../../../../assets/icons';
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

      Object.entries(parsedContent).forEach(([key, value]) => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'answer' in value &&
          'weight' in value
        ) {
          assessmentDetailsData.push({
            id: `assessment-${key}`,
            questionCategory: key,
            question: key,
            answer: (value as { answer: string }).answer ?? '-',
            weight: (value as { weight: number }).weight ?? 0,
          });
        } else {
          projectSummaryData.push({
            id: key,
            attribute: key,
            value: String(value) ?? '-',
          });
        }
      });
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
          borderRadius: '4px',
          overflowY: 'auto',
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
            m: '2px',
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
            Project Content
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
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
