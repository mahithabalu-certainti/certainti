import { useState } from 'react';
import KanbanBoard from '../../../../components/kanban-board/kanbanBoard';
import {
  Board,
  DropdownOption,
} from '../../../../components/kanban-board/types';
import { DownloadIcon } from '../../../../assets';

const EditCase = () => {
  const initialBoards: Board[] = [
    {
      id: 'case-setup',
      title: 'Case Setup',
      color: '#8B5CF6',
      maxItems: 5,
      tasks: [
        { id: '1', title: 'Create Case Team', completed: false },
        { id: '2', title: 'Add Projects', completed: false },
        { id: '3', title: 'Review Projects', completed: false },
      ],
    },
    {
      id: 'base-data',
      title: 'Base Data Gathering',
      color: '#EC4899',
      maxItems: 8,
      tasks: [
        { id: '4', title: 'Basic Info', completed: false },
        { id: '5', title: 'Point of contact', completed: false },
        { id: '6', title: 'Timesheet', completed: false },
        { id: '7', title: 'Financials', completed: false },
        { id: '8', title: 'Technical Details', completed: false },
        { id: '9', title: 'Project Resources', completed: false },
      ],
    },
    {
      id: 'extended-data',
      title: 'Extended Data Gathering',
      color: '#06B6D4',
      maxItems: 10,
      tasks: [
        { id: '10', title: 'Generate Survey', completed: false },
        { id: '11', title: 'Send Survey', completed: false },
        { id: '12', title: 'Survey Follow up', completed: false },
        { id: '13', title: 'Review Survey Response', completed: false },
        { id: '14', title: 'Schedule Deep Dive meeting', completed: false },
        { id: '15', title: 'Execute deep dive meeting', completed: false },
        {
          id: '16',
          title: 'Update deep dive meeting response',
          completed: false,
        },
      ],
    },
    {
      id: 'technical-summary',
      title: 'Technical Summary',
      color: '#F59E0B',
      maxItems: 6,
      tasks: [
        { id: '17', title: 'Generate Technical summary', completed: false },
        { id: '18', title: 'Review Technical summary', completed: false },
        { id: '19', title: 'Update Technical summary', completed: false },
        {
          id: '20',
          title: 'Approve and baseline technical summary',
          completed: false,
        },
      ],
    },
  ];
  const [boards, setBoards] = useState<Board[]>(initialBoards);

  const customDropdownOptions: DropdownOption[] = [
    {
      id: 'export',
      label: 'Export Board',
      icon: <DownloadIcon size={16} />,
      action: () => {
        console.log('Export functionality would be implemented here');
      },
    },
  ];

  return (
    <div className='min-h-screen bg-gray-100'>
      <KanbanBoard
        boards={boards}
        onBoardsChange={setBoards}
        config={{
          customDropdownOptions,
        }}
      />
    </div>
  );
};

export default EditCase;
