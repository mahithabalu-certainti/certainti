import { CircularProgress } from '@mui/material';
import { ProfileResponse, ProfileType } from '../../../../common-service';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  CheckboxChecked,
  CheckboxUnchecked,
  MenuArrowRight,
  MenuArrowRightHover,
  ModuleArrowRight,
} from '../../../../assets';
import ConfirmationPopup from '../../../../common-utils/confirmation-popup';

/* Flow Diagram [Depended - Remove/Add checkbox]

[Progation/Bubling]  =>  [collect Modules/Permissions]  =>  [Take Permissions Depended by/Depended On(Menus,Modules,Permissions) If no permissoins then take Modules Depended by/Depended On(Menus,Modules,Permissions)]  =>  [Iterate all (permissoins/Modules) and Remove/Add Relevent data]  =>  [Remove/Enabled all fields Relevent to permissoins]  =>  [Transform render]  =>  [clear collect Modules/Permissions] */

interface ProfilePermissionFormProps {
  loading: boolean;
  formData: ProfileResponse[];
  formRef: React.RefObject<HTMLFormElement>;
  outData: (e: ProfileResponse[]) => void;
}

export type Field = {
  rid: string;
  type: 'field';
  field_id: string;
  permission_id: string;
  name: string;
  desc: string;
  read: boolean;
  edit: boolean;
  is_read_only: boolean;
  is_edit_only: boolean;
  updatedByDependsOn?: boolean;
  hasReadExtendedPermsission?: boolean;
  hasEditExtendedPermsission?: boolean;
};

export type Permission = {
  rid: string;
  type: 'permission';
  permission_id: string;
  module_id: string;
  name: string;
  desc: string;
  is_field_available: boolean;
  is_enabled: boolean;
  field: Field[];
  updatedByDependsOn?: boolean;
  has_extended_permission?: boolean;
};

export type Module = {
  rid: string;
  type: 'module';
  module_id: string;
  menu_id: string;
  name: string;
  desc: string;
  is_enabled: boolean;
  permission: Permission[];
  updatedByDependsOn?: boolean;
  has_extended_permission?: boolean;
};

export type TransformForRender = {
  rid: string;
  type: 'menu';
  menu_id: string;
  name: string;
  desc: string;
  is_enabled: boolean;
  modules: Module[];
  has_extended_permission?: boolean;
  updatedByDependsOn?: boolean;
};

type SelectAll =
  | 'leftReadAll'
  | 'leftEditAll'
  | 'rightReadAll'
  | 'rightEditAll';

type FieldType = 'read' | 'edit';

interface ConfirmationState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}

