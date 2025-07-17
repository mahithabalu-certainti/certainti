import { ListTable } from '../../../../../../components/table';
import { useImportErrorRecords } from '../../../../../services/import';
import { ImportErrorRecord } from '../../../../../types/imports';

interface ImportErrorTableProps {
  fileId: string | null;
  type: 'warning' | 'failed';
}

const ImportErrorTable = ({ fileId, type }: ImportErrorTableProps) => {
  const {
    data = [],
    isLoading,
    isError,
  } = useImportErrorRecords(fileId || '', type);
  const getRowId = (row: ImportErrorRecord) => row.id;

  const importsErrorColumns = [
    {
      id: 'id',
      sortId: 'id',
      label: 'File ID',
      width: 300,
      sortable: false,
    },
    {
      id: 'reason',
      sortId: 'reason',
      label: 'Reason',
      width: 300,
      sortable: false,
    },
    {
      id: 'description',
      sortId: 'description',
      label: 'Description',
      width: 300,
      sortable: false,
    },
  ];
  return (
    <div className='border-t border-[#CBD6E2]'>
      <ListTable
        data={data}
        columns={importsErrorColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 290px)',
          overflow: 'auto',
        }}
        stickyHeader={false}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load imports error records' : undefined}
      />
    </div>
  );
};

export default ImportErrorTable;
