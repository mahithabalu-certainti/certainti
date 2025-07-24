/* eslint-disable @typescript-eslint/no-explicit-any */
// import { ManageAccountUserGroupTable } from '../user-group/table';
// import { ManageAccountUserListTable } from '../user-list/table';
import { useSearchParams } from 'react-router-dom';
import { ManageAccountListTable } from '../project-list/table';
// import Users from '../../../../consultant/pages/account-details-sidebar/sidebar-pages/configuration/users/users';
interface UserTabProps {
  type?: string;
  setAddedProjects: React.Dispatch<
    React.SetStateAction<{ [rid: string]: boolean }>
  >;
}

const UserTab: React.FC<UserTabProps> = ({ type, setAddedProjects }) => {
  const [searchParams] = useSearchParams();
  const accountList = searchParams.get('accountList');

  return (
    <div>
      {!accountList && (
        <div className=''>
          {/* <Users
            tabs={[
              {
                label: 'Users',
                content: <ManageAccountUserListTable />,
              },
              {
                label: 'Group',
                content: <ManageAccountUserGroupTable />,
              },
            ]}
          /> */}
        </div>
      )}
      {accountList && (
        <div>
          <ManageAccountListTable
            type={type}
            setAddedProjects={setAddedProjects}
          />
        </div>
      )}
    </div>
  );
};

export default UserTab;
