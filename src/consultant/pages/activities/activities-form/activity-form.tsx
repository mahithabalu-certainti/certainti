import React from 'react';
import { useParams } from 'react-router-dom';
import EmailForm from './email-form';
import TaskForm from './task-form';
import MeetingForm from './meeting-form';
import CallForm from './call-form';

const ActivityForm: React.FC = () => {
  const { type } = useParams();

  //  const isEditView =  location.pathname.split('/').slice(-2, -1)[0] === 'edit';
  //    const accountId = searchParams.get('accountId') || '';
  //    const entityLevel = searchParams.get('entityLevel') || '';
  //    const entityId = searchParams.get('entityId') || '';
  return (
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
  );
};

export default ActivityForm;
