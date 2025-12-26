/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FormControl, MenuItem, Select, CircularProgress } from '@mui/material';
import { useWorkflowContext } from '../workflow-context';
import { COMMON_MENU_PROPS, getSelectStyles, Action, ActionTypeEnum } from '../helper';
import { useGetActionsTemplate } from '../../../../service/workflow-builder/workflow-builder-service';

interface ActionTemplateItemProps {
  action: Action;
  selectedTemplate: any;
  onTemplateChange: (templateData: any) => void;
}

const ActionTemplateItem: React.FC<ActionTemplateItemProps> = ({
  action,
  selectedTemplate,
  onTemplateChange,
}) => {
  const { data, isLoading } = useGetActionsTemplate(action.name);
  // Handle the nested response structure: data -> data -> templates
  // The user reported response: { data: { statusCode: 200, data: { templates: [] } } }
  // Our service typically returns response.data
  // So 'data' here is likely { statusCode: 200, data: { templates: [] } }
  // So 'data' here is likely { statusCode: 200, data: { templates: [] } }
  const options =
    (data as any)?.data?.data?.templates ||
    (data as any)?.data?.templates ||
    [];

  const handleChange = (templateId: string) => {
    const selected = options.find((t: any) => (t.rid || t.id) === templateId);
    onTemplateChange(selected);
  };

  return (
    <div className='mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50'>
      {/* <div className='flex items-center  mb-2'>
                <span className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded'>
                    {action.name} Template
                </span>
            </div> */}

      <div className='w-full'>
        <label className='block text-sm font-semibold  text-[#2D3E4F] mb-1'>
          {action.name} Template <span className='text-red-500'>*</span>
        </label>
        {isLoading ? (
          <div className='flex items-center gap-2 text-xs text-gray-500 h-[32px]'>
            <CircularProgress size={16} /> Loading templates...
          </div>
        ) : (
          <FormControl fullWidth size='small'>
            <Select
              value={selectedTemplate?.rid || selectedTemplate?.id || ''}
              onChange={(e) => handleChange(e.target.value)}
              displayEmpty
              MenuProps={COMMON_MENU_PROPS}
              sx={getSelectStyles(false, !selectedTemplate)}
            >
              <MenuItem
                value=''
                sx={{
                  color: '#425A76',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Choose Template
              </MenuItem>
              {options.length > 0 ? (
                options.map((option: any) => (
                  <MenuItem
                    key={option.rid || option.id}
                    value={option.rid || option.id}
                    sx={{
                      color: '#425A76',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    {option.template_name || option.name || option.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem
                  disabled
                  sx={{
                    color: '#9CA3AF',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  No templates available
                </MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </div>
    </div>
  );
};

const ActionTemplate: React.FC = () => {
  const { rule, updateActionTemplate } = useWorkflowContext();

  // Filter actions to only show In App and Email actions
  const templateActions = rule.actions.filter(
    (action) =>
      action.name === ActionTypeEnum.InApp || action.name === ActionTypeEnum.Email
  );

  return (
    <div className='p-6 h-full flex flex-col overflow-y-auto'>
      <div className='mb-6'>
        <h2 className='text-lg font-semibold text-[#425A76] mb-2'>
          Configure Action Templates
        </h2>
        <p className='text-sm text-gray-500'>
          Select a template for each action in your workflow.
        </p>
      </div>

      <div className='flex-1'>
        {templateActions.length > 0 ? (
          templateActions.map((action) => (
            <ActionTemplateItem
              key={action.id}
              action={action}
              selectedTemplate={rule.actionTemplates?.[action.name]}
              onTemplateChange={(templateData) =>
                updateActionTemplate(action.name, templateData)
              }
            />
          ))
        ) : (
          <div className='text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300'>
            No actions added. Please go back and add In App or Email actions first.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTemplate;
