import React, { useEffect, useRef, useState } from 'react';
import {
  menuArrowRight,
  menuArrowRightHover,
  moduleArrowright,
  checkboxChecked,
  checkboxUnchecked,
} from '../../../../assets/icons';
import ConfirmationPopup from '../../../../common-utils/confirmation-popup';
import { Privilege } from '../../../types';

type BasePrivilege = {
  rid: string;
  type: string;
  name: string;
  desc: string;
  is_modified?: boolean;
};

type MenuPrivilege = BasePrivilege & {
  type: 'menu';
  menu_id: string;
  is_enabled: boolean;
  has_extended_permission?: boolean;
};

type ModulePrivilege = BasePrivilege & {
  type: 'module';
  module_id: string;
  menu_id: string;
  is_enabled: boolean;
  has_extended_permission?: boolean;
};

type PermissionPrivilege = BasePrivilege & {
  type: 'permission';
  permission_id: string;
  module_id: string;
  is_field_available: boolean;
  is_enabled: boolean;
  has_extended_permission?: boolean;
};

type FieldPrivilege = BasePrivilege & {
  type: 'field';
  field_id: string;
  permission_id: string;
  read: boolean;
  edit: boolean;
  hasReadExtendedPermsission?: boolean;
  hasEditExtendedPermsission?: boolean;
};

// type Privilege = MenuPrivilege | ModulePrivilege | PermissionPrivilege | FieldPrivilege;

interface ProfileModuleListProps {
  createProfilePermissionsData?: Privilege[];
  onPrivilegesChange: (updatedPrivileges: Privilege[]) => void;
  viewProfileDisabled?: boolean;
}

interface GroupedPrivileges {
  menu: MenuPrivilege;
  modules: {
    module: ModulePrivilege; // Change from Privilege to ModulePrivilege
    permissions: Array<PermissionPrivilege & { fields?: FieldPrivilege[] }>;
  }[];
}

// Remove the unused top-level isField function
const CustomCheckbox: React.FC<{
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <div
    className={`cursor-${disabled ? 'not-allowed' : 'pointer'} ${disabled ? 'opacity-50' : ''}`}
    onClick={(e) => !disabled && onChange(e)}
  >
    <img
      src={checked ? checkboxChecked : checkboxUnchecked}
      alt={checked ? 'checked' : 'unchecked'}
      className='h-6 w-6'
    />
  </div>
);

