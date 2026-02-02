
import { ListTableColumn } from '../../../../../../../components/table/types';
import { CaseProjectResourceRowType } from '../../../case-project-resource/columns';

export const getClosingRemarksColumns = (
): ListTableColumn<CaseProjectResourceRowType>[] => [
        {
            id: 'resource_name',
            sortId: 'resource_name',
            label: 'Resource Name',
            width: 180,
            sortable: true,
            // hide:
            //   !permissionMap?.['resource_name']?.read &&
            //   !permissionMap?.['resource_name']?.edit,
        },
        {
            id: 'project_code',
            sortId: 'project_code',
            label: 'Project Code',
            width: 180,
            sortable: true,
            // hide:
            //   !projectPermissionMap?.['project_code']?.read &&
            //   !projectPermissionMap?.['project_code']?.edit,
        },
        {
            id: 'project_name',
            sortId: 'project_name',
            label: 'Project Name',
            width: 200,
            sortable: true,
            // hide:
            //   !projectPermissionMap?.['project_name']?.read &&
            //   !projectPermissionMap?.['project_name']?.edit,
        },
        {
            id: 'description',
            sortId: 'description',
            label: 'Comments',
            width: 200,
            sortable: true,
            // hide:
            //   !permissionMap?.['  description']?.read &&
            //   !permissionMap?.['description']?.edit,
        },
        {
            id: 'r_number',
            sortId: 'r_number',
            label: 'Project Resource ID',
            width: 200,
            sortable: true,
            // hide:
            //   !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
        },
    ];
