import React from 'react';
import { TaskFormData } from './helper';
import { FormBuilder } from '../form-builder';
import TextButton from '../button/text-button';

interface TaskModalProps {
  onCloseModal: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ onCloseModal }) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const submitData = (formValues: unknown) => {
    console.log('Task form', formValues);
    onCloseModal();
  };

  const handleExternalSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const formConfig = TaskFormData();

  return (
    <div className='py-2 flex flex-col justify-between'>
      <div className='min-h-[300px] max-h-[450px] overflow-y-auto'>
        <FormBuilder
          loading={false}
          data={formConfig}
          values={{}}
          outData={submitData}
          formRef={formRef}
        />
      </div>
      <div className='flex justify-end gap-3 py-4 px-6 border-t border-[#CBD6E2]'>
        <TextButton
          label='Cancel'
          onClick={onCloseModal}
          sx={{
            width: '75px',
            minWidth: '75px',
            fontSize: '12px',
            fontWeight: 400,
          }}
        />
        <TextButton
          label='Save'
          onClick={handleExternalSubmit}
          sx={{
            width: '64px',
            minWidth: '64px',
            fontSize: '13px',
            fontWeight: 400,
          }}
        />
      </div>
    </div>
  );
};

export default TaskModal;
