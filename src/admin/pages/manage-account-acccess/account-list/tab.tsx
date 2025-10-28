import { useSearchParams } from 'react-router-dom';
import { ManageAccountListTable } from '../project-list/table';
import { FilterType } from '../../../types';
import Users from '../../../../components/tab/user';
import { ManageAccountUserListTable } from '../user-list/table';
import { ManageAccountUserGroupTable } from '../user-group/table';

interface UserTabProps {
  type?: string;
  setAddedProjects: React.Dispatch<
    React.SetStateAction<{ [rid: string]: boolean }>
  >;
  appliedFilters: Record<string, FilterType>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  disabled?: boolean;
  hide?: boolean;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}

const UserTab: React.FC<UserTabProps> = ({
  type,
  setAddedProjects,
  appliedFilters,
  setAppliedFilters,
  disabled,
  hide,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const [searchParams] = useSearchParams();
  const accountList = searchParams.get('accountList');

  return (
    <div>
      {!accountList && (
        <div className=''>
          <Users
            tabs={[
              {
                label: 'Users',
                content: (
                  <ManageAccountUserListTable
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                    disabled={disabled}
                    hide={hide}
                    setColumnAnchorEl={setColumnAnchorEl}
                    columnAnchorEl={columnAnchorEl}
                  />
                ),
              },
              {
                label: 'Group',
                content: (
                  <ManageAccountUserGroupTable
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                    disabled={disabled}
                    hide={hide}
                    setColumnAnchorEl={setColumnAnchorEl}
                    columnAnchorEl={columnAnchorEl}
                  />
                ),
              },
            ]}
            setAppliedFilters={setAppliedFilters}
          />
        </div>
      )}
      {accountList && (
        <div>
          <ManageAccountListTable
            type={type}
            setAddedProjects={setAddedProjects}
            appliedFilters={appliedFilters}
            disabled={disabled}
            hide={hide}
          />
        </div>
      )}
    </div>
  );
};

export default UserTab;
