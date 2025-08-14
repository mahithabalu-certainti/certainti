export const getUserGroupUserCount = (schemaName: string): string => {
  return `
    SELECT COUNT(*)
    FROM "${schemaName}".user_group_mapping AS ugm
    INNER JOIN "${schemaName}".user AS u ON ugm.user_rid = u.rid
    INNER JOIN "${schemaName}".status AS s ON u.status_rid = s.rid
    WHERE ugm.group_rid = "UserGroup".rid
    AND s.status_name = 'Active'
  `;
};
