import React from 'react';
import { useParams } from 'react-router-dom';
import EmailForm from './email-form';
import TaskForm from './task-form';
import MeetingForm from './meeting-form';
import CallForm from './call-form';

const ActivityForm: React.FC = () => {
  const { type } = useParams();

  return (
    <React.Suspense fallback={null}>
      <div>
        {type === 'email' ? (
          <EmailForm />
        ) : type === 'task' ? (
          <TaskForm />
        ) : type === 'meeting' ? (
          <MeetingForm />
        ) : type === 'call' ? (
          <CallForm />
        ) : (
          <div>Activity Form</div>
        )}
      </div>
    </React.Suspense>
  );
};

export default ActivityForm;
