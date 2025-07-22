import React, { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { settingsFormFields } from './helper';
import { FormBuilder } from '../../../../../../components';
import { OnChange } from '../../../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';

const Settings: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  console.log(permission);
  console.log(modules);

  const [formValues, setFormValues] = useState<
    Record<string, string | string[] | boolean | number | null | object>
  >({});

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'project_startdate') {
      const newMinDate = new Date(data.fieldValue as string);
      formRef.current?.setFieldValue('project_enddate', {
        minDate: newMinDate,
      });
    }
    console.log('Form change:', data);
  };

  const handleFormSubmit = (data: object) => {
    const typedData = data as Record<
      string,
      string | string[] | boolean | number | null | object
    >;
    setFormValues(typedData);
    console.log('Form Submitted:', typedData);
  };

  return (
    <div>
      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] pt-5'>
        <Box
          className='bg-white'
          sx={{
            minHeight: '560px',
            maxHeight: '560px',
            overflowY: 'auto',
            '& .grid': {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr) !important',
              gap: '1rem',
            },
            '& .grid > div': {
              gridColumn: 'span 1 !important',
            },
          }}
        >
          <FormBuilder
            data={settingsFormFields()}
            formRef={formRef}
            outData={handleFormSubmit}
            values={formValues}
            onChange={onChangeField}
            keyStart='project_startdate'
            keyEnd='project_enddate'
          />
        </Box>
      </div>
    </div>
  );
};

export default Settings;
