import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { getGeoBasedRuleColumns, GeoBasedRuleList } from './columns';
import {
    ActionItem,
    ListTableColumn,
    ShowHideTableColumn,
} from '../../../../components/table/types';
import { EditIcon } from '../../../../assets';
import { useGeoBasedList } from '../../../service/manage-geo-based-access/geo-based-group-service';

// Placeholder route
const MANAGE_GEO_BASED_RULE = '/admin/manage-geo-based-rule';

interface IGeoBasedRuleTableProps {
    appliedFilters: any;
    tableParams: any;
    isEditable?: boolean;
    setTableParams: any;
    onSelectionChange: (selectedIds: string[]) => void;
    refreshTrigger?: number;
    columnAnchorEl: HTMLButtonElement | null;
    setColumnAnchorEl: React.Dispatch<
        React.SetStateAction<HTMLButtonElement | null>
    >;
    searchValue?: string;
}

export const ManageGeoBasedRuleTable: React.FC<IGeoBasedRuleTableProps> = ({
    appliedFilters,
    tableParams,
    isEditable,
    setTableParams,
    onSelectionChange,
    refreshTrigger,
    columnAnchorEl,
    setColumnAnchorEl,
    searchValue,
}) => {
    const navigate = useNavigate();
    const [dataList, setDataList] = useState<GeoBasedRuleList[]>([]); // Empty for now

    const { data, isLoading, isError } = useGeoBasedList(tableParams);

    console.log(data?.data.updatedConfig);
    const geoBasedRuleList = data?.data.updatedConfig;
    const totalItems = 0;
    const getRowId = (row: GeoBasedRuleList) => row.rid;

    const handleEdit = (row: GeoBasedRuleList) => {
        navigate(MANAGE_GEO_BASED_RULE + '/edit/' + row.rid);
    };

    const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
        setTableParams((prev: any) => ({
            ...prev,
            sortBy,
            sortOrder: sortOrder === 'asc' ? 'ASC' : 'DESC',
        }));
    };

    const handlePageChange = (newPage: number) => {
        setTableParams((prev: any) => ({
            ...prev,
            page: newPage + 1,
        }));
    };

    const handleRowsPerPageChange = (newLimit: number) => {
        setTableParams((prev: any) => ({
            ...prev,
            limit: newLimit,
            page: 1,
        }));
    };

    const actionButtons: ActionItem<GeoBasedRuleList>[] = [
        {
            label: 'Edit',
            onClick: (row: GeoBasedRuleList) => handleEdit(row),
            icon: EditIcon,
            iconStyle: {
                filter:
                    'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
            },
            hide: !isEditable,
        },
    ];

    const [visibleColumns, setVisibleColumns] = useState<
        ListTableColumn<GeoBasedRuleList>[]
    >(getGeoBasedRuleColumns().filter((col) => !col.hide));

    const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
        setVisibleColumns(
            updatedColumns.filter(
                (col) => !col.hide
            ) as ListTableColumn<GeoBasedRuleList>[]
        );
    };

    const handlePopoverClose = () => {
        setColumnAnchorEl(null);
    };

    const isModalOpen = Boolean(columnAnchorEl);
    const modalId = isModalOpen
        ? 'interaction-column-visibility-popover'
        : undefined;

    return (
        <>
            <ManageColumnsPopover
                anchorEl={columnAnchorEl}
                open={isModalOpen}
                popoverId={modalId}
                onClose={handlePopoverClose}
                columns={getGeoBasedRuleColumns()}
                onColumnsChange={handleColumnsChange}
                columnRestrictions={[]}
            />
            <ListTable
                data={geoBasedRuleList ?? []}
                columns={visibleColumns}
                getRowId={getRowId}
                hoverHighlight={false}
                tableStyle={{
                    height: '100%',
                    maxHeight: 'calc(100vh - 195px)',
                    overflow: 'auto',
                }}
                stickyHeader={true}
                stickyColumnsCount={1}
                selectable={false}
                onSelectionChange={onSelectionChange}
                actionWidth={60}
                actionDisplayMode='dropdown'
                actionMenuItems={actionButtons}
                loading={isLoading}

                rowsPerPageOptions={[25, 50, 100]}
                rowsPerPage={tableParams.limit}
                currentPage={(tableParams.page ?? 1) - 1}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                sortBy={tableParams.sortBy}
                sortOrder={tableParams.sortOrder}
                onSort={handleSort}
            />
        </>
    );
};
