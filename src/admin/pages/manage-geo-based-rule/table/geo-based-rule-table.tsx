import React, { useEffect, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { getGeoBasedRuleColumns } from './columns';
import {
    ActionItem,
    CellEditData,
    FieldChangeValue,
    ListTableColumn,
    ShowHideTableColumn,
} from '../../../../components/table/types';
import { EditIcon } from '../../../../assets';
import { useGeoBasedList } from '../../../service/manage-geo-based-access/geo-based-group-service';
import {
    GeoBasedRule,
    GeoBasedRuleListParams,
} from '../../../types/geo-based-rule';
import { MANAGE_GEO_BASED_RULE_EDIT } from '../../../../routes';
import { useToast } from '../../../../hooks';
import { GEO_BASED_RULE } from '../../../../api/graphql/queries/geo-based-rule-query';
import { useMutation } from '@apollo/client';
import { caseClient } from '../../../../api/graphql/clients/client';


interface IGeoBasedRuleTableProps {
    appliedFilters: any;
    tableParams: GeoBasedRuleListParams;
    isEditable?: boolean;
    setTableParams: React.Dispatch<React.SetStateAction<GeoBasedRuleListParams>>;
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
    //   searchValue,
}) => {
    const { errorToast } = useToast();
    const navigate = useNavigate();
    const [geoBasedRuleList, setGeoBasedRuleList] = useState<GeoBasedRule[]>([]);

    const [updateGeoBasedRule] = useMutation(GEO_BASED_RULE, {
        client: caseClient,
    });

    const { data, isLoading, isError } = useGeoBasedList(
        { ...tableParams, filters: appliedFilters },
        refreshTrigger
    );
    const totalItems = data?.data.count || 0;

    useEffect(() => {
        if (data?.data.configs) {
            setGeoBasedRuleList(data?.data.configs || []);
        }
    }, [data?.data.configs]);
    const getRowId = (row: GeoBasedRule) => row.rid;
    const handleEdit = (row: GeoBasedRule) => {
        const path = generatePath(MANAGE_GEO_BASED_RULE_EDIT, {
            ruleId: row.rid,
            config_rid: row.credit_config_group_rid,
        });
        navigate(path);
    };

    const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
        setTableParams((prev: GeoBasedRuleListParams) => ({
            ...prev,
            sortBy,
            sortOrder: sortOrder === 'asc' ? 'ASC' : 'DESC',
        }));
    };

    const handlePageChange = (newPage: number) => {
        setTableParams((prev: GeoBasedRuleListParams) => ({
            ...prev,
            page: newPage + 1,
        }));
    };

    const handleRowsPerPageChange = (newLimit: number) => {
        setTableParams((prev: GeoBasedRuleListParams) => ({
            ...prev,
            limit: newLimit,
            page: 1,
        }));
    };

    const actionButtons: ActionItem<GeoBasedRule>[] = [
        {
            label: 'Edit',
            onClick: (row: GeoBasedRule) => handleEdit(row),
            icon: EditIcon,
            iconStyle: {
                filter:
                    'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
            },
            hide: !isEditable,
        },
    ];

    const [visibleColumns, setVisibleColumns] = useState<
        ListTableColumn<GeoBasedRule>[]
    >(getGeoBasedRuleColumns().filter((col) => !col.hide));

    const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
        setVisibleColumns(
            updatedColumns.filter(
                (col) => !col.hide
            ) as ListTableColumn<GeoBasedRule>[]
        );
    };

    const handlePopoverClose = () => {
        setColumnAnchorEl(null);
    };

    const isModalOpen = Boolean(columnAnchorEl);
    const modalId = isModalOpen
        ? 'interaction-column-visibility-popover'
        : undefined;

    const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
        const previousGeoBasedRuleList = [...geoBasedRuleList];

        const matchedRule = geoBasedRuleList.find((rule) => rule.rid === rowId);
        if (!matchedRule) {
            return;
        }

        // Build update data with both effective dates
        const updateData = updates.reduce<Record<string, FieldChangeValue>>(
            (acc, item) => {
                const key = item.editId || item.columnId;
                acc[key] = item.value;
                return acc;
            },
            {
                config_rid: rowId,
                // Always include both effective dates and federal status
                effective_start_date: matchedRule.effective_start_date,
                effective_end_date: matchedRule.effective_end_date,
                is_federal: matchedRule.is_federal,
            }
        );

        // Override with the updated value(s)
        updates.forEach((update) => {
            const key = update.editId || update.columnId;
            updateData[key] = update.value;
        });

        try {
            const res = await updateGeoBasedRule({
                variables: { input: updateData },
            });
            const result = res.data?.updateJurisdictionConfig;

            if (result?.statusCode === 200 && result.data) {
                const updatedItem = result.data;
                setGeoBasedRuleList((prev) =>
                    prev.map((item) =>
                        item.rid === updatedItem.rid ? { ...item, ...updatedItem } : item
                    )
                );
            } else {
                errorToast(result?.message || result?.errorMessage || 'Failed to update field');
                setGeoBasedRuleList(previousGeoBasedRuleList);
            }
        } catch (error) {
            errorToast((error as Error)?.message || 'Failed to update field');
            setGeoBasedRuleList(previousGeoBasedRuleList);
        }
    };

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
                error={isError ? 'failed to load data' : undefined}
                rowsPerPageOptions={[25, 50, 100]}
                rowsPerPage={tableParams.limit}
                currentPage={(tableParams.page ?? 1) - 1}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                sortBy={tableParams.sortBy}
                sortOrder={tableParams.sortOrder}
                onSort={handleSort}
                onCellEdit={handleCellEdit}
            />
        </>
    );
};
