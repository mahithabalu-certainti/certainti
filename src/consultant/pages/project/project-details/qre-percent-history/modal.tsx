import React, { Suspense } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import { ListTableColumn } from '../../../../../components/table/types';
import { CloseIcon, InfoIcon } from '../../../../../assets';
import { ListTable } from '../../../../../components/table';
import { InfoSection } from '../../../../../components';
import { DisplayColumn } from '../interactions/response-history/ultils';

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
  console.log(content, 'content')
  const transformCaseData = (data: AttributeValueRow[]): DisplayColumn[] => {
    const formattedItems = data
      .filter((row) => row.attribute.toLowerCase() === 'stage')
      .map((row) => ({
        label: row.attribute
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        value: row.value || '-',
      }));

    // Insert QRE Percent Score if it exists
    if (qrePercent !== undefined) {
      formattedItems.push({
        label: 'QRE Percent Score',
        value: `${qrePercent}%`,
      });
    }

    const columns: DisplayColumn[] = [
      { items: [] },
      { items: [] },
      { items: [] },
    ];

    formattedItems.forEach((item, index) => {
      columns[index % 3].items.push(item);
    });

    return columns.filter((col) => col.items.length > 0);
  };
  const assessmentDetailsColumns: ListTableColumn<AssessmentDetailsRow>[] = [
    {
      id: 'questionCategory',
      label: 'Criteria',
      sortId: 'questionCategory',
      width: 350,
      render: (row) => row.questionCategory,
    },
    // {
    //   id: 'question',
    //   label: 'Question',
    //   sortId: 'question',
    //   width: 200,
    //   render: (row) => row.question,
    // },

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
          height: 270,
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
            RD Assessment History
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box>
          <Typography variant='subtitle1' sx={{ ...sectionHeaderStyle, mt: 2 }}>
            Assessment Details
          </Typography>
          <InfoSection
            columns={transformCaseData(projectSummaryData)}
            loading={false}
            loadingRows={1}
            error={false}
            singleLineView={true}
          />
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

export const ContentCell: React.FC<ContentCellProps & { qrePercent?: number }> = ({ content }) => {
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
        qrePercent={0} // Default or unused in this specific export usage if it's used elsewhere
      />
    </>
  );
};

export default QrePercentHistoryModal;
