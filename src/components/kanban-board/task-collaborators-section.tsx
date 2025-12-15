import React from 'react';
import { Autocomplete, TextField, Tooltip } from '@mui/material';
import { Assignee, User } from './types';
import UserAvatar from './user-avatar';

interface TaskCollaboratorsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  fieldDisabled: Record<string, boolean | undefined>;
  editedTask: {
    collaborators?: Assignee[];
  } | null;
  selectedCollaboratorIds: string[];
  allEnrichedUsers: (User & {
    name: string;
    initials: string;
    color: string;
  })[];
  onCollaboratorsChange: (userIds: string[]) => void;
  onRemoveCollaborator: (collaboratorName: string) => void;
  isAddingCollaborator?: boolean;
}

const TaskCollaboratorsSection: React.FC<TaskCollaboratorsSectionProps> = ({
  fieldVisibility,
  fieldDisabled,
  editedTask,
  selectedCollaboratorIds,
  allEnrichedUsers,
  onCollaboratorsChange,
  onRemoveCollaborator,
  isAddingCollaborator = false,
}) => {
  if (fieldVisibility.collaborators) return null;

  const handleCollaboratorSelect = async (selectedIds: string[]) => {
    // Find newly added collaborators
    const newUserIds = selectedIds.filter(
      (id) => !selectedCollaboratorIds.includes(id)
    );

    // If new users are added, trigger API call
    if (newUserIds.length > 0) {
      // Call parent handler to add collaborators via API
      onCollaboratorsChange(selectedIds);
    } else {
      // Just update selection
      onCollaboratorsChange(selectedIds);
    }
  };

  return (
    <div className='border-t border-gray-200 pt-6 relative'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-semibold text-gray-700'>Collaborators</h3>
        <div className='w-[200px]'>
          <Autocomplete
            multiple
            disabled={isAddingCollaborator || fieldDisabled.collaborators}
            options={allEnrichedUsers}
            getOptionLabel={(option) => option.name}
            value={allEnrichedUsers.filter((user) =>
              selectedCollaboratorIds.includes(user.id)
            )}
            onChange={(_, newValue) => {
              const newIds = newValue.map((user) => user.id);
              handleCollaboratorSelect(newIds);
            }}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                size='small'
                placeholder={
                  isAddingCollaborator ? 'Adding...' : 'Search collaborators'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '6px',
                    minHeight: '32px',
                    '& input': {
                      fontSize: '13px',
                      padding: '0 !important',
                      color: '#7D98B6',
                    },
                    '&.Mui-focused': {
                      boxShadow: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#CBD6E2',
                    borderWidth: '1px',
                    borderRadius: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#CBD6E2',
                    borderWidth: '1px',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                    {
                      border: '2px solid #60A5FA',
                    },
                }}
              />
            )}
            ListboxProps={{
              style: {
                maxHeight: '300px',
                fontSize: '13px',
              },
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={selected}
                    readOnly
                    style={{
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                    }}
                  />
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: option.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: '600',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {option.initials}
                  </div>
                  <Tooltip title={option.name} placement='top-start'>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.name}
                    </span>
                  </Tooltip>
                </div>
              </li>
            )}
            noOptionsText='No collaborators found'
            sx={{
              '& .MuiOutlinedInput-root': {
                padding: '6px',
                fontSize: '13px',
              },
            }}
          />
        </div>
      </div>

      {/* Collaborators Display */}
      <div className='flex items-center -space-x-2'>
        {(editedTask?.collaborators || []).length > 0 ? (
          (editedTask?.collaborators || []).map((collab, index) => (
            <div
              key={collab.name}
              className={`relative group transition-transform duration-200 hover:scale-110 hover:z-10 hover:-translate-y-2 ${
                index < (editedTask?.collaborators?.length || 0) - 1
                  ? 'peer'
                  : ''
              }`}
              title={collab.name}
              onMouseEnter={() => {
                const nextProfile = document.querySelector(
                  `[data-profile-index="${index + 1}"]`
                ) as HTMLElement;
                if (nextProfile) {
                  nextProfile.style.transform = 'translateX(8px)';
                }
              }}
              onMouseLeave={() => {
                const nextProfile = document.querySelector(
                  `[data-profile-index="${index + 1}"]`
                ) as HTMLElement;
                if (nextProfile) {
                  nextProfile.style.transform = 'translateX(0)';
                }
              }}
              data-profile-index={index}
            >
              <div className='relative'>
                <UserAvatar
                  profileUrl={collab.profile_url}
                  initials={collab.initials}
                  color={collab.color}
                  size={32}
                  fontSize={10}
                  className='border-2 border-white shadow-md transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-blue-200 cursor-pointer'
                />
                {!fieldDisabled.collaborators && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCollaborator(collab.name);
                    }}
                    className='absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out scale-0 group-hover:scale-100 shadow-sm z-20'
                    title={`Remove ${collab.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default TaskCollaboratorsSection;
