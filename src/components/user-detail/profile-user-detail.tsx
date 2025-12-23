import {
  AllPermissions,
  PermissionTable,
  UserDetail,
} from '../../common-service';
import {
  applyHidePermission,
  formatDateToYYYYMMDDWithTime,
} from '../../common-utils';
import DetailsSection, { DetailItem } from '../details-section/details';
import DetailsSectionSkeleton from '../skeleton-component/detailsskeleton';
import { RootState } from '../../store/store';
import { useDispatch, useSelector } from 'react-redux';
import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListTable } from '../table';
import TextButton from '../button/text-button';
import { ExtendedPermissionColumns } from './column';
import { DetailsIcon, AvatarIcon, CameraIcon } from '../../assets';
import { useUploadProfileImage } from '../../admin/service/manage-user-detail/manage-user-detail-service';
import { useToast } from '../../hooks';
import { UpdateProfileURL } from '../../store/slices';

export const ProfileUserDetailComponent = ({
  data,
  loading,
  gotoExtendedPermission,
}: UserDetail) => {
  // Map your API data to the mock data structure
  const getValueOrDefault = (
    value?: string | number | null,
    defaultValue = '-'
  ): string => {
    return value?.toString() || defaultValue;
  };
  const { errorToast } = useToast();
  const dispatch = useDispatch();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchparams] = useSearchParams();
  const profile = searchparams.get('userView');
  const viewDetails = profile === 'profile';
  // const userFullName =
  //   `${data?.first_name || ''} ${data?.last_name || ''}`.trim();

  const { profileURL } = useSelector((state: RootState) => state.orgLogoInfo);
  const { permission } = useSelector((state: RootState) => state.permission);
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);

  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useUploadProfileImage();

  // Sync previewUrl with profileURL from Redux
  useEffect(() => {
    if (profileURL) {
      setPreviewUrl(profileURL);
    }
  }, [profileURL]);

  const transformedData = useMemo(() => {
    const menus: {
      [key: string]: {
        menu_id: string | number | undefined;
        menu_desc: string;
        modules: {
          [key: string]: {
            module_desc: string;
            permissions: string[];
            fields: string[];
            hasPermission: boolean;
          };
        };
      };
    } = {};

    data?.permissions?.forEach((item) => {
      if (item.menu_id !== undefined && !menus[item.menu_id]) {
        menus[item.menu_id] = {
          menu_id: item.menu_id,
          menu_desc: item.menu_desc || '',
          modules: {},
        };
      }

      if (item.type === 'module') {
        if (!menus[item.menu_id].modules[item.module_id]) {
          menus[item.menu_id].modules[item.module_id] = {
            module_desc: item.module_desc || item.module_name || '',
            permissions: [],
            fields: [],
            hasPermission: false,
          };
        }
      }

      if (item.type === 'permission') {
        if (!menus[item.menu_id].modules[item.module_id]) {
          menus[item.menu_id].modules[item.module_id] = {
            module_desc: item.module_desc || '',
            permissions: [],
            fields: [],
            hasPermission: false,
          };
        }

        const moduleGroup = menus[item.menu_id].modules[item.module_id];
        moduleGroup.hasPermission = true;
        moduleGroup.permissions.push(item.permission_desc);

        if (item.is_field_available && item.fields?.length) {
          moduleGroup.fields.push(...item.fields.map((f) => f.field_desc));
        }
      }
    });

    const output: PermissionTable[] = [];
    Object.values(menus).forEach((menu) => {
      const moduleValues = Object.values(menu.modules);

      if (moduleValues.length === 0) {
        output.push({
          rid: String(output.length + 1),
          menu: menu.menu_desc,
          modules: '',
          permissions: '',
          fields: '',
        });
      } else {
        moduleValues.forEach((module) => {
          if (!module.hasPermission) {
            output.push({
              rid: String(output.length + 1),
              menu: menu.menu_desc,
              modules: module.module_desc,
              permissions: '',
              fields: '',
            });
          } else {
            output.push({
              rid: String(output.length + 1),
              menu: menu.menu_desc,
              modules: module.module_desc,
              permissions: module.permissions.join(', '),
              fields: module.fields.join(', '),
            });
          }
        });
      }
    });

    return output;
  }, [data]);

  const identityInfo: DetailItem[] = [
    {
      key: 'first_name',
      label: 'First Name',
      value: getValueOrDefault(data?.first_name) || '-',
    },

    {
      key: 'last_name',
      label: 'Last Name',
      value: getValueOrDefault(data?.last_name) || '-',
    },
    {
      key: 'email',
      label: 'Email address',
      value: getValueOrDefault(data?.email) || '-',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      value: getValueOrDefault(data?.phone) || '-',
    },
    {
      key: 'is_consultant_firm',
      label: 'Is Consultant Firm',
      value: getValueOrDefault(data?.is_consultant_firm ? 'Yes' : 'No') || '-',
    },
    {
      key: 'org_rid',
      label: 'Business Name',
      value: getValueOrDefault(data?.org_name) || '-',
    },
  ];

  const addressInfo: DetailItem[] = [
    { key: 'street', label: 'Street', value: getValueOrDefault(data?.street) },
    {
      key: 'country_rid',
      label: 'Country',
      value: getValueOrDefault(data?.country_name),
    },
    {
      key: 'state_rid',
      label: 'Region',
      value: getValueOrDefault(data?.state_name),
    },
    {
      key: 'city_rid',
      label: 'City',
      value: getValueOrDefault(data?.city_name),
    },
    {
      key: 'zip_code',
      label: 'Zip Code / Area Code',
      value: getValueOrDefault(data?.zip_code),
    },
  ];

  const accessInfo: DetailItem[] = [
    {
      key: 'profile_rid',
      label: 'Profile',
      value: getValueOrDefault(data?.profile?.profile_name),
    },
    {
      key: 'business_teams',
      label: 'Role',
      value: getValueOrDefault(data?.business_teams?.business_teams),
    },
    {
      key: 'state_rid',
      label: 'Status',
      value: data?.status?.status_name,
    },
  ];

  const auditInfo: DetailItem[] = [
    {
      key: 'rid',
      label: 'Record ID',
      value: getValueOrDefault(data?.rid),
    },
    {
      key: 'r_number',
      label: 'User ID',
      value: getValueOrDefault(data?.r_number),
    },
    {
      key: 'created_datetime',
      label: 'Created On',
      value: formatDateToYYYYMMDDWithTime(data?.created_datetime) || '-',
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: data?.created_by,
    },
    {
      key: 'modified_datetime',
      label: 'Updated On',
      value: formatDateToYYYYMMDDWithTime(data?.modified_datetime) || '-',
    },
    {
      key: 'modified_by',
      label: 'Updated By',
      value: data?.modified_by,
    },
  ];

  const ProfileIdentitySkeleton = () => {
    return (
      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] p-4'>
        <div className='flex items-center'>
          {/* Profile Picture Skeleton */}
          <div className='flex flex-col items-center gap-3 min-w-[12%] max-w-[12%] animate-pulse'>
            <div className='w-[120px] h-[120px] rounded-full bg-gray-300' />

            {/* <div className='text-center space-y-2 mt-2 flex flex-col items-center'>
              <div className='h-3 w-24 bg-gray-300 rounded' />
              <div className='h-3 w-32 bg-gray-300 rounded' />
            </div> */}
          </div>

          {/* Identity Details Skeleton */}
          <div className='flex-1'>
            <DetailsSectionSkeleton
              rows={6} // number of identity fields
              fullColumn={false}
              isAudit={false}
              sectionCount={1} // only identity section
              className='p-0 m-0'
              noHeader={true}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (optional, e.g., limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        errorToast('File size should be less than 5MB');
        return;
      }

      // Check file type (allow only images)
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        errorToast('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file to API
      await uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profile', file);

      await uploadImage(formData, {
        onSuccess: (response) => {
          if (response.statusCode === 200 && response.data?.profile_url) {
            const newProfileUrl = response.data.profile_url;
            // Update Redux - useEffect will automatically sync previewUrl
            dispatch(UpdateProfileURL(newProfileUrl));
          } else {
            throw new Error(response.statusMessage || 'Upload failed');
          }
        },
        onError: () => {
          errorToast('Failed to upload profile picture. Please try again.');
          // Revert preview on error - useEffect will sync with Redux profileURL
          setPreviewUrl(profileURL || null);
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      errorToast('An error occurred while uploading. Please try again.');
      // Revert preview on error - useEffect will sync with Redux profileURL
      setPreviewUrl(profileURL || null);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('profile-picture-input');
    fileInput?.click();
  };

  const IdentityDetails = applyHidePermission(identityInfo, permissionMap);
  const AddressDetails = applyHidePermission(addressInfo, permissionMap);
  const AccessDetails = applyHidePermission(accessInfo, permissionMap);
  const AuditDetails = applyHidePermission(auditInfo, permissionMap);

  return (
    <div>
      {loading ? (
        <ProfileIdentitySkeleton />
      ) : (
        <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px] p-4'>
          <div className='flex items-center'>
            {/* Profile Picture Section */}
            <div className='flex flex-col items-center gap-3 min-w-[12%] max-w-[12%]'>
              <div className='relative group'>
                <div className='w-[120px] h-[120px] rounded-full overflow-hidden bg-gray-100 border border-[#CBD6E2]'>
                  {previewUrl || profileURL ? (
                    <img
                      src={previewUrl || profileURL || ''}
                      alt='Profile'
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove(
                          'hidden'
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${previewUrl || profileURL ? 'hidden' : ''}`}
                  >
                    <React.Suspense fallback={null}>
                      <AvatarIcon className='w-16 h-16' />
                    </React.Suspense>
                  </div>
                </div>

                {/* Upload Overlay */}
                {/* <div
                  className='absolute inset-0 bg-gray-100 bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                  onClick={triggerFileInput}
                >
                  <div className='flex flex-col items-center'>
                    <CameraIcon className='w-6 h-6 text-white mb-1' />
                    <span className='text-white text-xs'>Upload</span>
                  </div>
                </div> */}

                {/* Upload Loading Overlay */}
                {isUploadingImage && (
                  <div className='absolute inset-0 bg-black/30 flex items-center justify-center rounded-full'>
                    <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  </div>
                )}

                {/* Upload Icon Button (visible on mobile/touch) */}
                <button
                  onClick={triggerFileInput}
                  disabled={isUploadingImage}
                  className='absolute bottom-0.5 right-1 w-9 h-9 bg-gray-200 border border-[#CBD6E2] cursor-pointer rounded-full flex items-center justify-center shadow-lg hover:bg-blue-100 transition-colors  disabled:cursor-default disabled:hover:bg-gray-200'
                  aria-label='Upload profile picture'
                >
                  <React.Suspense fallback={null}>
                    <CameraIcon className='w-4 h-4 [&>path]:fill-[#2D3E4F]' />
                  </React.Suspense>
                </button>
              </div>

              <input
                type='file'
                id='profile-picture-input'
                accept='image/*'
                className='hidden'
                onChange={handleFileSelect}
              />

              {/* <div className='text-center w-[100%]'>
                <p className='text-sm font-semibold text-[#2D3E4F]'>
                  <TruncateWithTooltip maxWidth={'100%'}>
                    {data?.full_name ?? userFullName}
                  </TruncateWithTooltip>
                </p>
                <p className='text-xs text-[#7D98B6] mt-1'>
                  <TruncateWithTooltip maxWidth={'100%'}>
                    {data?.email || ''}
                  </TruncateWithTooltip>
                </p>
              </div> */}
            </div>

            {/* User Details (Identity Info) */}
            <DetailsSection
              title=''
              data={viewDetails ? identityInfo : IdentityDetails}
              customStyle='pt-0 mt-0'
            />
          </div>
        </div>
      )}

      <div className='flex flex-col gap-0 mt-3 border border-[#CBD6E2] rounded-[2px]'>
        <div className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
          <div className='flex items-center gap-2'>
            <div className='w-[24px] h-[24px] flex items-center justify-center rounded-full bg-[#D7E5FF]'>
              <React.Suspense fallback={null}>
                <DetailsIcon
                  alt='details'
                  className='[&>path]:stroke-[#294F98] w-[14px] h-[14px]'
                />
              </React.Suspense>
            </div>
            <div className='text-[13px] text-[#2D3E4F] font-semibold'>
              Details
            </div>
          </div>
        </div>
        {loading ? (
          <DetailsSectionSkeleton />
        ) : (
          <div>
            <DetailsSection
              title='Access & Role'
              data={viewDetails ? accessInfo : AccessDetails}
              customStyle='pt-0 mt-0'
            />
            <DetailsSection
              title='Address'
              data={viewDetails ? addressInfo : AddressDetails}
            />
            <div className='pt-2 mt-3'>
              <div className='flex items-center justify-between align-middle px-3 h-[30px] border-t border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC] '>
                <span>Extended Permissions</span>
                <TextButton
                  label='Edit'
                  onClick={gotoExtendedPermission}
                  sx={{
                    width: '50px',
                    minWidth: '50px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
              </div>
              <div className='text-sm p-3 grid gap-y-3'>
                <div className='w-full border-t border-l border-solid border-[#CBD6E2]'>
                  <ListTable
                    data={transformedData}
                    columns={ExtendedPermissionColumns()}
                    getRowId={(row: PermissionTable) => row.rid}
                    hoverHighlight={false}
                    tableStyle={{
                      height: '100%',
                      maxHeight: 'calc(100vh - 195px)',
                      overflow: 'auto',
                    }}
                    selectable={false}
                    stickyHeader
                    actionWidth={60}
                    showEmptyRow={false}
                  />
                </div>
              </div>
            </div>
            <DetailsSection
              title='Audit Information'
              data={viewDetails ? auditInfo : AuditDetails}
              isAudit={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
