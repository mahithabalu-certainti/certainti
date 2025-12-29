/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  FormControl,
  MenuItem,
  Select,
  CircularProgress,
  Modal,
  Box,
} from '@mui/material';
import { useWorkflowContext } from '../workflow-context';
import {
  COMMON_MENU_PROPS,
  getSelectStyles,
  Action,
  ActionTypeEnum,
} from '../helper';
import { useGetActionsTemplate } from '../../../../service/workflow-builder/workflow-builder-service';
import { CloseIcon } from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

  const handlePreviewOpen = () => {
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  // Get the full template data for preview
  const getPreviewTemplate = () => {
    if (!selectedTemplate) return null;

    // If selectedTemplate already has message_template, use it directly
    if (selectedTemplate.message_template) {
      return selectedTemplate;
    }

    // Otherwise, find the full template from options using rid/id
    const templateId =
      selectedTemplate.rid || selectedTemplate.id || selectedTemplate;
    const fullTemplate = options.find(
      (t: any) => (t.rid || t.id) === templateId
    );
    return fullTemplate || selectedTemplate;
  };

  const previewTemplate = getPreviewTemplate();

  return (
    <>
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
            <div className='flex items-center gap-2'>
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
            </div>
          )}
          {selectedTemplate && (
            <div className='flex justify-end mt-2'>
              <TextButton
                label='Preview'
                onClick={handlePreviewOpen}
                sx={{
                  width: '70px',
                  minWidth: '70px',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={isPreviewOpen} onClose={handlePreviewClose}>
        <Box className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[50%] max-w-[50%] bg-white rounded-md shadow-lg outline-none'>
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b border-[#CBD6E2]'>
            <div className='text-lg font-semibold text-[#2D3E4F]'>
              Template Preview
            </div>
            <button
              onClick={handlePreviewClose}
              className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer disabled:cursor-default'
            >
              <React.Suspense fallback={null}>
                <CloseIcon className='w-3 h-3' />
              </React.Suspense>
            </button>
          </div>
          {/* Modal body */}
          <div className='p-4'>
            <div className='grid grid-cols-2 gap-6 mb-4'>
              {/* Template Name */}
              <div className='flex flex-col gap-1'>
                <span className='text-[13px] font-bold text-gray-600 tracking-wide'>
                  Template Name
                </span>
                <span className='text-[13px] text-[#2D3E4F] font-medium'>
                  {previewTemplate?.template_name || '-'}
                </span>
              </div>

              {/* Channel */}
              <div className='flex flex-col gap-1'>
                <span className='text-[13px] font-bold text-gray-600 tracking-wide'>
                  Channel
                </span>
                <div className='text-[13px] text-[#3189e1] font-medium'>
                  {previewTemplate?.channel || '-'}
                </div>
              </div>
            </div>

            {/* Template Message - Full width */}
            <div className='flex flex-col gap-2'>
              <span className='text-[13px] font-bold text-gray-600 tracking-wide'>
                Template Message
              </span>
              <div
                className={`
  border border-[#CBD6E2] rounded-md py-3 px-4 min-h-[120px] max-h-[300px] overflow-y-auto
  text-[14px] text-[#425A76] font-normal bg-gray-50

  [&_p]:mb-2
  [&_strong]:font-bold [&_em]:italic
  [&_u]:underline [&_s]:line-through

  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
  [&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-1
  [&_h5]:text-sm [&_h5]:font-medium [&_h5]:mb-1
  [&_h6]:text-xs [&_h6]:font-medium [&_h6]:mb-1

  [&_ul]:list-disc [&_ul]:pl-5
  [&_ol]:list-decimal [&_ol]:pl-5
  [&_li]:mb-1

  [&_a]:text-blue-600 [&_a]:underline
  [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic

  [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded
  [&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto

  [&_img]:max-w-full [&_img]:rounded
  [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:my-2
  [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1
  [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1
`}
                dangerouslySetInnerHTML={{
                  __html: previewTemplate?.message_template || '-',
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

const ActionTemplate: React.FC = () => {
  const { rule, updateActionTemplate } = useWorkflowContext();

  // Filter actions to only show In App and Email actions
  const templateActions = rule.actions.filter(
    (action) =>
      action.name === ActionTypeEnum.InApp ||
      action.name === ActionTypeEnum.Email
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
            No actions added. Please go back and add In App or Email actions
            first.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionTemplate;
