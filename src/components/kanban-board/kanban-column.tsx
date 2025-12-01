import type React from 'react';
import { useState, useMemo } from 'react';
import type { KanbanColumnProps, TaskCard } from './types';
import { useDroppable } from '@dnd-kit/core';
import { AddIcon } from '../../assets';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCardComponent from './task-card';
import TaskCreateModal, { TaskFormData } from './task-create-modal';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  roleOptions?: RoleOption[];
  collaboratorData?: Array<{ rid: string; name: string; email?: string }>;
  availableUsers?: Array<{ rid: string; name: string; email?: string }>;
  onCreateModalOpen?: () => void;
}

const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onTaskClick,
  isDragable = false,
  isDragablebetweenBoards = false,
  statusData,
  statusOptions,
  priorityData,

  onCreateTask,
  roleOptions = [],
  tagData = [],
  checklistData = [],
  collaboratorData = [],
  availableUsers = [],
  fieldVisibility,
  fieldDisabled,
  accountId,
  caseId,
  caseStartDate,
  caseEndDate,
  onCreateModalOpen,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { setNodeRef } = useDroppable({
    id: column.rid,
    data: { type: 'Column', column },
  });

  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return column.tasks.filter((task) => {
      const duplicate = seen.has(task.rid);
      seen.add(task.rid);
      return !duplicate;
    });
  }, [column.tasks]);

  const handleCreateTask = async (columnId: string, formData: TaskFormData) => {
    try {
      if (onCreateTask) {
        const taskData: Partial<TaskCard> & {
          checklist_template_rid?: string;
          workflow_connector?:
          | {
            source_rid?: string;
            relationship_connector_rid?: string;
            target_rid?: string[];
          }
          | Record<string, never>;
          weightage_rid?: string;
          task_category_rid?: string;
        } = {
          task_name: formData.taskTitle,
          task_description: formData.description,
          status_rid: formData.selectedStatusRid,
          priority_rid: formData.selectedPriorityRid,
          priority_name: formData.selectedPriority,
          effective_start_datetime: formData.startDate?.format(
            'YYYY-MM-DD HH:mm:ss'
          ),
          effective_end_datetime: formData.endDate?.format(
            'YYYY-MM-DD HH:mm:ss'
          ),
          assigned_to: formData.selectedAssignee ?? '',
          tags: formData.selectedTags,
          ...(formData.selectedChecklistRid && {
            checklist_template_rid: formData.selectedChecklistRid,
          }),
          workflow_connector:
            formData.linkedTypeRid &&
              formData.linkTaskTypeRids &&
              formData.linkTaskTypeRids.length > 0
              ? {
                source_rid: '',
                relationship_connector_rid: formData.linkedTypeRid,
                target_rid: formData.linkTaskTypeRids,
              }
              : {},
          ...(formData.weightageRid && {
            weightage_rid: formData.weightageRid,
          }),
          ...(formData.categoryRid && {
            task_category_rid: formData.categoryRid,
          }),
        };

        await onCreateTask(columnId, taskData);
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'
      style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
    >
      <div className='bg-white border border-slate-200 rounded-lg p-3 mb-2'>
        <div className='flex items-center gap-2'>
          <h2
            className='text-slate-800 text-[13px] font-semibold'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            {column.milestone_name}
          </h2>
          {showTaskCount && (
            <span
              className='bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[13px]'
              style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
            >
              {column.task_count}
            </span>
          )}
        </div>
      </div>

      <SortableContext
        items={uniqueTasks.map((t) => t.rid)}
        strategy={verticalListSortingStrategy}
        disabled={!isDragable && !isDragablebetweenBoards}
      >
        <div className='space-y-2 mb-2'>
          {uniqueTasks.map((taskCard) => (
            <TaskCardComponent
              key={taskCard.rid}
              taskId={taskCard.rid}
              taskData={taskCard}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              onTaskClick={onTaskClick}
              isDragable={isDragable}
              isDragablebetweenBoards={isDragablebetweenBoards}
              statusData={statusData}
              statusOptions={statusOptions}
              priorityData={priorityData}

            />
          ))}
        </div>
      </SortableContext>

      {!isCreateTaskHide && (
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            onCreateModalOpen?.();
          }}
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${isCreateTaskDisabled
            ? 'border-slate-300 text-slate-400 cursor-not-allowed'
            : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
            }`}
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add Task</span>
        </button>
      )}

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        columnId={column.rid}
        columnName={column.milestone_name}
        statusData={statusData}
        priorityData={priorityData}
        tagData={tagData}
        checklistData={checklistData}
        collaboratorData={collaboratorData}
        availableUsers={availableUsers}
        roleOptions={roleOptions}
        fieldVisibility={fieldVisibility}
        fieldDisabled={fieldDisabled}
        accountId={accountId}
        caseId={caseId}
        caseStartDate={caseStartDate}
        caseEndDate={caseEndDate}
      />
    </div>
  );
};

export default KanbanColumn;
