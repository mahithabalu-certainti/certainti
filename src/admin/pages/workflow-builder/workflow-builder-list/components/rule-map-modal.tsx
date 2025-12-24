import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  Skeleton,
} from '@mui/material';
import { ApplyType } from '../../../../types';
import Projects from './project-list/projects';
import { CloseIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import TaskTemplates from './task-templates-list/task-templates-list';
import Accounts from './account-list/accounts';
import Cases from './case-list/cases';
import {
  useCreateRuleMap,
  useGetRuleMapDetails,
  useUpdateRuleMap,
} from '../../../../service/workflow-builder/workflow-builder-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { useToast } from '../../../../../hooks';

interface RuleMapModalProps {
  open: boolean;
  onClose: () => void;
  scopeTypeName: string;
  scopeTypeRid: string;
  ruleRid: string;
  isRuleMapped: boolean;
  onSuccess?: () => void;
  eventType?: string;
}

const RuleMapModal: React.FC<RuleMapModalProps> = ({
  open,
  onClose,
  scopeTypeName,
  scopeTypeRid,
  ruleRid,
  isRuleMapped,
  onSuccess,
  eventType,
}) => {
  const { successToast } = useToast();
  const { userId } = useSelector((state: RootState) => state.auth);
  const createRuleMap = useCreateRuleMap();
  const updateRuleMap = useUpdateRuleMap();

  const [selectedApplyType, setSelectedApplyType] = useState<ApplyType>('ALL');
  const [showEntityTable, setShowEntityTable] = useState(false);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [initialEntityIds, setInitialEntityIds] = useState<string[]>([]); // Store initial IDs separately
  const [resetFilterTrigger, setResetFilterTrigger] = useState<number>(0);

  // Fetch rule map details if rule is already mapped
  const { data: ruleMapDetails, isLoading: ruleMapDetailsLoading } =
    useGetRuleMapDetails(ruleRid, open && isRuleMapped);

  // Populate modal with existing rule map data
  useEffect(() => {
    if (open) {
      if (eventType === 'INDIVIDUAL') {
        setSelectedApplyType('INDIVIDUAL');
      } else if (eventType === 'ALL') {
        setSelectedApplyType('ALL');
      }
      // If BOTH, let it default or stay (which is initialized to ALL)
    }
  }, [eventType, open]);

  useEffect(() => {
    if (ruleMapDetails && open && isRuleMapped) {
      setSelectedApplyType(ruleMapDetails.apply_type);

      // Store the initial entity IDs for INDIVIDUAL type
      if (ruleMapDetails.apply_type === 'INDIVIDUAL') {
        setSelectedEntityIds(ruleMapDetails.scope_entity_rid);
        setInitialEntityIds(ruleMapDetails.scope_entity_rid); // Set initial IDs once
      }
    }
  }, [ruleMapDetails, open, isRuleMapped]);

  const resetModalState = () => {
    setSelectedApplyType('ALL');
    setShowEntityTable(false);
    setSelectedEntityIds([]);
    setInitialEntityIds([]); // Reset initial IDs too
  };

  const handleSaveRuleMap = (applyType: ApplyType, entityIds: string[]) => {
    if (isRuleMapped) {
      // Update existing rule map
      const updatePayload = {
        scope_type_rid: scopeTypeRid,
        rule_rid: ruleRid,
        apply_type: applyType,
        scope_entity_rid: entityIds,
        modified_by: userId || '',
      };

      updateRuleMap.mutate(updatePayload, {
        onSuccess: () => {
          successToast('Rule map assigned successfully');
          resetModalState();
          onClose();
          onSuccess?.();
        },
      });
    } else {
      // Create new rule map
      const createPayload = {
        scope_type_rid: scopeTypeRid,
        rule_rid: ruleRid,
        apply_type: applyType,
        scope_entity_rid: entityIds,
        created_by: userId || '',
      };

      createRuleMap.mutate(createPayload, {
        onSuccess: () => {
          successToast('Rule map assigned successfully');
          resetModalState();
          onClose();
          onSuccess?.();
        },
      });
    }
  };

  const handleSaveEntitySelection = () => {
    handleSaveRuleMap('INDIVIDUAL', selectedEntityIds);
  };

  const handleConfirm = () => {
    if (selectedApplyType === 'ALL') {
      // For ALL: directly call API
      handleSaveRuleMap('ALL', []);
    } else {
      // For INDIVIDUAL: show entity table
      setShowEntityTable(true);
    }
  };

  const handleBack = () => {
    // Reset table filters when going back
    console.log('handleBack - triggering reset');
    setResetFilterTrigger((prev) => {
      console.log('Previous trigger value:', prev);
      return prev + 1;
    });
    setShowEntityTable(false);
    setSelectedEntityIds([]);
  };

  const handleClose = () => {
    if (!createRuleMap.isPending && !updateRuleMap.isPending) {
      // Reset table filters when closing
      console.log('handleClose - triggering reset');
      setResetFilterTrigger((prev) => {
        console.log('Previous trigger value:', prev);
        return prev + 1;
      });

      // Use setTimeout to ensure the trigger propagates before closing
      setTimeout(() => {
        resetModalState();
        onClose();
      }, 0);
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
        return (
          <TaskTemplates
            key={
              initialEntityIds.length > 0 ? initialEntityIds.join(',') : 'empty'
            }
            onSelectionChange={handleSelectionChange}
            initialSelectedIds={isRuleMapped ? initialEntityIds : undefined}
            resetFilterTrigger={resetFilterTrigger}
          />
        );
      case 'case':
        return (
          <Cases
            key={
              initialEntityIds.length > 0 ? initialEntityIds.join(',') : 'empty'
            }
            onSelectionChange={handleSelectionChange}
            initialSelectedIds={isRuleMapped ? initialEntityIds : undefined}
            resetFilterTrigger={resetFilterTrigger}
          />
        );
      case 'account':
        return (
          <Accounts
            key={
              initialEntityIds.length > 0 ? initialEntityIds.join(',') : 'empty'
            }
            onSelectionChange={handleSelectionChange}
            initialSelectedIds={isRuleMapped ? initialEntityIds : undefined}
            resetFilterTrigger={resetFilterTrigger}
          />
        );
      case 'project':
        return (
          <Projects
            key={
              initialEntityIds.length > 0 ? initialEntityIds.join(',') : 'empty'
            }
            onSelectionChange={handleSelectionChange}
            initialSelectedIds={isRuleMapped ? initialEntityIds : undefined}
            resetFilterTrigger={resetFilterTrigger}
          />
        );
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
        <Box
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[65%] max-w-[65%] bg-white rounded-md shadow-lg outline-none'
          sx={{
            pointerEvents:
              createRuleMap.isPending ||
              updateRuleMap.isPending ||
              ruleMapDetailsLoading
                ? 'none'
                : 'all',
          }}
        >
          <div
            className={`flex items-center justify-between gap-2 p-4 border-b border-[#CBD6E2] shrink-0`}
          >
            <div className='text-[16px] font-bold text-[#2D3E4F]'>
              {showEntityTable
                ? `Select ${scopeTypeName} Entities`
                : isRuleMapped
                  ? 'Edit Assigned Rule'
                  : 'Assign Rule'}
            </div>
            <button
              onClick={handleClose}
              disabled={
                createRuleMap.isPending ||
                updateRuleMap.isPending ||
                ruleMapDetailsLoading
              }
              className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer disabled:cursor-default'
            >
              <React.Suspense fallback={null}>
                <CloseIcon className='w-3 h-3' />
              </React.Suspense>
            </button>
          </div>
          {/* Body */}
          <div>
            {ruleMapDetailsLoading ? (
              // Skeleton loading state
              <div className='p-4'>
                <Skeleton
                  variant='text'
                  width='60%'
                  height={24}
                  sx={{ mb: 2 }}
                />
                <Skeleton
                  variant='text'
                  width='40%'
                  height={20}
                  sx={{ mb: 3 }}
                />
                <div className='space-y-3'>
                  <div className='flex items-start gap-2'>
                    <Skeleton variant='circular' width={20} height={20} />
                    <div className='flex-1'>
                      <Skeleton variant='text' width='30%' height={20} />
                      <Skeleton variant='text' width='70%' height={16} />
                    </div>
                  </div>
                  <div className='flex items-start gap-2'>
                    <Skeleton variant='circular' width={20} height={20} />
                    <div className='flex-1'>
                      <Skeleton variant='text' width='30%' height={20} />
                      <Skeleton variant='text' width='70%' height={16} />
                    </div>
                  </div>
                </div>
              </div>
            ) : !showEntityTable ? (
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
                    {(eventType === 'ALL' ||
                      eventType === 'BOTH' ||
                      !eventType) && (
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
                        disabled={
                          createRuleMap.isPending ||
                          updateRuleMap.isPending ||
                          ruleMapDetailsLoading
                        }
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
                              Apply this rule to all{' '}
                              {scopeTypeName.toLowerCase()} entities
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', ml: 0 }}
                      />
                    )}

                    {(eventType === 'INDIVIDUAL' || eventType === 'BOTH') && (
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
                        disabled={
                          createRuleMap.isPending ||
                          updateRuleMap.isPending ||
                          ruleMapDetailsLoading
                        }
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
                    )}
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
                disabled={
                  createRuleMap.isPending ||
                  updateRuleMap.isPending ||
                  ruleMapDetailsLoading
                }
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
                disabled={
                  createRuleMap.isPending ||
                  updateRuleMap.isPending ||
                  ruleMapDetailsLoading
                }
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
                loading={createRuleMap.isPending || updateRuleMap.isPending}
                disabled={
                  createRuleMap.isPending ||
                  updateRuleMap.isPending ||
                  ruleMapDetailsLoading ||
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
