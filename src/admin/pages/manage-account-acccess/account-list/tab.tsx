/* eslint-disable @typescript-eslint/no-explicit-any */
import { ManageAccountUserGroupTable } from '../user-group/table';
import { ManageAccountUserListTable } from '../user-list/table';
import { useSearchParams } from 'react-router-dom';
import { ManageAccountListTable } from '../project-list/table';
import { FilterType } from '../../../types';
import Users from '../../../../components/tab/user';
interface UserTabProps {
  type?: string;
  setAddedProjects: React.Dispatch<
    React.SetStateAction<{ [rid: string]: boolean }>
  >;
  appliedFilters: Record<string, FilterType>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
}

const UserTab: React.FC<UserTabProps> = ({
  type,
  setAddedProjects,
  appliedFilters,
  setAppliedFilters,
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
                  />
                ),
              },
              {
                label: 'Group',
                content: (
                  <ManageAccountUserGroupTable
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
      {accountList && (
        <div>
          <ManageAccountListTable
            type={type}
            setAddedProjects={setAddedProjects}
            appliedFilters={appliedFilters}
          />
        </div>
      )}
    </div>
  );
};

export default UserTab;
