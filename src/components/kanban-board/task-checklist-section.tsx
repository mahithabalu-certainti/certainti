import React, { useState } from 'react';
import { Task } from './types';
import { updateChecklistStatus } from '../../consultant/services/work-breakdown/work-breakdown-service';

interface TaskChecklistSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  editedTask: Task | null;
  onChecklistToggle: (itemId: string) => void;
  caseId: string;
  accountId: string;
}

const TaskChecklistSection: React.FC<TaskChecklistSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  onChecklistToggle,
  caseId,
  accountId,
}) => {
  const [hideCheckedItems, setHideCheckedItems] = useState(false);

  const getCompletionPercentage = () => {
    const checklist = editedTask?.checklist || [];
    if (checklist.length === 0) return 0;
    const completedItems = checklist.filter((item) => item.completed).length;
    return Math.round((completedItems / checklist.length) * 100);
  };

  const getFilteredChecklistItems = () => {
    const checklist = editedTask?.checklist || [];
    return hideCheckedItems
      ? checklist.filter((item) => !item.completed)
      : checklist;
  };

  const handleChecklistItemToggle = async (itemId: string) => {
    if (!editedTask) return;
    const checklistInfo = editedTask.checklistInfo;
    const checklistItem = (editedTask.checklist ?? []).find(
      (item) => item.id === itemId
    );
    if (!checklistInfo || !checklistItem) return;

    const newStatus = checklistItem.completed ? 'Open' : 'Done';

    await updateChecklistStatus({
      task_rid: editedTask.id,
      ...(caseId && { case_rid: caseId }),
      account_rid: accountId,
      checklist_rid: checklistInfo.rid,
      rid: itemId,
      status_rid: newStatus,
    });

    onChecklistToggle(itemId);
  };

  if (
    fieldVisibility.checklist ||
    !editedTask?.checklist ||
    editedTask.checklist.length === 0
  ) {
    return null;
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-semibold text-gray-700'>TC Checklist</h3>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setHideCheckedItems(!hideCheckedItems)}
            style={{
              height: '24px !important',
              color: '#425A76',
              border: '1px solid #CBD6E2',
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              textTransform: 'none',
              fontSize: '13px',
              fontWeight: 400,
              padding: '0px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            className='transition-colors hover:text-[#425A76]'
          >
            {hideCheckedItems ? 'Show Checked Items' : 'Hide Checked Items'}
          </button>
        </div>
      </div>

      <div className='mb-4'>
        <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
          <span>Progress</span>
          <span>{getCompletionPercentage()}% Complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-in-out'
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        <div className='text-xs text-gray-500 mt-1'>
          {editedTask.checklist.filter((item) => item.completed).length} of{' '}
          {editedTask.checklist.length} items completed
        </div>
      </div>

      <div className='border border-gray-200 rounded-lg'>
        <div
          className={`space-y-0 ${
            getFilteredChecklistItems().length > 6
              ? 'max-h-64 overflow-y-auto'
              : ''
          }`}
        >
          {getFilteredChecklistItems().map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                index !== getFilteredChecklistItems().length - 1
                  ? 'border-b border-gray-200'
                  : ''
              }`}
            >
              <input
                type='checkbox'
                checked={item.completed}
                onChange={() => handleChecklistItemToggle(item.id)}
                className='w-4 h-4 text-emerald-600 accent-emerald-600 border-gray-300 rounded cursor-pointer'
                disabled={fieldDisabled.checklist}
              />
              <span
                className={`flex-1 text-sm transition-all duration-200 cursor-pointer ${
                  item.completed
                    ? 'line-through text-gray-500'
                    : 'text-gray-700'
                }`}
                style={{ fontSize: '13px' }}
                onClick={() =>
                  !fieldDisabled.checklist && handleChecklistItemToggle(item.id)
                }
              >
                {item.text}
              </span>
              {item.completed && (
                <svg
                  className='w-4 h-4 text-emerald-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </div>
          ))}

          {getFilteredChecklistItems().length === 0 && hideCheckedItems && (
            <div className='px-4 py-6 text-center text-gray-500 text-sm'>
              All items are completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskChecklistSection;