export const ProfilePermissionForm: React.FC<ProfilePermissionFormProps> = ({
  loading,
  formData,
  formRef,
  outData,
}) => {
  const [menus, setMenus] = useState<TransformForRender[]>([]);
  const [expandMenus, setExpandMenus] = useState<string[]>([]);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    {
      isOpen: false,
      message: '',
      onConfirm: () => {},
    }
  );
  // Collecting changed Modules & Permissions while progration & recalling
  const collectModulesRef = useRef<string[]>([]);
  const collectPermissionsRef = useRef<string[]>([]);

  const transformData = (data: ProfileResponse[]) => {
    const result = [];

    // Group items by type for easy lookup
    const menus = data.filter((item) => item.type === 'menu');
    const modules = data.filter((item) => item.type === 'module');
    const permissions = data.filter((item) => item.type === 'permission');
    const fields = data.filter((item) => item.type === 'field');

    // Map permissions by module_id
    const permissionsByModule: Record<string, ProfileResponse[]> = {};
    for (const perm of permissions) {
      if (perm.module_id) {
        if (!permissionsByModule[perm.module_id]) {
          permissionsByModule[perm.module_id] = [];
        }
        permissionsByModule[perm.module_id].push(perm);
      }
    }

    // Map fields by permission_id
    const fieldsByPermission: Record<string, ProfileResponse[]> = {};
    for (const field of fields) {
      if (field.permission_id) {
        if (!fieldsByPermission[field.permission_id]) {
          fieldsByPermission[field.permission_id] = [];
        }
        fieldsByPermission[field.permission_id].push(field);
      }
    }

    // Attach fields to permissions
    for (const perm of permissions) {
      (perm as ProfileResponse & { field: ProfileResponse[] }).field =
        perm.permission_id ? fieldsByPermission[perm.permission_id] || [] : [];
    }

    // Attach permissions to modules
    const modulesByMenu: Record<string, ProfileResponse[]> = {};
    for (const mod of modules) {
      (mod as ProfileResponse & { permission: ProfileResponse[] }).permission =
        mod.module_id ? permissionsByModule[mod.module_id] || [] : [];
      if (mod.menu_id) {
        if (!modulesByMenu[mod.menu_id]) {
          modulesByMenu[mod.menu_id] = [];
        }
        modulesByMenu[mod.menu_id].push(mod);
      }
    }

    // Attach modules to menus
    for (const menu of menus) {
      (menu as ProfileResponse & { modules: ProfileResponse[] }).modules =
        menu.menu_id ? modulesByMenu[menu.menu_id] || [] : [];
      result.push(menu as unknown as TransformForRender);
    }

    return result;
  };

  useEffect(() => {
    setMenus(transformData(formData));
  }, [formData]);

  // utility to index by type and id
  const index = {
    menu: new Map(
      formData.filter((x) => x.type === 'menu').map((m) => [m.menu_id, m])
    ),
    module: new Map(
      formData.filter((x) => x.type === 'module').map((m) => [m.module_id, m])
    ),
    permission: new Map(
      formData
        .filter((x) => x.type === 'permission')
        .map((p) => [p.permission_id, p])
    ),
    field: new Map(
      formData.filter((x) => x.type === 'field').map((f) => [f.field_id, f])
    ),
  };

  // child lookup helpers
  function getModulesForMenu(menu_id: string) {
    return formData.filter((x) => x.type === 'module' && x.menu_id === menu_id);
  }
  function getPermissionsForModule(module_id: string) {
    return formData.filter(
      (x) => x.type === 'permission' && x.module_id === module_id
    );
  }
  function getFieldsForPermission(permission_id: string) {
    return formData.filter(
      (x) => x.type === 'field' && x.permission_id === permission_id
    );
  }

  // Propagate down
  function propagateDown(type: ProfileType, id: string, isEnabled: boolean) {
    switch (type) {
      case 'menu': {
        // all modules under this menu
        getModulesForMenu(id).forEach((m) => {
          m.is_enabled = isEnabled;
          m.is_modified = true; //set flag for indentify changes(For API)
          if (!isEnabled) m['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          propagateDown('module', m.module_id as string, isEnabled);
        });
        break;
      }
      case 'module': {
        getPermissionsForModule(id).forEach((p) => {
          p.is_enabled = isEnabled;
          p.is_modified = true; //set flag for indentify changes(For API)
          if (!isEnabled) p['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          if (!collectPermissionsRef.current.includes(p.permission_id!)) {
            //add only that id not in the array
            collectPermissionsRef.current =
              collectPermissionsRef.current.concat(p.permission_id!);
          }
          propagateDown('permission', p.permission_id as string, isEnabled);
        });
        break;
      }
      case 'permission': {
        getFieldsForPermission(id).forEach((f) => {
          f.read = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
          if (!isEnabled) f['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          if (!f.is_read_only) f.edit = isEnabled; //Only update when 'is_read_only' false
        });
        break;
      }
    }
  }

  // Recalc a parent’s is_enabled by peeking at its children
  function recalcUp(type: ProfileType, id: string) {
    if (type === 'module') {
      const module = index.module.get(id);
      // permissions under it
      const perms = getPermissionsForModule(id);
      if (module) {
        const newValue = perms.some((p) => p.is_enabled);
        if (
          module.is_enabled !== newValue &&
          !collectModulesRef.current.includes(module.module_id!)
        ) {
          //If Modulle was changed
          collectModulesRef.current = collectModulesRef.current.concat(
            module.module_id!
          );
        }
        if (!newValue) module['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
        module.is_enabled = newValue;
        module.is_modified = true; //set flag for indentify changes(For API)
        recalcUp('menu', module.menu_id as string);
      }
    } else if (type === 'permission') {
      const perm = index.permission.get(id);
      const fields = getFieldsForPermission(id);
      if (fields.length === 0) {
        // no fields → permission's own is_enabled drives upward logic
        // (skip change here; just go upward)
      } else {
        if (perm) {
          const newValue = fields.some((f) => f.is_enabled || f.read); // supports both models
          if (
            perm.is_enabled !== newValue &&
            !collectPermissionsRef.current.includes(perm.permission_id!)
          ) {
            //If permission was changed
            collectPermissionsRef.current =
              collectPermissionsRef.current.concat(perm.permission_id!);
          }
          if (!newValue) perm['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          perm.is_enabled = newValue;
          perm.is_modified = true; //set flag for indentify changes(For API)
        }
      }
      if (perm) recalcUp('module', perm.module_id as string);
    } else if (type === 'menu') {
      const menu = index.menu.get(id);
      const mods = getModulesForMenu(id);
      const newValue = mods.some((m) => m.is_enabled);
      if (menu) {
        if (!newValue) menu['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
        menu.is_enabled = newValue;
        menu.is_modified = true; //set flag for indentify changes(For API)
      }
    }
  }

  function getCurrentData(item: string, itemType: ProfileType) {
    const idField = itemType === 'permission' ? 'permission_id' : 'module_id';
    return formData.find(
      (items) => items[idField] === item && items.type === itemType
    );
  }

  function toggleDependedBy(
    item: string,
    isEnabled: boolean,
    itemType: ProfileType
  ) {
    const currentItem = getCurrentData(item, itemType);
    // Removed all Relvant menus
    currentItem?.depended_by_menu?.forEach((menu) => {
      const findMenu = formData.find((data) => data.menu_id === menu);
      if (findMenu) {
        findMenu.is_enabled = isEnabled;
        findMenu.is_modified = true; //set flag for indentify changes(For API)
      }
    });
    // Removed all Relvant module
    currentItem?.depended_by_module?.forEach((module) => {
      const findModule = formData.find((data) => data.module_id === module);
      if (findModule) {
        findModule.is_enabled = isEnabled;
        findModule.is_modified = true; //set flag for indentify changes(For API)
      }
    });
    // Removed all Relvant permissions
    currentItem?.depended_by_permission?.forEach((permission) => {
      const findPermission = formData.find(
        (data) => data.permission_id === permission
      );
      if (findPermission) {
        findPermission.is_enabled = isEnabled;
        findPermission.is_modified = true; //set flag for indentify changes(For API)
      }
      // Remove all Fields when permission Remove
      getFieldsForPermission(findPermission?.permission_id || '').forEach(
        (f) => {
          f.read = isEnabled;
          f.edit = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
        }
      );
    });
  }

  function toggleDependedOn(
    item: string,
    isEnabled: boolean,
    itemType: ProfileType
  ) {
    const currentItem = getCurrentData(item, itemType);
    // Enabled all Relvant menus
    currentItem?.depends_on_menu?.forEach((menu) => {
      const findMenu = formData.find(
        (data) => data.menu_id === menu && data.type === 'menu'
      );
      if (findMenu) {
        // for checkbox color change - update only if value newly change
        if (!findMenu.is_enabled) findMenu['updatedByDependsOn'] = isEnabled;
        findMenu.is_enabled = isEnabled;
        findMenu.is_modified = true; //set flag for indentify changes(For API)
      }
    });
    // Enabled all Relvant module
    currentItem?.depends_on_module?.forEach((module) => {
      const findModule = formData.find(
        (data) => data.module_id === module && data.type === 'module'
      );
      if (findModule) {
        // for checkbox color change - update only if value newly change
        if (!findModule.is_enabled)
          findModule['updatedByDependsOn'] = isEnabled;
        findModule.is_enabled = isEnabled;
        findModule.is_modified = true; //set flag for indentify changes(For API)
      }
    });
    // Enabled all Relvant permissions
    currentItem?.depends_on_permission?.forEach((permission) => {
      const findPermission = formData.find(
        (data) =>
          data.permission_id === permission && data.type === 'permission'
      );
      if (findPermission) {
        // for checkbox color change - update only if value newly change
        if (!findPermission.is_enabled)
          findPermission['updatedByDependsOn'] = isEnabled;
        findPermission.is_enabled = isEnabled;
        findPermission.is_modified = true; //set flag for indentify changes(For API)
      }
      // Enable all Fields when permission enabled
      getFieldsForPermission(findPermission?.permission_id as string).forEach(
        (f) => {
          // for checkbox color change - update only if value newly change
          if (!f.read) f['updatedByDependsOn'] = isEnabled;
          f.read = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
        }
      );
    });
  }

  function dependedOnByCondition(
    item: string,
    isEnabled: boolean,
    itemType: ProfileType
  ) {
    if (isEnabled) {
      //If checkbox Selected [depended_on]
      toggleDependedOn(item, isEnabled, itemType);
    } else {
      //If checkbox un-Selected [depended_by]
      toggleDependedBy(item, isEnabled, itemType);
    }
  }

  function dependsOnByImplement(isEnabled: boolean) {
    if (collectPermissionsRef.current.length > 0) {
      collectPermissionsRef.current.forEach((item) => {
        dependedOnByCondition(item, isEnabled, 'permission');
      });
    } else {
      //If no Permission has been updated
      collectModulesRef.current.forEach((item) => {
        dependedOnByCondition(item, isEnabled, 'module');
      });
    }
    // clear data
    collectModulesRef.current = [];
    collectPermissionsRef.current = [];
  }

  // top‑level API
  function toggleMenu(menu_id: string, isEnabled: boolean) {
    const menu = index.menu.get(menu_id);
    if (!menu) throw new Error('no menu ' + menu_id);
    menu.is_enabled = isEnabled;
    // expand Menu and his module and permissions when disabled
    if (!isEnabled) {
      menuExpand(menu_id, undefined, true);
      getModulesForMenu(menu_id).forEach((mod) => {
        menuExpand(mod?.module_id as string, undefined, true);
        getPermissionsForModule(mod?.module_id as string).forEach((pem) => {
          menuExpand(pem?.permission_id as string, undefined, true);
        });
      });
      menu['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
    }
    menu.is_modified = true; //set flag for indentify changes(For API)
    propagateDown('menu', menu_id, isEnabled);
    dependsOnByImplement(isEnabled);
    return formData;
  }

  function toggleModule(module_id: string, isEnabled: boolean) {
    const mod = index.module.get(module_id);
    if (!mod) throw new Error('no module ' + module_id);
    mod.is_enabled = isEnabled;
    if (!collectModulesRef.current.includes(module_id)) {
      collectModulesRef.current = collectModulesRef.current.concat(module_id);
    }
    if (!isEnabled) {
      // expand module and his permissions when disabled
      menuExpand(module_id, undefined, true);
      getPermissionsForModule(module_id).forEach((pem) => {
        menuExpand(pem?.permission_id as string, undefined, true);
      });
      mod['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
    }
    mod.is_modified = true; //set flag for indentify changes(For API)
    propagateDown('module', module_id, isEnabled);
    recalcUp('menu', mod.menu_id as string);
    dependsOnByImplement(isEnabled);
    return formData;
  }

  function togglePermission(permission_id: string, isEnabled: boolean) {
    const perm = index.permission.get(permission_id);
    if (!perm) throw new Error('no permission ' + permission_id);
    perm.is_enabled = isEnabled;
    if (!collectPermissionsRef.current.includes(permission_id)) {
      //add only that id not in the array
      collectPermissionsRef.current =
        collectPermissionsRef.current.concat(permission_id);
    }
    if (!isEnabled) {
      // expand permission when disabled
      menuExpand(permission_id, undefined, true);
      perm['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
    }
    perm.is_modified = true; //set flag for indentify changes(For API)
    propagateDown('permission', permission_id, isEnabled);
    recalcUp('permission', permission_id as string); // always recalc upward, regardless of children
    dependsOnByImplement(isEnabled);
    return formData;
  }

  function toggleField(
    field_id: string,
    isEnabled: boolean,
    fieldType?: FieldType
  ) {
    const field = index.field.get(field_id);
    if (!field) throw new Error('no field ' + field_id);
    if (fieldType === 'edit') {
      field.edit = isEnabled;
      if (isEnabled) {
        field.read = true; // Enabling edit always enables read
      } else {
        field['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
      }
    } else if (fieldType === 'read') {
      field.read = isEnabled;
      if (!isEnabled) {
        field.edit = false; // Disabling read always disables edit
        field['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
      }
    }
    field.is_modified = true; //set flag for indentify changes(For API)

    // If field is being checked (either read or edit), check parent permission and enable all is_edit_only fields
    if (isEnabled) {
      // Get parent permission
      const permissionId = field.permission_id as string;
      const permission = index.permission.get(permissionId);
      if (permission) {
        // Enable all sibling fields with is_edit_only true
        const siblingFields = getFieldsForPermission(permissionId);
        siblingFields.forEach((f) => {
          if (f.is_edit_only) {
            f.read = true;
            f.is_modified = true;
          }
        });
      }
    }

    recalcUp('permission', field.permission_id as string);
    dependsOnByImplement(isEnabled);
    return formData;
  }

  function toggleFieldSelectAll(
    permission_id: string,
    isEnabled: boolean,
    selectType: SelectAll
  ) {
    const allFields = getFieldsForPermission(permission_id);
    const partialData = allFields?.length / 2;
    if (selectType === 'leftReadAll') {
      allFields
        ?.slice(0, Math.ceil(partialData))
        .filter((item) => (isEnabled ? item : !item.is_edit_only)) //ignore is_edit_only when is deselect
        .filter(
          (item) => !(item.hasReadExtendedPermsission === false && item.read) // ignore Extended permission data
        )
        .forEach((f) => {
          f.read = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
          if (!isEnabled) {
            f.edit = false; // Disabling read always disables edit
            f['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          }
        });
    } else if (selectType === 'leftEditAll') {
      allFields
        ?.slice(0, Math.ceil(partialData))
        .filter((item) => !item.is_read_only) //ignore is_read_only data
        .filter(
          (item) => !(item.hasEditExtendedPermsission === false && item.edit) // ignore Extended permission data
        )
        .forEach((f) => {
          f.edit = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
          if (isEnabled) f.read = true; // Enabling edit always enables read
        });
    } else if (selectType === 'rightReadAll') {
      allFields
        ?.slice(Math.ceil(partialData))
        .filter((item) => (isEnabled ? item : !item.is_edit_only)) //ignore is_edit_only when is deselect 
        .filter(
          (item) => !(item.hasReadExtendedPermsission === false && item.read) // ignore Extended permission data
        )
        .forEach((f) => {
          f.read = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
          if (!isEnabled) {
            f.edit = false; // Disabling read always disables edit
            f['updatedByDependsOn'] = false; //Remove updatedByDependsOn flag when uncheck
          }
        });
    } else if (selectType === 'rightEditAll') {
      allFields
        ?.slice(Math.ceil(partialData))
        .filter((item) => !item.is_read_only) //ignore is_read_only data
        .filter(
          (item) => !(item.hasEditExtendedPermsission === false && item.edit) // ignore Extended permission data
        )
        .forEach((f) => {
          f.edit = isEnabled;
          f.is_modified = true; //set flag for indentify changes(For API)
          if (isEnabled) f.read = true; // Enabling edit always enables read
        });
    }
    recalcUp('permission', permission_id);
    dependsOnByImplement(isEnabled);
    return formData;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
    type: ProfileType,
    hasChild: boolean,
    fieldType?: FieldType,
    selectAll?: SelectAll
  ) => {
    e.stopPropagation();
    const value = e.target.checked;
    const InitiateUpdate = () => {
      if (type === 'field' && selectAll) {
        const out = toggleFieldSelectAll(id, value, selectAll);
        setMenus(transformData(out));
      } else if (type === 'menu') {
        const out = toggleMenu(id, value);
        setMenus(transformData(out));
      } else if (type === 'module') {
        const out = toggleModule(id, value);
        setMenus(transformData(out));
      } else if (type === 'permission') {
        const out = togglePermission(id, value);
        setMenus(transformData(out));
      } else if (type === 'field') {
        const out = toggleField(id, value, fieldType);
        setMenus(transformData(out));
      }
    };

    if (!value && hasChild) {
      //If value set false
      setConfirmationState({
        isOpen: true,
        message:
          'Disabling this parent permission will also remove its associated child permissions. Are you sure you want to proceed?',
        onConfirm: () => {
          InitiateUpdate();
        },
      });
    } else {
      InitiateUpdate();
    }
  };

  const menuExpand = (
    id: string,
    e?: React.MouseEvent<HTMLDivElement>,
    isEnabled?: boolean
  ) => {
    e?.stopPropagation();
    if (isEnabled) {
      //Expand Only
      setExpandMenus((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      //Toggle Expand
      setExpandMenus((prev) =>
        prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
      );
    }
  };

  const submitData = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const modifiedData: ProfileResponse[] = [];
    formData.forEach((item) => {
      if (item.is_modified) {
        const updateData: ProfileResponse = {
          rid: item.rid,
          name: item.name,
          desc: item.desc,
          is_modified: item.is_modified,
          type: item.type,
        };
        if (item.type === 'menu') {
          updateData['menu_id'] = item.menu_id;
          updateData['is_enabled'] = item.is_enabled;
        }
        if (item.type === 'module') {
          updateData['menu_id'] = item.menu_id;
          updateData['module_id'] = item.module_id;
          updateData['is_enabled'] = item.is_enabled;
        }
        if (item.type === 'permission') {
          updateData['module_id'] = item.module_id;
          updateData['permission_id'] = item.permission_id;
          updateData['is_enabled'] = item.is_enabled;
        }
        if (item.type === 'field') {
          updateData['permission_id'] = item.permission_id;
          updateData['field_id'] = item.field_id;
          updateData['read'] = item.read;
          updateData['edit'] = item.edit;
        }
        modifiedData.push(updateData);
      }
    });
    outData(modifiedData);
  };

  if (loading) {
    return (
      <div
        className='flex justify-center items-center w-full'
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <form onSubmit={submitData} ref={formRef}>
      <div className='px-10 pb-5'>
        <div className='border border-[#CBD6E2] rounded-[4px]'>
          <div className='flex justify-between items-center bg-[#EAF0F5] border-b border-[#CBD6E2] h-[38px]'>
            <div className='w-[75%] px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
              Profile Permissions
            </div>
            <div className='w-[25%] px-4 font-semibold text-[14px] leading-[32px] tracking-[0%] align-middle text-[#2D3E4F]'>
              Enable
            </div>
          </div>
          {/* Menu Level */}
          {menus?.map((menu, i) => {
            const isMenuExpand = expandMenus.includes(menu.menu_id);
            // Disabled checkbox for Extended permission
            const isDisabled =
              menu.has_extended_permission === false && menu.is_enabled;
            return (
              <div className='border-b border-[#CBD6E2]' key={i}>
                <div
                  className='flex justify-between items-center px-4 py-2 bg-[#FCFCFC] cursor-pointer hover:bg-[#F5F8FA]'
                  onClick={(e) => menuExpand(menu.menu_id, e)}
                >
                  <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
                    <span className='transform transition-transform duration-200'>
                      <Suspense fallback={null}>
                        {isMenuExpand ? (
                          <MenuArrowRightHover
                            alt='menu arrow'
                            className='h-4 w-4 rounded'
                          />
                        ) : (
                          <MenuArrowRight
                            alt='menu arrow'
                            className='h-4 w-4 rounded'
                          />
                        )}
                      </Suspense>
                    </span>
                    {menu.desc}
                  </div>
                  <div className='w-[25%] flex justify-start px-8'>
                    <CheckBox
                      id={menu.menu_id}
                      key={i}
                      handleChange={(e) =>
                        handleChange(
                          e,
                          menu.menu_id,
                          'menu',
                          menu.modules.length > 0
                        )
                      }
                      value={menu.is_enabled}
                      dependsOn={menu.updatedByDependsOn}
                      disabled={isDisabled}
                    />
                  </div>
                </div>
                {/* Module Level */}
                {isMenuExpand &&
                  menu.modules.map((module, j) => {
                    const isModuelExpand = expandMenus.includes(
                      module.module_id
                    );
                    // Disabled checkbox for Extended permission
                    const isDisabled =
                      module.has_extended_permission === false &&
                      module.is_enabled;
                    return (
                      <div key={j} className='border-t border-[#CBD6E2]'>
                        <div
                          className='flex justify-between items-center px-8 py-2 bg-white cursor-pointer hover:bg-[#F5F8FA]'
                          onClick={(e) => menuExpand(module.module_id, e)}
                        >
                          <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
                            <span
                              className={`transform transition-transform duration-200 ${isModuelExpand ? 'rotate-90' : ''}`}
                            >
                              <ModuleArrowRight
                                alt='module arrow'
                                className='h-4 w-4 rounded'
                              />
                            </span>
                            {module.desc}
                          </div>
                          <div className='w-[25%] flex justify-start px-10'>
                            <CheckBox
                              id={module.module_id}
                              key={j}
                              handleChange={(e) =>
                                handleChange(
                                  e,
                                  module.module_id,
                                  'module',
                                  module.permission.length > 0
                                )
                              }
                              value={module.is_enabled}
                              dependsOn={module.updatedByDependsOn}
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                        {/* Permission Level */}
                        {isModuelExpand &&
                          module.permission.map((permission, k) => {
                            const ishasPermission = permission.field.length > 0;
                            const ishasMoreThanOnePermission =
                              permission.field.length > 1;
                            const firstHalfFields = permission.field?.slice(
                              0,
                              Math.ceil(permission.field.length / 2)
                            );
                            const secondHalfFields = permission.field?.slice(
                              Math.ceil(permission.field.length / 2)
                            );
                            const isPermissionExpand = expandMenus.includes(
                              permission.permission_id
                            );
                            // Disabled checkbox for Extended permission
                            const isDisabled =
                              permission.has_extended_permission === false &&
                              permission.is_enabled;
                            const firstHalfFieldsWithoutReadOnly =
                              firstHalfFields.filter(
                                (item) => !item.is_read_only
                              );
                            const firstHalfFieldsWithoutReadHasValue =
                              firstHalfFieldsWithoutReadOnly.length > 0;
                            const secondHalfFieldsWithoutReadOnly =
                              secondHalfFields.filter(
                                (item) => !item.is_read_only
                              );
                            const secondHalfFieldsWithoutReadHasValue =
                              secondHalfFieldsWithoutReadOnly.length > 0;
                            return (
                              <div key={k}>
                                <div
                                  className='flex justify-between items-center px-12 py-2 bg-white border-t border-[#CBD6E2] cursor-pointer hover:bg-[#F5F8FA]'
                                  onClick={(e) =>
                                    menuExpand(permission.permission_id, e)
                                  }
                                >
                                  <div className='w-[75%] text-[13px] text-[#425A76] flex items-center gap-2'>
                                    <span
                                      className={`transform transition-transform duration-200 ${isPermissionExpand ? 'rotate-90' : ''}`}
                                    >
                                      <ModuleArrowRight
                                        alt='permission arrow'
                                        className='h-4 w-4 rounded'
                                      />
                                    </span>
                                    {permission.desc}
                                  </div>
                                  <div className='w-[25%] flex justify-start px-12'>
                                    <CheckBox
                                      id={permission.permission_id}
                                      key={k}
                                      handleChange={(e) =>
                                        handleChange(
                                          e,
                                          permission.permission_id,
                                          'permission',
                                          ishasPermission
                                        )
                                      }
                                      value={permission.is_enabled}
                                      dependsOn={permission.updatedByDependsOn}
                                      disabled={isDisabled}
                                    />
                                  </div>
                                </div>
                                {/* Field Level */}
                                <div className='grid grid-cols-2 divide-x divide-[#CBD6E2]'>
                                  {/* Left Column */}
                                  <div className='border-r border-[#CBD6E2]'>
                                    {ishasPermission && isPermissionExpand && (
                                      <div className='flex justify-between items-center px-16 py-2 bg-white border-t border-[#CBD6E2]'>
                                        <div className='w-[65%] text-[13px] text-[#425A76] font-semibold' />
                                        <div className='w-[35%] flex justify-start gap-4'>
                                          <div className='flex items-center gap-6'>
                                            <span className='text-[13px] text-[#425A76]'>
                                              All
                                            </span>
                                            <CheckBox
                                              value={
                                                firstHalfFields
                                                  .filter(
                                                    (item) => !item.is_edit_only
                                                  )
                                                  .every(
                                                    (field) => field.read
                                                  ) ?? false
                                              }
                                              id={
                                                'leftReadAll-' + permission.name
                                              }
                                              handleChange={(e) =>
                                                handleChange(
                                                  e,
                                                  permission.permission_id,
                                                  'field',
                                                  false,
                                                  undefined,
                                                  'leftReadAll'
                                                )
                                              }
                                            />
                                          </div>
                                          <div className='flex items-center gap-3'>
                                            <span
                                              className={`text-[13px] text-[#425A76] ${firstHalfFieldsWithoutReadHasValue ? '' : 'opacity-50'}`}
                                            >
                                              All
                                            </span>
                                            <CheckBox
                                              value={
                                                firstHalfFieldsWithoutReadHasValue
                                                  ? firstHalfFieldsWithoutReadOnly.every(
                                                      (field) => field.edit
                                                    )
                                                  : false
                                              }
                                              id={
                                                'leftEditAll-' + permission.name
                                              }
                                              handleChange={(e) =>
                                                handleChange(
                                                  e,
                                                  permission.permission_id,
                                                  'field',
                                                  false,
                                                  undefined,
                                                  'leftEditAll'
                                                )
                                              }
                                              disabled={
                                                !firstHalfFieldsWithoutReadHasValue
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {isPermissionExpand &&
                                      firstHalfFields.map((field, l) => {
                                        // Disabled checkbox for Extended permission
                                        const isDisabledRead =
                                          field.hasReadExtendedPermsission ===
                                            false && field.read;
                                        const isDisabledEdit =
                                          field.hasEditExtendedPermsission ===
                                            false && field.edit;
                                        return (
                                          <div
                                            key={l}
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
                                                <CheckBox
                                                  id={
                                                    'leftRead-' + field.field_id
                                                  }
                                                  key={l}
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      field.field_id,
                                                      'field',
                                                      false,
                                                      'read'
                                                    )
                                                  }
                                                  value={field.read}
                                                  dependsOn={
                                                    field.updatedByDependsOn
                                                  }
                                                  disabled={
                                                    isDisabledRead ||
                                                    field.is_edit_only
                                                  }
                                                />
                                              </div>
                                              <div className='flex items-center gap-2'>
                                                <span
                                                  className={`text-[13px] text-[#425A76] ${field.is_read_only ? 'opacity-50' : ''}`}
                                                >
                                                  Edit
                                                </span>
                                                <CheckBox
                                                  id={
                                                    'leftEdit-' + field.field_id
                                                  }
                                                  key={l}
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      field.field_id,
                                                      'field',
                                                      false,
                                                      'edit'
                                                    )
                                                  }
                                                  value={field.edit}
                                                  disabled={
                                                    isDisabledEdit ||
                                                    field.is_read_only
                                                  }
                                                  dependsOn={
                                                    field.updatedByDependsOn
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                  {/* Right Column */}
                                  <div>
                                    {ishasPermission && isPermissionExpand && (
                                      <div className='flex justify-between items-center px-8 py-2 bg-white border-t border-[#CBD6E2]'>
                                        {ishasMoreThanOnePermission && (
                                          <>
                                            <div className='w-[55%] text-[13px] text-[#425A76] font-semibold'></div>
                                            <div className='w-[45%] flex justify-start gap-4'>
                                              <div className='flex items-center gap-6'>
                                                <span className='text-[13px] text-[#425A76]'>
                                                  All
                                                </span>
                                                <CheckBox
                                                  value={
                                                    secondHalfFields
                                                      .filter(
                                                        (item) =>
                                                          !item.is_edit_only
                                                      )
                                                      .every(
                                                        (field) => field.read
                                                      ) ?? false
                                                  }
                                                  id={
                                                    'rightReadAll-' +
                                                    permission.name
                                                  }
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      permission.permission_id,
                                                      'field',
                                                      false,
                                                      undefined,
                                                      'rightReadAll'
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className='flex items-center gap-3'>
                                                <span
                                                  className={`text-[13px] text-[#425A76] ${secondHalfFieldsWithoutReadHasValue ? '' : 'opacity-50'}`}
                                                >
                                                  All
                                                </span>
                                                <CheckBox
                                                  value={
                                                    secondHalfFieldsWithoutReadHasValue
                                                      ? secondHalfFieldsWithoutReadOnly.every(
                                                          (field) => field.edit
                                                        )
                                                      : false
                                                  }
                                                  id={
                                                    'rightEditAll-' +
                                                    permission.name
                                                  }
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      permission.permission_id,
                                                      'field',
                                                      false,
                                                      undefined,
                                                      'rightEditAll'
                                                    )
                                                  }
                                                  disabled={
                                                    !secondHalfFieldsWithoutReadHasValue
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {isPermissionExpand &&
                                      secondHalfFields.map((field, l) => {
                                        // Disabled checkbox for Extended permission
                                        const isDisabledRead =
                                          field.hasReadExtendedPermsission ===
                                            false && field.read;
                                        const isDisabledEdit =
                                          field.hasEditExtendedPermsission ===
                                            false && field.edit;
                                        return (
                                          <div
                                            key={l}
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
                                                <CheckBox
                                                  id={
                                                    'rightRead-' +
                                                    field.field_id
                                                  }
                                                  key={l}
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      field.field_id,
                                                      'field',
                                                      false,
                                                      'read'
                                                    )
                                                  }
                                                  value={field.read}
                                                  dependsOn={
                                                    field.updatedByDependsOn
                                                  }
                                                  disabled={
                                                    isDisabledRead ||
                                                    field.is_edit_only
                                                  }
                                                />
                                              </div>
                                              <div className='flex items-center gap-2'>
                                                <span
                                                  className={`text-[13px] text-[#425A76] ${field.is_read_only ? 'opacity-50' : ''}`}
                                                >
                                                  Edit
                                                </span>
                                                <CheckBox
                                                  id={
                                                    'rightEdit-' +
                                                    field.field_id
                                                  }
                                                  key={l}
                                                  handleChange={(e) =>
                                                    handleChange(
                                                      e,
                                                      field.field_id,
                                                      'field',
                                                      false,
                                                      'edit'
                                                    )
                                                  }
                                                  value={field.edit}
                                                  disabled={
                                                    isDisabledEdit ||
                                                    field.is_read_only
                                                  }
                                                  dependsOn={
                                                    field.updatedByDependsOn
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
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
      </div>
    </form>
  );
};

interface ChekBoxProps {
  value: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
  disabled?: boolean;
  dependsOn?: boolean;
}

const CheckBox: React.FC<ChekBoxProps> = ({
  id,
  value,
  disabled,
  dependsOn,
  handleChange,
}) => {
  return (
    <label
      htmlFor={id}
      onClick={(e) => e.stopPropagation()}
      className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    >
      {' '}
      <input
        type='checkbox'
        name={id}
        id={id}
        onChange={(e) => handleChange(e)}
        checked={value}
        className='hidden'
        disabled={disabled}
      />
      <Suspense fallback={null}>
        {value ? (
          <CheckboxChecked
            alt='checkbox'
            className={`h-6 w-6 ${dependsOn ? '[&>path:first-child]:stroke-red-500' : ''}`}
          />
        ) : (
          <CheckboxUnchecked alt='checkbox' className='h-6 w-6' />
        )}
      </Suspense>
    </label>
  );
};
