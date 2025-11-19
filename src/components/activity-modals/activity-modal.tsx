import React from 'react';
import { Modal, Box } from '@mui/material';
import TaskModal from './task-modal';
import MeetingModal from './meeting-modal';
import CallLogModal from './call-log-modal';
import DraftEmailModal from './draft-email-modal';
import {
  CallLogIcon,
  CloseIcon,
  DraftEmailIcon,
  MeetingIcon,
  TaskCreateIcon,
} from '../../assets';

interface ActivityModalProps {
  modalId: string | null;
  onCloseModal: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  modalId,
  onCloseModal,
}) => {
  if (!modalId) return null;

  // switching modal content
  const getModalContent = () => {
    switch (modalId) {
      case 'create-task':
        return {
          title: 'Create Task',
          icon: TaskCreateIcon,
          color: '#2E5AAC',
          body: <TaskModal onCloseModal={onCloseModal} />,
        };

      case 'draft-email':
        return {
          title: 'Draft Email',
          color: '#FF73C3',
          icon: DraftEmailIcon,
          body: <DraftEmailModal />,
        };

      case 'schedule-meeting':
        return {
          title: 'Meeting Information',
          color: '#FF5F5F',
          icon: MeetingIcon,
          body: <MeetingModal onCloseModal={onCloseModal} />,
        };

      case 'call-log':
        return {
          title: 'Log a Call',
          color: '#AF78FF',
          icon: CallLogIcon,
          body: <CallLogModal onCloseModal={onCloseModal} />,
        };

      default:
        return null;
    }
  };

  const modal = getModalContent();
  if (!modal) return null;

  // handle backdrop click
  const handleClose = (
    _event: React.SyntheticEvent,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick') return; // if you want to disable backdrop close
    onCloseModal();
  };

  return (
    <React.Suspense fallback={null}>
      <Modal open={true} onClose={handleClose}>
        <Box className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[65%] max-w-[65%] bg-white rounded-md shadow-lg outline-none'>
          {/* Title */}
          <div className='flex justify-between items-center py-4 px-6 border-b border-[#CBD6E2]'>
            <div className='flex items-center gap-2'>
              <modal.icon
                className='h-[26px] w-[26px] p-1.5 rounded-[2px] [&>path]:stroke-white'
                style={{ backgroundColor: modal.color }}
              />
              <div className='text-xl font-semibold text-[#2A2A2A]'>
                {modal.title}
              </div>
            </div>
            <button
              onClick={onCloseModal}
              className='p-2.5 hover:bg-gray-200 rounded-full cursor-pointer'
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className='min-h-[300px] max-h-[450px] overflow-y-auto'>
            {modal.body}
          </div>
        </Box>
      </Modal>
    </React.Suspense>
  );
};

export default ActivityModal;
