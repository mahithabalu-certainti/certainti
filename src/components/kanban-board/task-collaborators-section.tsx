import React, { useState, useMemo, useRef } from 'react';
import {
  Select,
  MenuItem,
  SelectChangeEvent,
  OutlinedInput,
} from '@mui/material';
import { Assignee, User } from './types';

interface TaskCollaboratorsSectionProps {
  fieldVisibility: Record<string, boolean | undefined>;
  editedTask: {
    collaborators?: Assignee[];
  } | null;
  selectedCollaboratorIds: string[];
  allEnrichedUsers: (User & {
    name: string;
    initials: string;
    color: string;
  })[];
  onCollaboratorsChange: (event: SelectChangeEvent<string[]>) => void;
  onToggleCollaboratorSelection: (userId: string) => void;
  onRemoveCollaborator: (collaboratorName: string) => void;
}

const TaskCollaboratorsSection: React.FC<TaskCollaboratorsSectionProps> = ({
  fieldVisibility,
  editedTask,
  selectedCollaboratorIds,
  allEnrichedUsers,
  onCollaboratorsChange,
  onToggleCollaboratorSelection,
  onRemoveCollaborator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allEnrichedUsers;
    return allEnrichedUsers.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allEnrichedUsers, searchQuery]);

  if (fieldVisibility.collaborators) return null;

  return (
    <div className='border-t border-gray-200 pt-6 relative'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-semibold text-gray-700'>Collaborators</h3>
        <div className='w-[350px] relative'>
          <Select
            name='collaborators'
            className='custom-select-no-arrow w-full h-full sm:text-sm px-1.5 py-[7px]'
            onChange={onCollaboratorsChange}
            value={selectedCollaboratorIds}
            displayEmpty
            fullWidth
            size='small'
            multiple
            onClose={() => {
              setSearchQuery('');
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            }}
            input={
              <OutlinedInput
                inputRef={inputRef}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchQuery('');
                    if (inputRef.current) {
                      inputRef.current.value = '';
                    }
                  }
                }}
              />
            }
            renderValue={() => (
              <span
                style={{
                  color: '#7D98B6',
                  fontSize: '13px',
                  fontWeight: '400',
                }}
              >
                Add Collaborators
              </span>
            )}
            MenuProps={{
              anchorOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              PaperProps: {
                sx: {
                  width: '350px',
                  maxHeight: 400,
                  marginBottom: '8px',
                  zIndex: 9999,
                  boxShadow:
                    'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                  '& .MuiMenuItem-root': {
                    fontSize: '13px',
                    padding: '6px 12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
              },
              slotProps: {
                paper: {
                  style: {
                    marginBottom: '8px',
                  },
                },
              },
            }}
            sx={{
              height: '32px',
              fontSize: '13px',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '2px solid #60A5FA',
              },
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused': {
                  boxShadow: 'none',
                },
              },
              '.MuiSelect-select': {
                padding: '6px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minHeight: '20px',
                width: '100%',
                overflow: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CBD6E2',
                  borderRadius: '2px',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #CBD6E2',
                borderRadius: '2px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #CBD6E2',
              },
              '& svg': {
                color: '#7D98B6',
                flexShrink: 0,
              },
            }}
          >
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isSelected = selectedCollaboratorIds.includes(user.id);
                return (
                  <MenuItem
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: isSelected ? '#EBF8FF' : 'inherit',
                      '&:hover': {
                        backgroundColor: isSelected ? '#EBF8FF' : '#F5F5F5',
                      },
                    }}
                    key={user.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollaboratorSelection(user.id);
                    }}
                    title={user.name}
                  >
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
                        checked={isSelected}
                        onChange={() => {}}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ margin: 0 }}
                      />
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: user.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {user.initials}
                      </div>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.name}
                      </span>
                    </div>
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled sx={{ fontSize: '13px', color: '#7D98B6' }}>
                No users found
              </MenuItem>
            )}
          </Select>
        </div>
      </div>

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
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer text-white border-2 border-white shadow-md transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-blue-200'
                style={{
                  backgroundColor: collab.color,
                  fontSize: '8px',
                }}
              >
                {collab.initials}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCollaborator(collab.name);
                  }}
                  className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out scale-0 group-hover:scale-100 shadow-sm'
                  title={`Remove ${collab.name}`}
                >
                  ×
                </button>
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
