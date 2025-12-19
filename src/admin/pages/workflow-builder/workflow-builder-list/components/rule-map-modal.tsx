import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { ApplyType } from '../../../../types';
import Projects from './project-list/projects';
import { CloseIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import TaskTemplates from './task-templates-list/task-templates-list';
import Accounts from './account-list/accounts';
import Cases from './case-list/cases';

interface RuleMapModalProps {
  open: boolean;
  onClose: () => void;
  scopeTypeName: string;
  onConfirm: (applyType: ApplyType, selectedEntityIds?: string[]) => void;
  isLoading?: boolean;
}

const RuleMapModal: React.FC<RuleMapModalProps> = ({
  open,
  onClose,
  scopeTypeName,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedApplyType, setSelectedApplyType] =
    useState<ApplyType>('INDIVIDUAL');
  const [showEntityTable, setShowEntityTable] = useState(false);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  const handleConfirm = () => {
    if (selectedApplyType === 'ALL') {
      // For ALL: directly confirm
      onConfirm('ALL', []);
    } else {
      // For INDIVIDUAL: show entity table
      setShowEntityTable(true);
    }
  };

  const handleBack = () => {
    setShowEntityTable(false);
    setSelectedEntityIds([]);
  };

  const handleSaveEntitySelection = () => {
    onConfirm('INDIVIDUAL', selectedEntityIds);
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedApplyType('INDIVIDUAL');
      setShowEntityTable(false);
      setSelectedEntityIds([]);
      onClose();
    }
  };

  // This function will be called by your entity table component
  const handleSelectionChange = (entityIds: string[]) => {
    setSelectedEntityIds(entityIds);
  };

  // switching modal content
  const getModalContent = () => {
    switch (scopeTypeName?.toLowerCase()) {
      case 'case task':
        return <TaskTemplates onSelectionChange={handleSelectionChange} />;
      case 'case':
        return <Cases onSelectionChange={handleSelectionChange} />;
      case 'account':
        return <Accounts onSelectionChange={handleSelectionChange} />;
      case 'project':
        return <Projects onSelectionChange={handleSelectionChange} />;
      default:
        return null;
    }
  };

  if (!scopeTypeName) return null;

  const modalBody = getModalContent();
  if (!modalBody) return null;

  // handle backdrop click
  const handleModalClose = (
    _event: React.SyntheticEvent,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick') return; // if you want to disable backdrop close
    handleClose();
  };

  return (
    <React.Suspense fallback={null}>
      <Modal open={open} onClose={handleModalClose}>
        <Box className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[65%] max-w-[65%] bg-white rounded-md shadow-lg outline-none'>
          <div
            className={`flex items-center justify-between gap-2 p-4 border-b border-[#CBD6E2] shrink-0`}
          >
            <div className='text-[16px] font-bold text-[#2D3E4F]'>
              {showEntityTable
                ? `Select ${scopeTypeName} Entities`
                : 'Create Rule Mapping'}
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer disabled:cursor-default'
            >
              <React.Suspense fallback={null}>
                <CloseIcon className='w-3 h-3' />
              </React.Suspense>
            </button>
          </div>
          {/* Body */}
          <div>
            {!showEntityTable ? (
              // Step 1: Apply Type Selection
              <div className='p-4'>
                <div className='text-[14px] font-medium text-[#425A76] mb-2'>
                  Select how you want to apply this rule for{' '}
                  <strong>{scopeTypeName}</strong>:
                </div>

                <FormControl component='fieldset' fullWidth>
                  <FormLabel
                    component='legend'
                    sx={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#2D3E4F',
                      mb: 2,
                    }}
                  >
                    Apply Type:
                  </FormLabel>
                  <RadioGroup
                    value={selectedApplyType}
                    onChange={(e) =>
                      setSelectedApplyType(e.target.value as ApplyType)
                    }
                  >
                    <FormControlLabel
                      value='ALL'
                      control={
                        <Radio
                          size='small'
                          sx={{
                            color: '#9CA3AF',
                            mt: 0.5,
                            '&.Mui-checked': {
                              color: '#3B82F6',
                            },
                          }}
                        />
                      }
                      disabled={isLoading}
                      label={
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#2D3E4F',
                            }}
                          >
                            All
                          </Typography>
                          <Typography
                            sx={{ fontSize: '12px', color: '#2D3E4F' }}
                          >
                            Apply this rule to all {scopeTypeName.toLowerCase()}{' '}
                            entities
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', ml: 0 }}
                    />

                    <FormControlLabel
                      value='INDIVIDUAL'
                      control={
                        <Radio
                          size='small'
                          sx={{
                            color: '#9CA3AF',
                            mt: 0.5,
                            '&.Mui-checked': {
                              color: '#3B82F6',
                            },
                          }}
                        />
                      }
                      disabled={isLoading}
                      label={
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#2D3E4F',
                            }}
                          >
                            Individual
                          </Typography>
                          <Typography
                            sx={{ fontSize: '12px', color: '#2D3E4F' }}
                          >
                            Apply this rule to specific{' '}
                            {scopeTypeName.toLowerCase()} entities
                          </Typography>
                        </Box>
                      }
                      sx={{ mt: 2, alignItems: 'flex-start', ml: 0 }}
                    />
                  </RadioGroup>
                </FormControl>
              </div>
            ) : (
              <div className='min-h-[calc(100vh-300px)]'>{modalBody}</div>
            )}
          </div>
          {/* Footer */}
          <div
            className={`flex items-center ${showEntityTable ? 'justify-between' : 'justify-end border-t border-[#CBD6E2]'} gap-2 p-4 shrink-0`}
          >
            {showEntityTable && (
              <TextButton
                label='Back'
                onClick={handleBack}
                disabled={isLoading}
                sx={{
                  width: '65px',
                  minWidth: '65px',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              />
            )}

            <div className='flex gap-3'>
              <TextButton
                label='Cancel'
                onClick={handleClose}
                disabled={isLoading}
                sx={{
                  width: '75px',
                  minWidth: '75px',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              />
              <TextButton
                label={
                  selectedApplyType !== 'ALL' && !showEntityTable
                    ? 'Next'
                    : 'Save'
                }
                onClick={
                  showEntityTable ? handleSaveEntitySelection : handleConfirm
                }
                loading={isLoading}
                disabled={
                  isLoading ||
                  (showEntityTable && selectedEntityIds.length === 0)
                }
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </React.Suspense>
  );
};

export default RuleMapModal;
