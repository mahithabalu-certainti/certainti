import { useEffect, useRef, useState } from 'react';
import { ModuleArrowRight } from '../../assets';
import { IntialData } from './profilepermissionresponseupdated';
import { ProfileResponse, ProfileType } from '../../common-service';

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
};

export type TransformForRender = {
  rid: string;
  type: 'menu';
  menu_id: string;
  name: string;
  desc: string;
  is_enabled: boolean;
  modules: Module[];
};

export const Test: React.FC = () => {
  const [all, setAll] = useState<ProfileResponse[]>(IntialData);
  const [menus, setMenus] = useState<TransformForRender[]>([]);
  const [expandMenus, setExpandMenus] = useState<string[]>([]);
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
      (
        mod as ProfileResponse & { permission: ProfileResponse[] }
      ).permission = mod.module_id
        ? permissionsByModule[mod.module_id] || []
        : [];
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
    setMenus(transformData(all));
  }, [all]);

  // utility to index by type and id
  const index = {
    menu: new Map(
      all.filter((x) => x.type === 'menu').map((m) => [m.menu_id, m])
    ),
    module: new Map(
      all.filter((x) => x.type === 'module').map((m) => [m.module_id, m])
    ),
    permission: new Map(
      all
        .filter((x) => x.type === 'permission')
        .map((p) => [p.permission_id, p])
    ),
    field: new Map(
      all.filter((x) => x.type === 'field').map((f) => [f.field_id, f])
    ),
  };

  // child lookup helpers
  function getModulesForMenu(menu_id: string) {
    return all.filter((x) => x.type === 'module' && x.menu_id === menu_id);
  }
  function getPermissionsForModule(module_id: string) {
    return all.filter(
      (x) => x.type === 'permission' && x.module_id === module_id
    );
  }
  function getFieldsForPermission(permission_id: string) {
    return all.filter(
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
          propagateDown('module', m.module_id as string, isEnabled);
        });
        break;
      }
      case 'module': {
        getPermissionsForModule(id).forEach((p) => {
          p.is_enabled = isEnabled;
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
          f.read = isEnabled; // or f.is_enabled if you add that flag
          f.edit = isEnabled;
          // if you prefer a single is_enabled on fields, set it here
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
        module.is_enabled = newValue;
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
          perm.is_enabled = newValue;
        }
      }
      if (perm) recalcUp('module', perm.module_id as string);
    } else if (type === 'menu') {
      const menu = index.menu.get(id);
      const mods = getModulesForMenu(id);
      if (menu) menu.is_enabled = mods.some((m) => m.is_enabled);
    }
  }

  function getCurrentData(item: string, itemType: ProfileType) {
    const idField = itemType === 'permission' ? 'permission_id' : 'module_id';
    return all.find(
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
      const findMenu = all.find((data) => data.menu_id === menu);
      if (findMenu) {
        findMenu.is_enabled = isEnabled;
      }
    });
    // Removed all Relvant module
    currentItem?.depended_by_module?.forEach((module) => {
      const findModule = all.find((data) => data.module_id === module);
      if (findModule) {
        findModule.is_enabled = isEnabled;
      }
    });
    // Removed all Relvant permissions
    currentItem?.depended_by_permission?.forEach((permission) => {
      const findPermission = all.find(
        (data) => data.permission_id === permission
      );
      if (findPermission) {
        findPermission.is_enabled = isEnabled;
      }
      // Remove all Fields when permission Remove
      getFieldsForPermission(findPermission?.permission_id || '').forEach(
        (f) => {
          f.read = isEnabled;
          f.edit = isEnabled;
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
      const findMenu = all.find(
        (data) => data.menu_id === menu && data.type === 'menu'
      );
      if (findMenu) {
        findMenu.is_enabled = isEnabled;
      }
    });
    // Enabled all Relvant module
    currentItem?.depends_on_module?.forEach((module) => {
      const findModule = all.find(
        (data) => data.module_id === module && data.type === 'module'
      );
      if (findModule) {
        findModule.is_enabled = isEnabled;
      }
    });
    // Enabled all Relvant permissions
    currentItem?.depends_on_permission?.forEach((permission) => {
      const findPermission = all.find(
        (data) =>
          data.permission_id === permission && data.type === 'permission'
      );
      if (findPermission) {
        findPermission.is_enabled = isEnabled;
      }
      // Enable all Fields when permission enabled
      getFieldsForPermission(findPermission?.permission_id || '').forEach(
        (f) => {
          f.read = isEnabled;
          f.edit = isEnabled;
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
    propagateDown('menu', menu_id, isEnabled);
    dependsOnByImplement(isEnabled);
    return all;
  }

  function toggleModule(module_id: string, isEnabled: boolean) {
    const mod = index.module.get(module_id);
    if (!mod) throw new Error('no module ' + module_id);
    mod.is_enabled = isEnabled;
    if (!collectModulesRef.current.includes(module_id)) {
      collectModulesRef.current = collectModulesRef.current.concat(module_id);
    }
    propagateDown('module', module_id, isEnabled);
    recalcUp('menu', mod.menu_id as string);
    dependsOnByImplement(isEnabled);
    return all;
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
    propagateDown('permission', permission_id, isEnabled);
    recalcUp('permission', permission_id as string); // always recalc upward, regardless of children
    dependsOnByImplement(isEnabled);
    return all;
  }

  function toggleField(field_id: string, isEnabled: boolean) {
    const field = index.field.get(field_id);
    if (!field) throw new Error('no field ' + field_id);
    field.read = isEnabled;
    field.edit = isEnabled;
    recalcUp('permission', field.permission_id as string);
    dependsOnByImplement(isEnabled);
    return all;
  }

  const handleChange = (value: boolean, id: string, type: ProfileType) => {
    if (type === 'menu') {
      const out = toggleMenu(id, value);
      setMenus(transformData(out));
    } else if (type === 'module') {
      const out = toggleModule(id, value);
      setMenus(transformData(out));
    } else if (type === 'permission') {
      const out = togglePermission(id, value);
      setMenus(transformData(out));
    } else if (type === 'field') {
      const out = toggleField(id, value);
      setMenus(transformData(out));
    }
  };

  const menuExpand = (id: string) => {
    setExpandMenus((prev) =>
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    );
  };

  return (
    <div className='p-10'>
      {menus.map((menu, i) => {
        return (
          <span key={i} className='block'>
            <span
              className={`transform transition-transform duration-200 inline-flex ${expandMenus.includes(menu.menu_id) ? 'rotate-90' : ''}`}
              onClick={() => menuExpand(menu.menu_id)}
            >
              <ModuleArrowRight
                alt='module arrow'
                className='h-4 w-4 rounded'
              />
            </span>
            <ChekBox
              data={menu}
              key={i}
              handleChange={(value) =>
                handleChange(value, menu.menu_id, 'menu')
              }
              value={menu.is_enabled}
            />
            &nbsp;&nbsp;&nbsp;&nbsp;
            {menu.modules.map((module, j) => {
              return (
                <span className='block pl-6' key={j}>
                  |-
                  <span
                    className={`transform transition-transform duration-200 inline-flex ${expandMenus.includes(module.module_id) ? 'rotate-90' : ''}`}
                    onClick={() => menuExpand(module.module_id)}
                  >
                    <ModuleArrowRight
                      alt='module arrow'
                      className='h-4 w-4 rounded'
                    />
                  </span>
                  <ChekBox
                    data={module}
                    key={j}
                    handleChange={(value) =>
                      handleChange(value, module.module_id, 'module')
                    }
                    value={module.is_enabled}
                  />
                  {module.permission.map((permission, k) => {
                    return (
                      <span className='block' key={k}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|--
                        <span
                          className={`transform transition-transform duration-200 inline-flex ${expandMenus.includes(permission.permission_id) ? 'rotate-90' : ''}`}
                          onClick={() => menuExpand(permission.permission_id)}
                        >
                          <ModuleArrowRight
                            alt='module arrow'
                            className='h-4 w-4 rounded'
                          />
                        </span>
                        <ChekBox
                          data={permission}
                          key={k}
                          handleChange={(value) =>
                            handleChange(
                              value,
                              permission.permission_id,
                              'permission'
                            )
                          }
                          value={permission.is_enabled}
                        />{' '}
                        [{permission.name}]
                        <div className='pl-20'>
                          {permission.field.map((field, l) => {
                            return (
                              <span key={l} className='inline-block'>
                                |--
                                <ChekBox
                                  data={field}
                                  key={l}
                                  handleChange={(value) =>
                                    handleChange(value, field.field_id, 'field')
                                  }
                                  value={field.read}
                                />
                                &nbsp;&nbsp;&nbsp;&nbsp;
                              </span>
                            );
                          })}
                        </div>
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

interface ChekBoxProps {
  data: Field | Permission | TransformForRender | Module;
  value: boolean;
  handleChange: (value: boolean) => void;
}

const ChekBox: React.FC<ChekBoxProps> = ({ data, value, handleChange }) => {
  return (
    <label htmlFor={data.rid}>
      {' '}
      <input
        type='checkbox'
        name={data.name}
        id={data.rid}
        onChange={(e) => handleChange(e.target.checked)}
        checked={value}
      />
      {data.desc}
    </label>
  );
};
