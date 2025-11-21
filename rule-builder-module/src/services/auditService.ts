import * as AuditModel from "../models/workflowRuleAudit";

export const createAuditEntry = async (data: {
  ruleRid: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  notes?: any;
  createdBy: number;
}) => {
  return await AuditModel.createAuditEntry({
    ruleRid: data.ruleRid,
    action: data.action,
    oldValue: data.oldValue ?? null,
    newValue: data.newValue ?? null,
    notes: data.notes ?? null,
    createdBy: data.createdBy,
  });
};
