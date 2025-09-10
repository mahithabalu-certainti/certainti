/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { UPDATE_RESOURCE_COST } from '../../../../../../api/graphql/queries/resource-query';
import { ResourceCostList } from '../../../../../types/resource-cost';
import {
  useResourceCost,
  useUpdateCostAccept,
} from '../../../../../services/resource-cost/resource-cost-service';
import {
  FieldChangeEvent,
  FieldChangeValue,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { resourceClient } from '../../../../../../api/graphql/clients/client';
import { RESOURCECOST } from '../../../../../../routes';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { getResourceCostColumns } from './columns';
import { convertResourceCost } from './resource-cost-type';
import { AcceptIcon, RejectIcon } from '../../../../../../assets';
import { useToast } from '../../../../../../hooks';
import { useFetchCurrency } from '../../../../../services/account';
import { CellEditData } from '../../../../../../components/table/types';
import { ResourceTypeEnum } from '../../../../resource-form/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../store/store';
import { AllPermissions } from '../../../../../../common-service';
import Uploads from '../../../../../../components/Attachments/upload';
import ConfirmationPopup from '../../../../../../common-utils/confirmation-popup.tsx';
import {
  checkPermission,
  getFiscalDateBounds,
} from '../../../../../../common-utils/common-utils.ts';
import { FormFiscalDateType } from '../../../../../types/account.ts';

interface ResourceCostTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  accountDetails?: Record<string, any>;
  resourceRid: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  costOrder: 'asc' | 'desc';
  setCostOrder: (costOrder: 'asc' | 'desc') => void;
  costorderBy: string;
  setCostorderBy: (field: keyof ResourceCostList) => void;
  isResourceCostDeleteEnable?: boolean;
  isResourceCostEditEnable?: boolean;
  refreshCostTrigger?: number;
  setCount?: (count: number) => void;
  resourceType: ResourceTypeEnum;
  resourceInActive?: boolean;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

const ResourceCostTable: React.FC<ResourceCostTableProps> = ({
  fiscalYear,
  appliedFilters,
  accountDetails,
  resourceRid,
  currentPage,
  setCurrentPage,
  costOrder,
  setCostOrder,
  costorderBy,
  setCostorderBy,
  isResourceCostEditEnable,
  refreshCostTrigger,
  setCount,
  resourceType,
  resourceInActive,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const navigate = useNavigate();
  const { accountid } = useParams();
  const { successToast, errorToast } = useToast();
  const [resourceCostList, setResourceCostList] = useState<ResourceCostList[]>(
    []
  );
  const [updateResourceCost] = useMutation(UPDATE_RESOURCE_COST, {
    client: resourceClient,
  });
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [searchParams] = useSearchParams();
  const accountInActive =
    accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
    'active';
  const apiOrder = costOrder.toUpperCase() as 'ASC' | 'DESC';
  const { permission } = useSelector((state: RootState) => state.permission);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [fiscalDate, setFiscalDate] = useState<FormFiscalDateType>({
    year: 0,
  });

  const account = accountDetails?.data?.accountDetails;
  const accountFiscalDates = {
    startDate: account?.fiscal_start_date || '',
    endDate: account?.fiscal_end_date || '',
  };

  const {
    data: costList,
    isLoading,
    error,
    refetch,
  } = useResourceCost(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: costorderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      fiscalYear,
      resourceRid,
    },
    undefined,
    refreshCostTrigger
  );

  useEffect(() => {
    if (setCount) {
      setCount(costList?.count || 0);
    }
  }, [costList, setCount]);

  useEffect(() => {
    if (costList?.resourceCost) {
      setResourceCostList(costList.resourceCost);
    }
  }, [costList]);

  const currency = useFetchCurrency();

  const memoizedCurrency = useMemo(
    () =>
      currency.data?.data.currency.map((account) => ({
        label: account.currency_code,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  // Permissions
  const costViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCE_COST_EDIT_VIEW
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    costViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [costViewEditFields]);

  const attachmentCreateEnable = checkPermission(
    permission || [],
    AllPermissions.ATTACHMENT_CREATE
  );

  const handleEdit = (cost: ResourceCostList) => {
    const data = convertResourceCost(cost);
    navigate(RESOURCECOST + '/edit/' + cost.r_number, {
      state: { ...accountDetails, costInfo: data, cost: true },
    });
  };

  const updateStatusAccept = useUpdateCostAccept();

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    setCostOrder(sortOrder);
    setCostorderBy(property as keyof ResourceCostList);
  };

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: handleEdit,
      disabled: accountInActive,
      hide: !isResourceCostEditEnable,
    },
    {
      label: 'Delete',
      onClick: () => console.log('Delete'),
      disabled: accountInActive,
      hide: true,
    },
  ];

  const handleAccept = (row: ResourceCostList) => {
    const payload = {
      rid: row?.rid,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      action: 'accept',
      type: row?.status_name,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };

  const handleReject = (row: ResourceCostList) => {
    const payload = {
      rid: row?.rid,
      accountNumber: accountDetails?.data?.accountById?.r_number,
      action: 'reject',
      type: row?.status_name,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };

  const getConditionMenuItems = (row: ResourceCostList) => {
    let statusLabel = '';
    switch (row.status_name) {
      case 'Duplicate':
        statusLabel = 'Duplicate';
        break;
      case 'Anomaly':
        statusLabel = 'Anomaly';
        break;
      default:
        return [];
    }

    return [
      {
        label: statusLabel ? `Accept ${statusLabel}` : 'Accept',
        onClick: handleAccept,
        icon: AcceptIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#3EA72F1A] hover:bg-[#3EA72F] hover:text-[#fff]',
      },
      {
        label: statusLabel ? `Reject ${statusLabel}` : 'Reject',
        onClick: handleReject,
        icon: RejectIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#FF3C031A] hover:bg-[#FF3C03] hover:text-[#fff]',
      },
    ];
  };

  const isFullTime = resourceType?.toLowerCase() === ResourceTypeEnum.FULL_TIME;

  const showUploads = searchParams.get('attachment_entity') === 'resource_cost';

  const handleAttachmentClick = (rowId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'resource_cost');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
    setSelectedRowId(rowId);
  };

  const handleFieldChange = async (event: FieldChangeEvent) => {
    if (event.columnId === 'fiscal_year' && event.value) {
      handleGetFiscalYear(String(event.value));
    }
  };

  const handleGetFiscalYear = (year: string) => {
    const bounds = getFiscalDateBounds(year, accountFiscalDates);
    setFiscalDate(bounds);
  };

  const getRowId = (row: ResourceCostList) => row?.rid || '';

  const resourceCostColumns = getResourceCostColumns(
    memoizedCurrency,
    isFullTime,
    permissionMap,
    accountInActive,
    handleAttachmentClick,
    resourceInActive,
    attachmentCreateEnable,
    handleGetFiscalYear,
    fiscalDate
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousCostList = [...resourceCostList];

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (cost, item) => {
        const key = item.editId || item.columnId;
        cost[key] = item.value;
        return cost;
      },
      {
        resource_cost_rid: rowId,
        account_rid: accountDetails?.data?.accountById?.rid,
        resource_rid: resourceRid,
      }
    );

    try {
      const res = await updateResourceCost({
        variables: { data: updateData },
      });

      const result = res.data?.updateResourceCostInline;
      if (result?.statusCode === 200 && result.data) {
        const updatedResourceCost = result.data;
        setResourceCostList((prevCost) =>
          prevCost.map((cost) =>
            cost.rid === updatedResourceCost.rid ? updatedResourceCost : cost
          )
        );
        successToast('Resource cost updated successfully');
      } else if (result?.statusCode === 210) {
        setConfirmationState({
          isOpen: true,
          message:
            result?.statusMessage ||
            'Compensation details already exist for the resource',
          onConfirm: async () => {
            try {
              const updatedPayload = {
                ...updateData,
                user_preference: 'accept',
              };
              const confirmRes = await updateResourceCost({
                variables: { data: updatedPayload },
              });
              const confirmResult = confirmRes.data?.updateResourceCostInline;
              if (confirmResult?.statusCode === 200 && confirmResult.data) {
                const updatedResourceCost = confirmResult.data;
                setResourceCostList((prevCost) =>
                  prevCost.map((cost) =>
                    cost.rid === updatedResourceCost.rid
                      ? updatedResourceCost
                      : cost
                  )
                );
                successToast('Resource cost updated successfully');
              } else {
                errorToast(
                  confirmResult?.statusMessage ||
                    'Failed to update resource cost'
                );
                setResourceCostList(previousCostList);
              }
            } catch (error) {
              errorToast(
                (error as Error)?.message || 'Failed to update resource cost'
              );
              setResourceCostList(previousCostList);
            } finally {
              setConfirmationState((prev) => ({
                ...prev,
                isOpen: false,
                message: '',
              }));
            }
          },
        });
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
        setResourceCostList(previousCostList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setResourceCostList(previousCostList);
    }
  };

  const hideStatusAction =
    !permissionMap?.['status_action']?.edit &&
    !permissionMap?.['status_action']?.read;

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ResourceCostList>[]
  >(resourceCostColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ResourceCostList>[]
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
    <div>
      {showUploads ? (
        <Uploads accountId={accountid} attachID={selectedRowId} />
      ) : (
        <>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={resourceCostColumns}
            onColumnsChange={handleColumnsChange}
            // columnRestrictions={RestrictedColumns}
          />
          <ListTable
            data={resourceCostList}
            columns={visibleColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              borderBottom: '1px solid #CBD6E2',
              height: '100%',
              maxHeight: 'calc(100vh - 410px)',
              overflow: 'auto',
            }}
            stickyHeader={true}
            stickyColumnsCount={1}
            selectable={false}
            actionWidth={80}
            actionDisplayMode='dropdown'
            actionMenuItems={actionMenuItems}
            conditionMenuItems={
              !hideStatusAction
                ? (row: ResourceCostList) => getConditionMenuItems(row)
                : undefined
            }
            loading={isLoading}
            error={error ? 'Failed to load resource cost data' : undefined}
            rowsPerPageOptions={[25, 50, 100]}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={costList?.count ?? 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sortBy={costorderBy}
            sortOrder={costOrder.toUpperCase() as 'ASC' | 'DESC'}
            onSort={handleSortRequest}
            onCellEdit={handleCellEdit}
            onFieldChange={handleFieldChange}
          />
        </>
      )}
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
        }}
        onCancel={() => {
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            message: '',
          }));
        }}
      />
    </div>
  );
};

export default ResourceCostTable;
