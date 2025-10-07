import { useMemo, useState } from 'react';
import { ListTable } from '../../../../components/table';
import { useTempleteList } from '../../../../consultant/services/import';
import { TemplateItem } from '../../../../consultant/types';
import { TemplateListParams } from '../../../types';
import { getInteractionTemplateColumns } from './column';
import { AllPermissions } from '../../../../common-service';
import { RootState } from '../../../../store/store';
import { useSelector } from 'react-redux';
import ImportModel from './model-import';

interface ImportTemplateTableProps {
  tableParams?: TemplateListParams;
  setTableParams?: React.Dispatch<React.SetStateAction<TemplateListParams>>;
}

const ImportTemplateTable: React.FC<ImportTemplateTableProps> = () => {
  const { data: templateList, isLoading, isError, refetch } = useTempleteList();
  console.log(templateList);
  const [isOpen, setIsOpen] = useState(false);
  const [temlateId, setTemplateId] = useState('');
  const [temlateName, setTemplateName] = useState('');
  const onClose = () => {
    setIsOpen(false);
  };
  const handleUpload = (row: TemplateItem) => {
    setTemplateId(row.rid);
    setTemplateName(row.template_name);
    setIsOpen(true);
  };

  const { permission } = useSelector((state: RootState) => state.permission);
  const templateViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.INTERACTION_TEMPLATES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    templateViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [templateViewEditFields]);

  const handleDownload = (row: TemplateItem) => {
    const documentUrl = row.blob_url;
    if (!documentUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const templateColumns = getInteractionTemplateColumns(
    handleDownload,
    handleUpload,
    permissionMap
  );

  const getRowId = (row: TemplateItem) => row.rid;
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };
  return (
    <>
      <ListTable
        data={templateList || []}
        columns={templateColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 190px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        // Selection
        selectable={false}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        // State
        loading={isLoading}
        error={isError ? 'Failed to load interaction template' : undefined}
      />
      <ImportModel
        isOpen={isOpen}
        onClose={onClose}
        title={`Upload ${capitalizeWords(temlateName)} Template`}
        templateId={temlateId}
        onUploadSuccess={() => {
          refetch();
        }}
      />
    </>
  );
};

export default ImportTemplateTable;