const PrivilegeAccordion: React.FC<{
  groupedPrivilege: GroupedPrivileges;
  onPrivilegesChange: (privileges: Privilege[]) => void;
  viewProfileDisabled?: boolean;
}> = ({ groupedPrivilege, onPrivilegesChange, viewProfileDisabled }) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedPermissions, setExpandedPermissions] = useState<string[]>([]);
  const [privileges, setPrivileges] =
    useState<GroupedPrivileges>(groupedPrivilege);

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getFlattenedPrivileges = (
    groupedPrivs: GroupedPrivileges
  ): Privilege[] => {
    const result: Privilege[] = [];

    // Add menu
    const menuPrivilege: MenuPrivilege = {
      rid: groupedPrivs.menu.rid,
      type: 'menu',
      menu_id: groupedPrivs.menu.menu_id,
      name: groupedPrivs.menu.name,
      desc: groupedPrivs.menu.desc,
      is_enabled: groupedPrivs.menu.is_enabled,
      is_modified: true,
      has_extended_permission: groupedPrivs.menu.has_extended_permission,
    };
    result.push(menuPrivilege);

    // Add modules
    groupedPrivs.modules.forEach(({ module, permissions }) => {
      // Change this type check to match ModulePrivilege
      const modulePrivilege: ModulePrivilege = {
        rid: module.rid,
        type: 'module',
        module_id: module.module_id,
        menu_id: module.menu_id,
        name: module.name,
        desc: module.desc,
        is_enabled: module.is_enabled,
        is_modified: true,
        has_extended_permission: module.has_extended_permission,
      };
      result.push(modulePrivilege);

      // Add permissions
      permissions.forEach((perm) => {
        const permPrivilege: PermissionPrivilege = {
          rid: perm.rid,
          type: 'permission',
          permission_id: perm.permission_id,
          module_id: module.module_id,
          name: perm.name,
          desc: perm.desc,
          is_enabled: perm.is_enabled,
          is_field_available: perm.is_field_available,
          is_modified: true,
          has_extended_permission: perm.has_extended_permission,
        };
        result.push(permPrivilege);

        // Add fields as separate objects at the same level
        perm.fields?.forEach((field) => {
          const fieldPrivilege: FieldPrivilege = {
            rid: field.rid,
            type: 'field',
            field_id: field.field_id,
            permission_id: perm.permission_id,
            name: field.name,
            desc: field.desc,
            read: field.read,
            edit: field.edit,
            is_modified: true,
            hasReadExtendedPermsission: field.hasReadExtendedPermsission,
            hasEditExtendedPermsission: field.hasEditExtendedPermsission,
          };
          result.push(fieldPrivilege);
        });
      });
    });

    return result;
  };

  // Add useEffect to notify parent of changes
  // Memoize the flattened privileges to prevent unnecessary recalculations
  const flattenedPrivileges = React.useMemo(() => {
    return getFlattenedPrivileges(privileges);
  }, [privileges]);
  // Update the useEffect to use the memoized value and add proper dependency tracking
  const previousFlattened = useRef<string | null>(null);

  useEffect(() => {
    const current = JSON.stringify(flattenedPrivileges);
    if (previousFlattened.current !== current) {
      previousFlattened.current = current;
      onPrivilegesChange(flattenedPrivileges);
    }
  }, [flattenedPrivileges, onPrivilegesChange]);

  // Update all handlers to include is_modified flag
  const handleMenuCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMenuState = !privileges.menu.is_enabled;

    if (!newMenuState) {
      // Expand all children before showing popup
      setIsMenuExpanded(true);
      setExpandedModules(privileges.modules.map((mod) => mod.module.module_id));
      const allPermissionIds = privileges.modules.flatMap((mod) =>
        mod.permissions
          .filter((p) => p.is_field_available)
          .map((p) => p.permission_id)
      );
      setExpandedPermissions(allPermissionIds);

      setConfirmationState({
        isOpen: true,
        message:
          'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
        onConfirm: () => {
          updatePrivilegesState(newMenuState);
        },
      });
    } else {
      updatePrivilegesState(newMenuState);
    }
  };

  const updatePrivilegesState = (newMenuState: boolean) => {
    setPrivileges((prev) => ({
      ...prev,
      menu: {
        ...prev.menu,
        is_enabled: newMenuState,
        is_modified: true, // Ensure menu is marked as modified
      },
      modules: prev.modules.map((mod) => ({
        ...mod,
        module: {
          ...mod.module,
          is_enabled: newMenuState,
          is_modified: true, // Mark module as modified
        },
        permissions: mod.permissions.map((perm) => ({
          ...perm,
          is_enabled: newMenuState,
          is_modified: true, // Mark permission as modified
          fields: perm.fields?.map((field) => ({
            ...field,
            read: newMenuState ? field.read : false,
            edit: newMenuState ? field.edit : false,
            is_modified: true, // Mark field as modified
          })),
        })),
      })),
    }));
  };

  // const handleModuleCheck = (moduleId: string) => (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   const currentModule = privileges.modules.find(
  //     (mod) => mod.module.module_id === moduleId
  //   );
  //   const newState = !currentModule?.module.is_enabled;

  //   {
  //     /*  popup-confirmation */
  //   }
  //   if (!newState) {
  //     setConfirmationState({
  //       isOpen: true,
  //       message:
  //         'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
  //       onConfirm: () => {
  //         setPrivileges((prev) => ({
  //           ...prev,
  //           modules: prev.modules.map((mod) => {
  //             if (mod.module.module_id === moduleId) {
  //               const newState = !mod.module.is_enabled;
  //               return {
  //                 ...mod,
  //                 module: {
  //                   ...mod.module,
  //                   is_enabled: newState,
  //                   is_modified: true, // This module was changed
  //                 },
  //                 permissions: mod.permissions.map((perm) => ({
  //                   ...perm,
  //                   is_enabled: newState,
  //                   is_modified: true, // These permissions were affected
  //                   fields: perm.fields?.map((field) => ({
  //                     ...field,
  //                     read: newState ? field.read : false,
  //                     edit: newState ? field.edit : false,
  //                     is_modified: true, // These fields were affected
  //                   })),
  //                 })),
  //               };
  //             }
  //             return mod;
  //           }),
  //         }));
  //         setConfirmationState((prev) => ({ ...prev, isOpen: false }));
  //       },
  //     });
  //     return;
  //   }
  //   {
  //     /*  popup-confirmation End */
  //   }
  //   setPrivileges((prev) => ({
  //     ...prev,
  //     modules: prev.modules.map((mod) => {
  //       if (mod.module.module_id === moduleId) {
  //         const newState = !mod.module.is_enabled;
  //         return {
  //           ...mod,
  //           module: {
  //             ...mod.module,
  //             is_enabled: newState,
  //             is_modified: true, // This module was changed
  //           },
  //           permissions: mod.permissions.map((perm) => ({
  //             ...perm,
  //             is_enabled: newState,
  //             is_modified: true, // These permissions were affected
  //             fields: perm.fields?.map((field) => ({
  //               ...field,
  //               read: newState ? field.read : false,
  //               edit: newState ? field.edit : false,
  //               is_modified: true, // These fields were affected
  //             })),
  //           })),
  //         };
  //       }
  //       return mod;
  //     }),
  //   }));
  // };
  const handleModuleCheck = (moduleId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentModule = privileges.modules.find(
      (mod) => mod.module.module_id === moduleId
    );
    const newState = !currentModule?.module.is_enabled;

    if (!newState) {
      // Expand current module and its permissions
      setExpandedModules((prev) =>
        prev.includes(moduleId) ? prev : [...prev, moduleId]
      );

      const permissionIds =
        currentModule?.permissions
          .filter((p) => p.is_field_available)
          .map((p) => p.permission_id) || [];

      setExpandedPermissions((prev) => [
        ...new Set([...prev, ...permissionIds]),
      ]);

      setConfirmationState({
        isOpen: true,
        message:
          'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
        onConfirm: () => {
          setPrivileges((prev) => ({
            ...prev,
            modules: prev.modules.map((mod) => {
              if (mod.module.module_id === moduleId) {
                return {
                  ...mod,
                  module: {
                    ...mod.module,
                    is_enabled: false,
                    is_modified: true,
                  },
                  permissions: mod.permissions.map((perm) => ({
                    ...perm,
                    is_enabled: false,
                    is_modified: true,
                    fields: perm.fields?.map((field) => ({
                      ...field,
                      read: false,
                      edit: false,
                      is_modified: true,
                    })),
                  })),
                };
              }
              return mod;
            }),
          }));
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }

    // Normal enable case
    setPrivileges((prev) => ({
      ...prev,
      modules: prev.modules.map((mod) => {
        if (mod.module.module_id === moduleId) {
          return {
            ...mod,
            module: {
              ...mod.module,
              is_enabled: true,
              is_modified: true,
            },
            permissions: mod.permissions.map((perm) => ({
              ...perm,
              is_enabled: true,
              is_modified: true,
              fields: perm.fields?.map((field) => ({
                ...field,
                read: field.read,
                edit: field.edit,
                is_modified: true,
              })),
            })),
          };
        }
        return mod;
      }),
    }));
  };

  // const handleFieldChange =
  //   (
  //     moduleId: string,
  //     permissionId: string,
  //     fieldId: string,
  //     type: 'read' | 'edit'
  //   ) =>
  //   (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     setPrivileges((prev) => ({
  //       ...prev,
  //       modules: prev.modules.map((mod) => {
  //         if (mod.module.module_id === moduleId) {
  //           return {
  //             ...mod,
  //             permissions: mod.permissions.map((perm) => {
  //               if (perm.permission_id === permissionId) {
  //                 return {
  //                   ...perm,
  //                   fields: perm.fields?.map((field) => {
  //                     if (field.field_id === fieldId) {
  //                       const newValue = !field[type];
  //                       return {
  //                         ...field,
  //                         [type]: newValue,
  //                         // If edit is being checked, also check read
  //                         // If read is being unchecked, also uncheck edit
  //                         read:
  //                           type === 'edit'
  //                             ? newValue
  //                               ? true
  //                               : field.read
  //                             : newValue,
  //                         edit:
  //                           type === 'read' && !newValue
  //                             ? false
  //                             : type === 'edit'
  //                               ? newValue
  //                               : field.edit,
  //                         is_modified: true,
  //                       };
  //                     }
  //                     return field;
  //                   }),
  //                 };
  //               }
  //               return perm;
  //             }),
  //           };
  //         }
  //         return mod;
  //       }),
  //     }));
  //   };

  // const handlePermissionCheck =
  //   (moduleId: string, permissionId: string) => (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     const currentModule = privileges.modules.find(
  //       (m) => m.module.module_id === moduleId
  //     );
  //     const currentPermission = currentModule?.permissions.find(
  //       (p) => p.permission_id === permissionId
  //     );
  //     const newPermissionState = !currentPermission?.is_enabled;

  //     if (!newPermissionState && currentPermission?.is_field_available) {
  //       // Expand permission to show its fields
  //       setExpandedPermissions((prev) =>
  //         prev.includes(permissionId) ? prev : [...prev, permissionId]
  //       );
  //       setConfirmationState({
  //         isOpen: true,
  //         message:
  //           'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
  //         onConfirm: () => {
  //           setPrivileges((prev) => {
  //             // If nothing has changed, return the previous state
  //             if (!currentModule || !currentPermission) return prev;

  //             // Check if all permissions in this module will be disabled
  //             const updatedModulePermissions = currentModule?.permissions.map(
  //               (p) =>
  //                 p.permission_id === permissionId
  //                   ? { ...p, is_enabled: newPermissionState }
  //                   : p
  //             );
  //             const allPermissionsDisabled = updatedModulePermissions?.every(
  //               (p) => !p.is_enabled
  //             );

  //             return {
  //               ...prev,
  //               // Update module enabled state based on its permissions
  //               modules: prev.modules.map((mod) => {
  //                 if (mod.module.module_id === moduleId) {
  //                   return {
  //                     ...mod,
  //                     module: {
  //                       ...mod.module,
  //                       is_enabled: !allPermissionsDisabled,
  //                     },
  //                     permissions: mod.permissions.map((perm) => {
  //                       if (perm.permission_id === permissionId) {
  //                         return {
  //                           ...perm,
  //                           is_enabled: newPermissionState,
  //                           // Update field states when permission is disabled
  //                           fields: perm.fields?.map((field) => ({
  //                             ...field,
  //                             read: newPermissionState ? field.read : false,
  //                             edit: newPermissionState ? field.edit : false,
  //                             // is_enabled: newPermissionState ? field.is_enabled : false
  //                           })),
  //                         };
  //                       }
  //                       return perm;
  //                     }),
  //                   };
  //                 }
  //                 return mod;
  //               }),
  //             };
  //           });
  //           setConfirmationState((prev) => ({ ...prev, isOpen: false }));
  //         },
  //       });
  //       return;
  //     }
  //     {
  //       /*  popup-confirmation end*/
  //     }
  //     setPrivileges((prev) => {
  //       // First, get the current module and permission
  //       // const currentModule = prev.modules.find(m => m.module.module_id === moduleId);
  //       // const currentPermission = currentModule?.permissions.find(p => p.permission_id === permissionId);

  //       // If nothing has changed, return the previous state
  //       if (!currentModule || !currentPermission) return prev;

  //       // const newPermissionState = !currentPermission.is_enabled;

  //       // Check if all permissions in this module will be disabled
  //       const updatedModulePermissions = currentModule?.permissions.map((p) =>
  //         p.permission_id === permissionId
  //           ? { ...p, is_enabled: newPermissionState }
  //           : p
  //       );
  //       const allPermissionsDisabled = updatedModulePermissions?.every(
  //         (p) => !p.is_enabled
  //       );

  //       return {
  //         ...prev,
  //         // Update module enabled state based on its permissions
  //         modules: prev.modules.map((mod) => {
  //           if (mod.module.module_id === moduleId) {
  //             return {
  //               ...mod,
  //               module: {
  //                 ...mod.module,
  //                 is_enabled: !allPermissionsDisabled,
  //               },
  //               permissions: mod.permissions.map((perm) => {
  //                 if (perm.permission_id === permissionId) {
  //                   return {
  //                     ...perm,
  //                     is_enabled: newPermissionState,
  //                     // Update field states when permission is disabled
  //                     fields: perm.fields?.map((field) => ({
  //                       ...field,
  //                       read: newPermissionState ? field.read : false,
  //                       edit: newPermissionState ? field.edit : false,
  //                       // is_enabled: newPermissionState ? field.is_enabled : false
  //                     })),
  //                   };
  //                 }
  //                 return perm;
  //               }),
  //             };
  //           }
  //           return mod;
  //         }),
  //       };
  //     });
  //   };
  const handlePermissionCheck =
    (moduleId: string, permissionId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();

      const currentModule = privileges.modules.find(
        (m) => m.module.module_id === moduleId
      );
      const currentPermission = currentModule?.permissions.find(
        (p) => p.permission_id === permissionId
      );
      const newPermissionState = !currentPermission?.is_enabled;

      // Confirm if disabling permission with fields
      if (!newPermissionState && currentPermission?.is_field_available) {
        setExpandedPermissions((prev) =>
          prev.includes(permissionId) ? prev : [...prev, permissionId]
        );

        setConfirmationState({
          isOpen: true,
          message:
            'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
          onConfirm: () => {
            applyPermissionUpdate(moduleId, permissionId, newPermissionState);
            setConfirmationState((prev) => ({ ...prev, isOpen: false }));
          },
        });

        return;
      }

      applyPermissionUpdate(moduleId, permissionId, newPermissionState);
    };

  const applyPermissionUpdate = (
    moduleId: string,
    permissionId: string,
    newPermissionState: boolean
  ) => {
    setPrivileges((prev) => {
      const currentModule = prev.modules.find(
        (m) => m.module.module_id === moduleId
      );
      const currentPermission = currentModule?.permissions.find(
        (p) => p.permission_id === permissionId
      );
      if (!currentModule || !currentPermission) return prev;

      const updatedPermissions = currentModule.permissions.map((p) =>
        p.permission_id === permissionId
          ? {
              ...p,
              is_enabled: newPermissionState,
              fields: p.fields?.map((field) => ({
                ...field,
                read: newPermissionState ? field.read : false,
                edit: newPermissionState ? field.edit : false,
              })),
            }
          : p
      );

      const allPermissionsDisabled = updatedPermissions.every(
        (p) => !p.is_enabled
      );

      const updatedModules = prev.modules.map((mod) => {
        if (mod.module.module_id === moduleId) {
          return {
            ...mod,
            module: {
              ...mod.module,
              is_enabled: newPermissionState ? true : !allPermissionsDisabled,
            },
            permissions: updatedPermissions,
          };
        }
        return mod;
      });

      // ✅ Find and enable the parent menu if needed
      const updatedMenus =
        currentModule.module.menu_id && newPermissionState
          ? {
              ...prev.menu,
              is_enabled: true,
              is_modified: true,
            }
          : prev.menu;

      return {
        ...prev,
        menu: updatedMenus,
        modules: updatedModules,
      };
    });
  };
  const handleFieldChange =
    (
      moduleId: string,
      permissionId: string,
      fieldId: string,
      type: 'read' | 'edit'
    ) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();

      setPrivileges((prev) => {
        const updatedModules = prev.modules.map((mod) => {
          if (mod.module.module_id !== moduleId) return mod;

          const updatedPermissions = mod.permissions.map((perm) => {
            if (perm.permission_id !== permissionId) return perm;

            const updatedFields = perm.fields?.map((field) => {
              if (field.field_id !== fieldId) return field;

              const newValue = !field[type];

              // Clone the field and apply logic
              const updatedField: FieldPrivilege = {
                ...field,
                is_modified: true,
                [type]: newValue,
              };

              // ✅ Force read=true when enabling edit
              if (type === 'edit' && newValue) {
                updatedField.read = true;
                updatedField.edit = true; // << very important!
              }

              // ✅ Disable edit if read is being unchecked
              if (type === 'read' && !newValue) {
                updatedField.edit = false;
              }

              return updatedField;
            });

            const isAnyFieldEnabled = updatedFields?.some(
              (f) => f.read || f.edit
            );

            return {
              ...perm,
              is_enabled: !!isAnyFieldEnabled,
              is_modified: true,
              fields: updatedFields,
            };
          });

          const isAnyPermissionEnabled = updatedPermissions.some(
            (p) => p.is_enabled
          );

          return {
            ...mod,
            module: {
              ...mod.module,
              is_enabled: !!isAnyPermissionEnabled,
              is_modified: true,
            },
            permissions: updatedPermissions,
          };
        });

        const isAnyModuleEnabled = updatedModules.some(
          (m) => m.module.is_enabled
        );

        return {
          ...prev,
          menu: {
            ...prev.menu,
            is_enabled: !!isAnyModuleEnabled,
            is_modified: true,
          },
          modules: updatedModules,
        };
      });
    };

  const togglePermission = (permissionId: string) => {
    setExpandedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <>
      <div className='border-b border-[#CBD6E2]'>
        {/* Menu Level */}
        <div
          className='flex justify-between items-center px-4 py-2 bg-[#FCFCFC] cursor-pointer hover:bg-[#F5F8FA]'
          onClick={() => setIsMenuExpanded(!isMenuExpanded)}
        >
          <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
            <span className={`transform transition-transform duration-200`}>
              <img
                src={isMenuExpanded ? menuArrowRightHover : menuArrowRight}
                alt='menu arrow'
                className='h-4 w-4 rounded'
              />
            </span>
            {privileges.menu.desc}
          </div>
          <div className='w-[25%] flex justify-start px-8'>
            <CustomCheckbox
              checked={privileges.menu.is_enabled}
              onChange={handleMenuCheck}
              disabled={
                'has_extended_permission' in privileges.menu
                  ? privileges.menu.is_enabled &&
                    !privileges.menu.has_extended_permission
                  : viewProfileDisabled || false
              }
            />
          </div>
        </div>

        {/* Module Level */}
        {isMenuExpanded &&
          privileges.modules.map(({ module, permissions }) => (
            <div key={module.rid} className='border-t border-[#CBD6E2]'>
              <div
                className='flex justify-between items-center px-8 py-2 bg-white cursor-pointer hover:bg-[#F5F8FA]'
                onClick={() =>
                  module.module_id && toggleModule(module.module_id)
                }
              >
                <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
                  <span
                    className={`transform transition-transform duration-200 ${expandedModules.includes(module.module_id!) ? 'rotate-90' : ''}`}
                  >
                    <img
                      src={moduleArrowright}
                      alt='module arrow'
                      className='h-4 w-4 rounded'
                    />
                  </span>
                  {module.desc}
                </div>
                <div className='w-[25%] flex justify-start px-10'>
                  <CustomCheckbox
                    checked={module.is_enabled}
                    onChange={handleModuleCheck(module.module_id!)}
                    disabled={
                      'has_extended_permission' in module
                        ? module.is_enabled && !module.has_extended_permission
                        : viewProfileDisabled || false
                    }
                  />
                </div>
              </div>

              {/* Permission Level */}
              {expandedModules.includes(module.module_id!) &&
                permissions.map((permission) => (
                  <div key={permission.rid}>
                    <div
                      className='flex justify-between items-center px-12 py-2 bg-white border-t border-[#CBD6E2] cursor-pointer hover:bg-[#F5F8FA]'
                      onClick={() =>
                        permission.is_field_available &&
                        togglePermission(permission.permission_id!)
                      }
                    >
                      <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
                        <span
                          className={`transform transition-transform duration-200 ${expandedPermissions.includes(permission.permission_id!) ? 'rotate-90' : ''} ${!permission.is_field_available ? 'opacity-30' : ''}`}
                        >
                          <img
                            src={moduleArrowright}
                            alt='permission arrow'
                            className='h-4 w-4 rounded'
                          />
                        </span>
                        {permission.desc}
                      </div>
                      <div className='w-[25%] flex justify-start px-12'>
                        <CustomCheckbox
                          checked={permission.is_enabled}
                          onChange={handlePermissionCheck(
                            module.module_id!,
                            permission.permission_id!
                          )}
                          disabled={
                            'has_extended_permission' in permission
                              ? permission.is_enabled &&
                                !permission.has_extended_permission
                              : viewProfileDisabled || false
                          }
                        />
                      </div>
                    </div>

                    {/* Field Level */}
                    {permission.is_field_available &&
                      expandedPermissions.includes(
                        permission.permission_id!
                      ) && (
                        <div className='grid grid-cols-2 divide-x divide-[#CBD6E2]'>
                          {/* Left Column */}
                          <div className='border-r border-[#CBD6E2]'>
                            {/* Select all start */}
                            {!('has_extended_permission' in permission) && (
                              <div className='flex justify-between items-center px-16 py-2 bg-white border-t border-[#CBD6E2]'>
                                <div className='w-[65%] text-[13px] text-[#425A76] font-semibold'></div>
                                <div className='w-[35%] flex justify-start gap-4'>
                                  <div className='flex items-center gap-6'>
                                    <span className='text-[13px] text-[#425A76]'>
                                      All
                                    </span>
                                    <CustomCheckbox
                                      checked={
                                        permission.fields
                                          ?.slice(
                                            0,
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          )
                                          .every((field) => field.read) ?? false
                                      }
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const fields =
                                          permission.fields?.slice(
                                            0,
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          ) || [];

                                        const allChecked = fields.every(
                                          (field) => field.read
                                        );

                                        fields.forEach((field) => {
                                          if (field.read !== !allChecked) {
                                            handleFieldChange(
                                              module.module_id!,
                                              permission.permission_id!,
                                              field.field_id,
                                              'read'
                                            )(e);
                                          }
                                        });
                                      }}
                                      disabled={viewProfileDisabled}
                                    />
                                  </div>
                                  <div className='flex items-center gap-3'>
                                    <span className='text-[13px] text-[#425A76]'>
                                      All
                                    </span>
                                    <CustomCheckbox
                                      checked={
                                        permission.fields
                                          ?.slice(
                                            0,
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          )
                                          .every((field) => field.edit) ?? false
                                      }
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const fields =
                                          permission.fields?.slice(
                                            0,
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          ) || [];

                                        const allChecked = fields.every(
                                          (field) => field.edit
                                        );

                                        fields.forEach((field) => {
                                          if (field.edit !== !allChecked) {
                                            handleFieldChange(
                                              module.module_id!,
                                              permission.permission_id!,
                                              field.field_id,
                                              'edit'
                                            )(e);
                                          }
                                        });
                                      }}
                                      disabled={viewProfileDisabled}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            {permission.fields
                              ?.slice(
                                0,
                                Math.ceil(permission.fields.length / 2)
                              )
                              .map((field) => (
                                <div
                                  key={field.rid}
                                  className='flex justify-between items-center px-16 py-2 bg-white border-t border-[#CBD6E2]'
                                >
                                  <div className='w-[65%] text-[13px] text-[#425A76]'>
                                    {field.desc}
                                  </div>
                                  <div className='w-[35%] flex justify-start gap-4'>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-[13px] text-[#425A76]'>
                                        Read
                                      </span>
                                      <CustomCheckbox
                                        checked={field.read}
                                        onChange={handleFieldChange(
                                          module.module_id!,
                                          permission.permission_id!,
                                          field.field_id,
                                          'read'
                                        )}
                                        disabled={
                                          'hasReadExtendedPermsission' in field
                                            ? field.read &&
                                              !field.hasReadExtendedPermsission
                                            : viewProfileDisabled || false
                                        }
                                      />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-[13px] text-[#425A76]'>
                                        Edit
                                      </span>
                                      <CustomCheckbox
                                        checked={field.edit}
                                        onChange={handleFieldChange(
                                          module.module_id!,
                                          permission.permission_id!,
                                          field.field_id,
                                          'edit'
                                        )}
                                        disabled={
                                          'hasEditExtendedPermsission' in field
                                            ? field.edit &&
                                              !field.hasEditExtendedPermsission
                                            : viewProfileDisabled || false
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                          {/* Right Column */}
                          <div>
                            {/* Select all start */}
                            {!('has_extended_permission' in permission) && (
                              <div className='flex justify-between items-center px-8 py-2 bg-white border-t border-[#CBD6E2]'>
                                <div className='w-[55%] text-[13px] text-[#425A76] font-semibold'></div>
                                <div className='w-[45%] flex justify-start gap-4'>
                                  <div className='flex items-center gap-6'>
                                    <span className='text-[13px] text-[#425A76]'>
                                      All
                                    </span>
                                    <CustomCheckbox
                                      checked={
                                        permission.fields
                                          ?.slice(
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          )
                                          .every((field) => field.read) ?? false
                                      }
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const fields =
                                          permission.fields?.slice(
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          ) || [];

                                        const allChecked = fields.every(
                                          (field) => field.read
                                        );

                                        fields.forEach((field) => {
                                          if (field.read !== !allChecked) {
                                            handleFieldChange(
                                              module.module_id!,
                                              permission.permission_id!,
                                              field.field_id,
                                              'read'
                                            )(e);
                                          }
                                        });
                                      }}
                                      disabled={viewProfileDisabled}
                                    />
                                  </div>
                                  <div className='flex items-center gap-3'>
                                    <span className='text-[13px] text-[#425A76]'>
                                      All
                                    </span>
                                    <CustomCheckbox
                                      checked={
                                        permission.fields
                                          ?.slice(
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          )
                                          .every((field) => field.edit) ?? false
                                      }
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const fields =
                                          permission.fields?.slice(
                                            Math.ceil(
                                              permission.fields.length / 2
                                            )
                                          ) || [];

                                        const allChecked = fields.every(
                                          (field) => field.edit
                                        );

                                        fields.forEach((field) => {
                                          if (field.edit !== !allChecked) {
                                            handleFieldChange(
                                              module.module_id!,
                                              permission.permission_id!,
                                              field.field_id,
                                              'edit'
                                            )(e);
                                          }
                                        });
                                      }}
                                      disabled={viewProfileDisabled}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Select all end */}
                            {permission.fields
                              ?.slice(Math.ceil(permission.fields.length / 2))
                              .map((field) => (
                                <div
                                  key={field.rid}
                                  className='flex justify-between items-center px-8 py-2 bg-white border-t border-[#CBD6E2]'
                                >
                                  <div className='w-[55%] text-[13px] text-[#425A76]'>
                                    {field.desc}
                                  </div>
                                  <div className='w-[45%] flex justify-start gap-4'>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-[13px] text-[#425A76]'>
                                        Read
                                      </span>
                                      <CustomCheckbox
                                        checked={field.read}
                                        onChange={handleFieldChange(
                                          module.module_id!,
                                          permission.permission_id!,
                                          field.field_id,
                                          'read'
                                        )}
                                        disabled={
                                          'hasReadExtendedPermsission' in field
                                            ? field.read &&
                                              !field.hasReadExtendedPermsission
                                            : viewProfileDisabled || false
                                        }
                                      />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-[13px] text-[#425A76]'>
                                        Edit
                                      </span>
                                      <CustomCheckbox
                                        checked={field.edit}
                                        onChange={handleFieldChange(
                                          module.module_id!,
                                          permission.permission_id!,
                                          field.field_id,
                                          'edit'
                                        )}
                                        disabled={
                                          'hasEditExtendedPermsission' in field
                                            ? field.edit &&
                                              !field.hasEditExtendedPermsission
                                            : viewProfileDisabled || false
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          ))}
      </div>
      <ConfirmationPopup
        isOpen={confirmationState.isOpen}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() =>
          setConfirmationState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
};

export const ProfilePermissions: React.FC<ProfileModuleListProps> = ({
  createProfilePermissionsData,
  onPrivilegesChange,
  viewProfileDisabled,
}) => {
  const privileges = createProfilePermissionsData || [];

  const [allModifiedPrivileges, setAllModifiedPrivileges] = useState<
    Privilege[]
  >([]);

  const groupPrivileges = (privileges: Privilege[]): GroupedPrivileges[] => {
    const menuPrivileges = privileges.filter(
      (p): p is MenuPrivilege => p.type === 'menu'
    );

    return menuPrivileges.map((menu): GroupedPrivileges => {
      const modules = privileges.filter(
        (p): p is ModulePrivilege =>
          p.type === 'module' && 'menu_id' in p && p.menu_id === menu.menu_id
      );

      return {
        menu,
        modules: modules.map((module) => {
          const permissions = privileges
            .filter(
              (p): p is PermissionPrivilege =>
                p.type === 'permission' &&
                'module_id' in p &&
                p.module_id === module.module_id
            )
            .map((permission) => ({
              ...permission,
              fields: privileges.filter(
                (f): f is FieldPrivilege =>
                  f.type === 'field' &&
                  // 'permission_id' in f &&
                  f.permission_id === permission.permission_id
              ),
            }));

          return {
            module,
            permissions,
          };
        }),
      };
    });
  };

  const groupedPrivileges = groupPrivileges(privileges);

  const handlePrivilegesChange = (modified: Privilege[]) => {
    const updatedMap = new Map(allModifiedPrivileges.map((p) => [p.rid, p]));
    modified.forEach((p) => updatedMap.set(p.rid, p));
    const merged = Array.from(updatedMap.values());

    setAllModifiedPrivileges(merged); // ✅ update state
    onPrivilegesChange(merged); // ✅ immediately use the correct value
  };
  return (
    <div className='px-4'>
      <div className='border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex justify-between items-center bg-[#EAF0F5] border-b border-[#CBD6E2] h-[38px]'>
          <div className='w-[75%] px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
            Profile Permissions
          </div>
          <div className='w-[25%] px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
            Enable
          </div>
        </div>

        <div>
          {groupedPrivileges.map((groupedPrivilege) => (
            <PrivilegeAccordion
              key={groupedPrivilege.menu.rid}
              groupedPrivilege={groupedPrivilege}
              onPrivilegesChange={handlePrivilegesChange}
              viewProfileDisabled={viewProfileDisabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// const isModulePrivilege = (privilege: Privilege): privilege is ModulePrivilege => {
//   return privilege.type === 'module';
// };

// const isPermissionPrivilege = (privilege: Privilege): privilege is PermissionPrivilege => {
//   return privilege.type === 'permission';
// };

// React.useEffect(() => {
//   setPrivileges(groupedPrivilege);
// }, [groupedPrivilege]);
