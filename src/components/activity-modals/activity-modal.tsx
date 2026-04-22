import React from 'react';
import { Modal, Box } from '@mui/material';
import {
  CallLogIcon,
  DraftEmailIcon,
  MeetingIcon,
  TaskCreateIcon,
} from '../../assets';
import TaskForm from '../../consultant/pages/activities/activities-form/task-form';
import { ActivitySourceDetails } from '../../consultant/types';
import EmailForm from '../../consultant/pages/activities/activities-form/email-form';
import MeetingForm from '../../consultant/pages/activities/activities-form/meeting-form';
import CallForm from '../../consultant/pages/activities/activities-form/call-form';

interface ActivityModalProps {
  modalId: string | null;
  onCloseModal: () => void;
  sourceDetails: ActivitySourceDetails;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  modalId,
  onCloseModal,
  sourceDetails,
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
          body: (
            <TaskForm
              isFrom='modal'
              sourceDetails={sourceDetails}
              onCloseModal={onCloseModal}
            />
          ),
        };

      case 'draft-email':
        return {
          title: 'Create Email',
          color: '#FF73C3',
          icon: DraftEmailIcon,
          body: (
            <EmailForm
              isFrom='modal'
              sourceDetails={sourceDetails}
              onCloseModal={onCloseModal}
            />
          ),
        };

      case 'schedule-meeting':
        return {
          title: 'Create Meeting',
          color: '#FF5F5F',
          icon: MeetingIcon,
          body: (
            <MeetingForm
              isFrom='modal'
              sourceDetails={sourceDetails}
              onCloseModal={onCloseModal}
            />
          ),
        };

      case 'call-log':
        return {
          title: 'Create Call',
          color: '#AF78FF',
          icon: CallLogIcon,
          body: (
            <CallForm
              isFrom='modal'
              sourceDetails={sourceDetails}
              onCloseModal={onCloseModal}
            />
          ),
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
          {/* Body */}
          {modal.body}
        </Box>
      </Modal>
    </React.Suspense>
  );
};

export default ActivityModal;
