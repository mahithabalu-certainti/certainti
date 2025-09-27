import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextButton from '../../../../components/button/text-button';
import { InteractionFormQuestion, IRecipient } from '../../../types';
import { REGEX_PATTERNS } from '../../../../common-utils';

interface IPreviewDialogProps {
  previewDialog: boolean;
  questions: InteractionFormQuestion[];
  createLoading: boolean;
  recipiants: IRecipient;
  setPreviewDialog: React.Dispatch<React.SetStateAction<boolean>>;
  saveAndSendComplete: (data: IRecipient) => void;
}

export const PreviewDialog: React.FC<IPreviewDialogProps> = ({
  previewDialog,
  questions,
  createLoading,
  recipiants,
  setPreviewDialog,
  saveAndSendComplete,
}) => {
  const [enableRecipiants, setEnableRecipiants] = React.useState(false);
  const [externalRecipiants, setExternalRecipiants] =
    React.useState<IRecipient>({
      name: '',
      email: '',
    });
  const [errors, setErrors] = React.useState<IRecipient>({
    name: '',
    email: '',
  });

  const updateRecipiants = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExternalRecipiants((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };
  // validation function
  const validateAllInputs = () => {
    const newErrors: IRecipient = { email: '', name: '' };

    // Email validation
    if (!externalRecipiants.email.trim()) {
      newErrors.email = 'Recipient Email is required';
    } else {
      if (!REGEX_PATTERNS.MAX_EMAIL_REGEX.test(externalRecipiants.email)) {
        newErrors.email = 'Max length exceeded';
      } else if (!REGEX_PATTERNS.EMAIL.test(externalRecipiants.email)) {
        newErrors.email = 'Invalid Email Address';
      }
    }

    // Name validation
    if (!externalRecipiants.name.trim()) {
      newErrors.name = 'Recipient Name is required';
    } else {
      if (!REGEX_PATTERNS.NAME_REGEX.test(externalRecipiants.name.trim())) {
        newErrors.name =
          "Recipient Name must contain only letters, spaces, apostrophes(') and hyphens(-).";
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };
  const send = () => {
    if (enableRecipiants) {
      if (validateAllInputs()) {
        saveAndSendComplete(externalRecipiants);
      }
    } else {
      saveAndSendComplete(externalRecipiants);
    }
  };

  return (
    <React.Fragment>
      <Dialog
        onClose={() => setPreviewDialog(false)}
        aria-labelledby='customized-dialog-title'
        open={previewDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{ m: 0, p: 2, fontSize: 16 }}
          id='customized-dialog-title'
        >
          Preview
        </DialogTitle>
        <DialogContent dividers>
          <div className='border border-[#CBD6E2] min-h-[40px]'>
            <div className='px-4 py-2 text-[14px] text-[#2D3E4F] font-semibold border-b border-[#CBD6E2]'>
              Interaction Question
            </div>
            <div>
              {questions.map((q, index) => (
                <div key={index} className='p-2'>
                  <div className='font-medium text-[14px] text-[#2D3E4F]'>
                    <span className='font-bold'>
                      {q.question_seq_num || `Q00${index + 1}`}
                      {q.is_mandatory && (
                        <span className='text-red-500 ml-1'>*</span>
                      )}
                    </span>{' '}
                    - {q.question}
                  </div>

                  <div
                    className={`
            mt-1 border border-[#CBD6E2] rounded-[2px] py-2 px-3 min-h-10
            text-[14px] text-[#425A76] font-normal bg-[#FFFBFA]
          `}
                    dangerouslySetInnerHTML={{ __html: '' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className='border border-[#CBD6E2] mt-4'>
            <div className='flex items-center align-middle px-3 h-[30px] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Interaction Information
            </div>
            <div className={`grid grid-cols-4 gap-x-2 items-center`}>
              <div className='font-semibold text-[13px] text-[#425A76] p-3'>
                Recipient Name
              </div>
              <div className='font-medium text-[13px] min-w-0 p-3'>
                {recipiants.name}
              </div>
              <div className='font-semibold text-[13px] text-[#425A76] p-3'>
                Recipient email
              </div>
              <div className='font-medium text-[13px] min-w-0 p-3'>
                {recipiants.email}
              </div>
            </div>
          </div>
          {enableRecipiants ? (
            <div className='border border-[#CBD6E2] mt-4'>
              <div className='flex items-center align-middle px-3 h-[30px] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
                Add Recipient
              </div>
              <div className={`grid grid-cols-4 gap-x-2 items-start`}>
                <div className='font-semibold text-[13px] text-[#425A76] p-3'>
                  Recipient Name
                </div>
                <div className='font-medium text-[13px] min-w-0 p-3'>
                  <input
                    type='text'
                    name='name'
                    className={`placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[28px] border border-[#CBD6E2] rounded-xs ${errors.name ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    onChange={updateRecipiants}
                    value={externalRecipiants.name}
                    placeholder='e.g John'
                  />
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.name}
                  </span>
                </div>
                <div className='font-semibold text-[13px] text-[#425A76] p-3'>
                  Recipient email
                </div>
                <div className='font-medium text-[13px] min-w-0 p-3'>
                  <input
                    type='text'
                    name='email'
                    className={`placeholder-custom-color placeholder-[#7D98B6] outline-none focus:border-2 focus:border-blue-400 w-full sm:text-sm px-3 h-[28px] border border-[#CBD6E2] rounded-xs ${errors.email ? 'border-red-500 bg-[#FEF2F2]' : ''}`}
                    onChange={updateRecipiants}
                    value={externalRecipiants.email}
                    placeholder='e.g johan@mail.com'
                  />
                  <span className='text-[12px] text-red-400 col-span-full'>
                    {errors.email}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-right mt-2'>
              <TextButton
                label='Add Recipient'
                sx={{
                  width: '120px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
                onClick={() => setEnableRecipiants(true)}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ py: 2, px: 3 }}>
          <TextButton
            label={enableRecipiants ? 'Back' : 'Cancel'}
            sx={{
              width: '100px',
              fontSize: '13px',
              fontWeight: 400,
            }}
            onClick={
              enableRecipiants
                ? () => setEnableRecipiants(false)
                : () => setPreviewDialog(false)
            }
            disabled={createLoading}
          />
          <TextButton
            label='Save and Send'
            sx={{
              width: '120px',
              fontSize: '13px',
              fontWeight: 400,
            }}
            loading={createLoading}
            onClick={send}
          />
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
