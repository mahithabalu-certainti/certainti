import { getMainPool, getOrgPool, getOrgSchema, findOrgSchemaForProject } from '../config/database';
import { logMessage } from '../utils/logger';
import { generateSasUrl } from '../utils/blobHelper';

const MAIN = 'trd365';

// In-memory schema cache to avoid repeated lookups
const schemaCache = new Map<string, string>();

// Cache: project_fiscal_rid -> actual project_rid (from main DB project_fiscal_summary)
const projectRidCache = new Map<string, string>();

/**
 * Resolve actual project_rid from a project_fiscal_rid.
 * The URL param `projectid` in the FE is `project_fiscal_rid` (rid of project_fiscal table).
 * The org DB queries need the actual `project_rid` (rid of project table).
 */
export async function resolveActualProjectRid(projectFiscalRid: string): Promise<string | null> {
  if (projectRidCache.has(projectFiscalRid)) return projectRidCache.get(projectFiscalRid)!;

  const pool = getMainPool();
  try {
    const res = await pool.query(
      `SELECT project_rid FROM ${MAIN}.project_fiscal_summary WHERE project_fiscal_rid = $1 LIMIT 1`,
      [projectFiscalRid]
    );
    const projectRid = res.rows[0]?.project_rid || null;
    if (projectRid) projectRidCache.set(projectFiscalRid, projectRid);
    return projectRid;
  } catch (err: any) {
    logMessage(`resolveActualProjectRid error: ${err.message}`);
    return null;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getAccountRNumber(accountRid: string): Promise<string | null> {
  const pool = getMainPool();
  const res = await pool.query(
    `SELECT r_number FROM ${MAIN}.account WHERE rid = $1 LIMIT 1`,
    [accountRid]
  );
  return res.rows[0]?.r_number || null;
}

async function getAccountSchemaRNumber(accountRid: string): Promise<string | null> {
  const pool = getMainPool();
  const res = await pool.query(
    `SELECT r_number, storage_type, parent_account_rid
     FROM ${MAIN}.account
     WHERE rid = $1
     LIMIT 1`,
    [accountRid]
  );
  const account = res.rows[0];
  if (!account) return null;

  if (account.storage_type === 'store_in_parent' && account.parent_account_rid) {
    const parentRes = await pool.query(
      `SELECT r_number FROM ${MAIN}.account WHERE rid = $1 LIMIT 1`,
      [account.parent_account_rid]
    );
    return parentRes.rows[0]?.r_number || account.r_number || null;
  }

  return account.r_number || null;
}

/**
 * Resolve org schema for a project.
 * First tries account r_number -> schema. If that schema doesn't have the project,
 * falls back to scanning all org schemas to find where the project lives.
 */
async function resolveOrgSchema(projectRid: string, accountRid: string): Promise<string | null> {
  // Check cache first
  if (schemaCache.has(projectRid)) return schemaCache.get(projectRid)!;

  // Try account r_number approach first
  const rNumber = await getAccountRNumber(accountRid);
  if (rNumber) {
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();
    try {
      const check = await orgPool.query(
        `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
        [schema]
      );
      if (check.rows.length > 0) {
        const projectCheck = await orgPool.query(
          `SELECT 1 FROM ${schema}.project WHERE rid = $1 LIMIT 1`,
          [projectRid]
        );
        if (projectCheck.rows.length > 0) {
          schemaCache.set(projectRid, schema);
          return schema;
        }
      }
    } catch { /* fall through to scan */ }
  }

  // Fallback: scan all schemas
  logMessage(`resolveOrgSchema: falling back to scan for project ${projectRid}`);
  const found = await findOrgSchemaForProject(projectRid);
  if (found) schemaCache.set(projectRid, found);
  return found;
}

// ─── PROJECT LEVEL QUERIES ────────────────────────────────────────────────────

export interface ProjectFilters {
  account_rid?: string | null;
  account_name?: string | null;
  project_rid?: string | null;
  project_name?: string | null;
  project_code?: string | null;
  status?: string | null;
  is_rd_qualified?: boolean | null;
  fiscal_year?: string | null;
  limit?: number;
}

/** Overview: name, status, dates, R&D qualification, QRE, costs */
export async function getProjectOverview(filters: ProjectFilters): Promise<any | null> {
  const pool = getMainPool();
  const conds: string[] = ['1=1'];
  const vals: any[] = [];
  let i = 1;

  if (filters.project_rid) { conds.push(`ps.project_rid = $${i++}`); vals.push(filters.project_rid); }
  if (filters.project_code) {
    conds.push(`(ps.project_code ILIKE $${i} OR ps.r_number ILIKE $${i} OR ps.project_r_number ILIKE $${i})`);
    vals.push(`%${filters.project_code}%`); i++;
  }
  if (filters.project_name) { conds.push(`ps.project_name ILIKE $${i++}`); vals.push(`%${filters.project_name}%`); }
  if (filters.account_rid) { conds.push(`ps.account_rid = $${i++}`); vals.push(filters.account_rid); }
  else if (filters.account_name) { conds.push(`a.account_name ILIKE $${i++}`); vals.push(`%${filters.account_name}%`); }

  const sql = `
    SELECT
      ps.project_rid AS rid, ps.r_number, ps.project_r_number, ps.project_code,
      COALESCE(ps.project_name, ps.project_code) AS project_name,
      a.account_name, s.status_name AS status,
      ps.project_startdate, ps.project_enddate,
      ps.is_rd_qualified, ps.qre, ps.assessment_status,
      ps.total_cost, ps.total_effort, ps.total_fte, ps.total_subcon, ps.total_nonlabor,
      ps.blended_rate, ps.blended_rate_fte, ps.blended_rate_subcon,
      ps.project_description, ps.program_name, ps.project_group, ps.project_client_group,
      ps.project_point_of_contact, ps.technical_point_of_contact, ps.project_point_of_contact_email
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    LEFT JOIN ${MAIN}.status s ON ps.status_rid = s.rid
    WHERE ${conds.join(' AND ')}
    ORDER BY ps.created_datetime DESC LIMIT 1`;

  logMessage(`getProjectOverview SQL: ${sql} | vals: ${JSON.stringify(vals)}`);
  const res = await pool.query(sql, vals);
  return res.rows[0] || null;
}

/** Count projects for an account or platform-wide */
export async function countProjects(filters: ProjectFilters): Promise<{ total: number; rd_qualified: number; not_rd_qualified: number; active: number }> {
  const pool = getMainPool();
  const conds: string[] = ['1=1'];
  const vals: any[] = [];
  let i = 1;

  if (filters.account_rid) { conds.push(`ps.account_rid = $${i++}`); vals.push(filters.account_rid); }
  else if (filters.account_name) { conds.push(`a.account_name ILIKE $${i++}`); vals.push(`%${filters.account_name}%`); }
  if (filters.status) { conds.push(`s.status_name ILIKE $${i++}`); vals.push(`%${filters.status}%`); }
  if (filters.is_rd_qualified !== null && filters.is_rd_qualified !== undefined) {
    conds.push(`ps.is_rd_qualified = $${i++}`); vals.push(filters.is_rd_qualified);
  }

  const sql = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE ps.is_rd_qualified = true) AS rd_qualified,
      COUNT(*) FILTER (WHERE ps.is_rd_qualified = false OR ps.is_rd_qualified IS NULL) AS not_rd_qualified,
      COUNT(*) FILTER (WHERE s.status_name ILIKE '%active%') AS active
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    LEFT JOIN ${MAIN}.status s ON ps.status_rid = s.rid
    WHERE ${conds.join(' AND ')}`;

  logMessage(`countProjects SQL: ${sql}`);
  const res = await pool.query(sql, vals);
  const row = res.rows[0];
  return {
    total: parseInt(row.total, 10),
    rd_qualified: parseInt(row.rd_qualified, 10),
    not_rd_qualified: parseInt(row.not_rd_qualified, 10),
    active: parseInt(row.active, 10),
  };
}

/** List projects with summary info */
export async function listProjects(filters: ProjectFilters): Promise<any[]> {
  const pool = getMainPool();
  const conds: string[] = ['1=1'];
  const vals: any[] = [];
  let i = 1;
  const limit = Math.min(filters.limit || 10, 50);

  if (filters.account_rid) { conds.push(`ps.account_rid = $${i++}`); vals.push(filters.account_rid); }
  else if (filters.account_name) { conds.push(`a.account_name ILIKE $${i++}`); vals.push(`%${filters.account_name}%`); }
  if (filters.project_name) { conds.push(`ps.project_name ILIKE $${i++}`); vals.push(`%${filters.project_name}%`); }
  if (filters.project_code) {
    conds.push(`(ps.project_code ILIKE $${i} OR ps.r_number ILIKE $${i})`);
    vals.push(`%${filters.project_code}%`); i++;
  }
  if (filters.status) { conds.push(`s.status_name ILIKE $${i++}`); vals.push(`%${filters.status}%`); }
  if (filters.is_rd_qualified !== null && filters.is_rd_qualified !== undefined) {
    conds.push(`ps.is_rd_qualified = $${i++}`); vals.push(filters.is_rd_qualified);
  }

  const sql = `
    SELECT
      ps.project_rid AS rid, ps.project_code,
      COALESCE(ps.project_name, ps.project_code) AS project_name,
      a.account_name, s.status_name AS status,
      ps.project_startdate, ps.project_enddate,
      ps.is_rd_qualified, ps.qre, ps.total_cost, ps.assessment_status
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    LEFT JOIN ${MAIN}.status s ON ps.status_rid = s.rid
    WHERE ${conds.join(' AND ')}
    ORDER BY ps.created_datetime DESC LIMIT ${limit}`;

  logMessage(`listProjects SQL: ${sql}`);
  const res = await pool.query(sql, vals);
  return res.rows;
}

/** Fiscal/financial breakdown by year from org DB */
export async function getProjectFiscalBreakdown(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        pf.fiscal_year, pf.project_name, pf.project_code,
        pf.total_fte_prj, pf.total_subcon_prj, pf.total_nonlabor_prj,
        pf.total_effort_prj, pf.total_cost_prj, pf.total_cost_fte_prj, pf.total_cost_subcon_prj,
        pf.blended_rate_fte, pf.blended_rate_subcon,
        pf.rd_percent_potential_ai, pf.rd_percent_final,
        pf.qre_fte, pf.qre_subcon, pf.qre_nonlabor, pf.qre_final,
        pf.rd_credits_fed_level, pf.rd_credits_total,
        pf.assessment_status, pf.is_rd_claim_qualified
      FROM ${schema}.project_fiscal pf
      WHERE pf.project_rid = $1
      ORDER BY pf.fiscal_year DESC`;

    logMessage(`getProjectFiscalBreakdown schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectFiscalBreakdown error: ${err.message}`);
    return [];
  }
}

/** Project resources from org DB */
export async function getProjectResources(projectRid: string, accountRid: string, fiscalYear?: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const conds = [`pr.project_rid = $1`];
    const vals: any[] = [projectRid];
    if (fiscalYear) { conds.push(`pr.fiscal_year = $2`); vals.push(fiscalYear); }

    const sql = `
      SELECT
        pr.rid, pr.fiscal_year,
        r.resource_name, r.resource_code,
        pr.total_hours_pro_res, pr.total_cost_pro_res,
        pr.rd_percent_final, pr.qre_final, pr.rd_credits_total,
        pr.blended_cost_project_resource_level
      FROM ${schema}.project_resource pr
      LEFT JOIN ${schema}.resources r ON pr.resource_rid = r.rid
      WHERE ${conds.join(' AND ')}
      ORDER BY pr.fiscal_year DESC, pr.total_cost_pro_res DESC
      LIMIT 50`;

    logMessage(`getProjectResources schema=${schema}`);
    const res = await orgPool.query(sql, vals);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectResources error: ${err.message}`);
    return [];
  }
}

/** Project tasks from org DB */
export async function getProjectTasks(projectRid: string, accountRid: string, fiscalYear?: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const conds = [`pt.project_rid = $1`];
    const vals: any[] = [projectRid];
    if (fiscalYear) { conds.push(`pt.fiscal_year = $2`); vals.push(fiscalYear); }

    const sql = `
      SELECT
        pt.rid, pt.task_name, pt.fiscal_year,
        pt.start_date, pt.end_date,
        pt.total_hours_pro_task, pt.total_cost_pro_task
      FROM ${schema}.project_task pt
      WHERE ${conds.join(' AND ')}
      ORDER BY pt.fiscal_year DESC, pt.total_cost_pro_task DESC
      LIMIT 50`;

    logMessage(`getProjectTasks schema=${schema}`);
    const res = await orgPool.query(sql, vals);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectTasks error: ${err.message}`);
    return [];
  }
}

/** R&D credits summary for a project */
export async function getProjectRDCredits(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        pf.fiscal_year, pf.qre_fte, pf.qre_subcon, pf.qre_nonlabor, pf.qre_final,
        pf.rd_percent_potential_ai, pf.rd_percent_adjustment, pf.rd_percent_final,
        pf.rd_credits_fte_fed_level, pf.rd_credits_subcon_fed_level,
        pf.rd_credits_nonlabor_fed_level, pf.rd_credits_fed_level, pf.rd_credits_total,
        pf.is_rd_claim_qualified, pf.assessment_status
      FROM ${schema}.project_fiscal pf
      WHERE pf.project_rid = $1
      ORDER BY pf.fiscal_year DESC`;

    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectRDCredits error: ${err.message}`);
    return [];
  }
}

// ─── ACCOUNT LEVEL QUERIES ────────────────────────────────────────────────────

export async function getAccountSummary(accountRid?: string, accountName?: string): Promise<any | null> {
  const pool = getMainPool();
  const conds: string[] = ['1=1'];
  const vals: any[] = [];
  let i = 1;

  if (accountRid) { conds.push(`ps.account_rid = $${i++}`); vals.push(accountRid); }
  else if (accountName) { conds.push(`a.account_name ILIKE $${i++}`); vals.push(`%${accountName}%`); }

  const sql = `
    SELECT
      a.account_name, a.r_number AS account_number,
      a.is_parent,
      COUNT(DISTINCT child.rid) AS child_account_count,
      COUNT(ps.project_rid) AS total_projects,
      COUNT(*) FILTER (WHERE ps.is_rd_qualified = true) AS rd_qualified_projects,
      COALESCE(SUM(ps.qre), 0) AS total_qre,
      COALESCE(SUM(ps.total_cost), 0) AS total_cost,
      COALESCE(SUM(ps.total_effort), 0) AS total_effort,
      COUNT(*) FILTER (WHERE s.status_name ILIKE '%active%') AS active_projects,
      COALESCE(SUM(ps.total_fte), 0) AS total_fte,
      COALESCE(SUM(ps.total_subcon), 0) AS total_subcon
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    LEFT JOIN ${MAIN}.account child ON child.parent_account_rid = a.rid
    LEFT JOIN ${MAIN}.status s ON ps.status_rid = s.rid
    WHERE ${conds.join(' AND ')}
    GROUP BY a.account_name, a.r_number, a.is_parent
    LIMIT 1`;

  const res = await pool.query(sql, vals);
  return res.rows[0] || null;
}

export async function getAccountResources(accountRid: string, limit = 50): Promise<any[]> {
  try {
    const rNumber = await getAccountSchemaRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        r.rid, r.resource_name, r.resource_firstname, r.resource_lastname,
        r.resource_code, r.resource_designation, r.resource_role,
        r.resource_startdate, r.resource_enddate, r.resource_orgname
      FROM ${schema}.resources r
      WHERE r.account_rid = $1
      ORDER BY r.resource_name ASC NULLS LAST, r.created_datetime DESC
      LIMIT ${limit}`;

    const res = await orgPool.query(sql, [accountRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getAccountResources error: ${err.message}`);
    return [];
  }
}

export async function getAccountCases(accountRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        cs.case_rid AS rid, cs.case_name, cs.fiscal_year,
        cs.case_total_projects, cs.case_total_project_cost,
        cs.case_total_rd_cost, cs.case_total_qre_cost,
        cs.case_total_qualified_projects, cs.case_completion_percentage,
        cs.case_startdate, cs.planned_submission_date, cs.statutory_submission_date,
        cs.submitted_datetime, cs.approved_datetime,
        s.status_name AS status
      FROM ${MAIN}.case_summary cs
      LEFT JOIN ${MAIN}.status s ON cs.status_rid = s.rid
      WHERE cs.account_rid = $1
      ORDER BY cs.created_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [accountRid, limit]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getAccountCases error: ${err.message}`);
    return [];
  }
}

export async function getAccountInteractions(accountRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        ins.rid, ins.r_number, ins.fiscal_year,
        ins.sent_on_datetime, ins.sent_to, ins.sent_by_mail_id,
        ins.response_from, ins.response_updated_on, ins.response_submitted_on,
        ins.interaction_age, ins.attachment_count,
        ins.recipient_email, ins.recipient_name,
        it.interaction_type_name, isrc.interaction_source_name,
        ist.status_name AS interaction_status
      FROM ${MAIN}.interactions_summary ins
      LEFT JOIN ${MAIN}.interaction_type it ON ins.interaction_type_rid = it.rid
      LEFT JOIN ${MAIN}.interaction_source isrc ON ins.interaction_source_rid = isrc.rid
      LEFT JOIN ${MAIN}.interaction_status ist ON ins.interaction_status_rid = ist.rid
      WHERE ins.account_rid = $1
      ORDER BY ins.sent_on_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [accountRid, limit]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getAccountInteractions error: ${err.message}`);
    return [];
  }
}

export async function getAccountMeetings(accountRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        ms.rid, ms.r_number, ms.subject,
        ms.effective_start_datetime, ms.effective_end_datetime,
        ms.meeting_participants, ms.invited_by,
        ms.recurrence_type, ms.recurrence_interval, ms.recurrence_days,
        ms.minutes_of_meeting, ms.time_zone,
        s.status_name AS status
      FROM ${MAIN}.meeting_summary ms
      LEFT JOIN ${MAIN}.status s ON ms.status_rid = s.rid
      WHERE ms.account_rid = $1
      ORDER BY ms.effective_start_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [accountRid, limit]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getAccountMeetings error: ${err.message}`);
    return [];
  }
}

export async function getAccountAttachments(accountRid: string, limit = 30): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        rid, r_number, document_name, attach_to, attachment_level,
        fiscal_year, format, size_in_mb, comments, created_datetime, browse_file
      FROM ${MAIN}.attachment_summary
      WHERE attach_to = $1
        AND attachment_level = 'account'
        AND browse_file IS NOT NULL
        AND browse_file != ''
      ORDER BY created_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [accountRid, limit]);
    const rows = await Promise.all(
      res.rows.map(async (row: any) => ({
        ...row,
        download_url: row.browse_file ? await generateSasUrl(row.browse_file) : null,
      }))
    );
    return rows;
  } catch (err: any) {
    logMessage(`getAccountAttachments error: ${err.message}`);
    return [];
  }
}

export async function getAccountNotes(accountRid: string, limit = 30): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        rid, r_number, title, descriptions, notes_owner,
        document_name, browse_file, attachment_level,
        fiscal_year, format, size_in_mb, created_datetime
      FROM ${MAIN}.notes_summary
      WHERE attach_to = $1
        AND attachment_level = 'account'
      ORDER BY created_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [accountRid, limit]);
    const rows = await Promise.all(
      res.rows.map(async (row: any) => ({
        ...row,
        download_url: row.browse_file ? await generateSasUrl(row.browse_file) : null,
      }))
    );
    return rows;
  } catch (err: any) {
    logMessage(`getAccountNotes error: ${err.message}`);
    return [];
  }
}

export async function getAccountKeyContacts(accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountSchemaRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();
    const pool = getMainPool();

    const sql = `
      SELECT
        kc.rid, kc.entity_rid, kc.entity_type,
        kc.key_contact_name, kc.key_contact_email, kc.key_contact_role,
        kc.is_primary_contact, kc.include_in_communication,
        kc.interaction_cc_recipient, kc.status_rid
      FROM ${schema}.key_contact_details kc
      WHERE kc.entity_rid = $1
        AND kc.entity_type = 'Account'
      ORDER BY kc.is_primary_contact DESC NULLS LAST, kc.key_contact_name`;

    const res = await orgPool.query(sql, [accountRid]);
    if (res.rows.length === 0) return [];

    const roleIds = [...new Set(res.rows.map((row: any) => row.key_contact_role).filter(Boolean))];
    const statusIds = [...new Set(res.rows.map((row: any) => row.status_rid).filter(Boolean))];

    const roleMap = new Map<string, string>();
    const statusMap = new Map<string, string>();

    if (roleIds.length > 0) {
      const roleRes = await pool.query(
        `SELECT rid, role_name FROM ${MAIN}.key_contact_role WHERE rid = ANY($1)`,
        [roleIds]
      );
      roleRes.rows.forEach((row: any) => roleMap.set(row.rid, row.role_name));
    }

    if (statusIds.length > 0) {
      const statusRes = await pool.query(
        `SELECT rid, status_name FROM ${MAIN}.status WHERE rid = ANY($1)`,
        [statusIds]
      );
      statusRes.rows.forEach((row: any) => statusMap.set(row.rid, row.status_name));
    }

    return res.rows.map((row: any) => ({
      ...row,
      role_name: row.key_contact_role ? roleMap.get(row.key_contact_role) || null : null,
      status_name: row.status_rid ? statusMap.get(row.status_rid) || null : null,
    }));
  } catch (err: any) {
    logMessage(`getAccountKeyContacts error: ${err.message}`);
    return [];
  }
}

// ─── CASE LEVEL QUERIES ───────────────────────────────────────────────────────

export async function getCaseSummary(accountRid?: string, caseRid?: string): Promise<any[]> {
  const pool = getMainPool();
  const conds: string[] = ['1=1'];
  const vals: any[] = [];
  let i = 1;

  if (caseRid) { conds.push(`cs.case_rid = $${i++}`); vals.push(caseRid); }
  if (accountRid) { conds.push(`cs.account_rid = $${i++}`); vals.push(accountRid); }

  const sql = `
    SELECT
      cs.case_rid AS rid, cs.case_name, cs.fiscal_year,
      cs.case_total_projects, cs.case_total_project_cost,
      cs.case_total_rd_cost, cs.case_total_qre_cost,
      cs.case_total_qualified_projects, cs.case_total_qualified_project_cost,
      cs.case_completion_percentage,
      cs.case_startdate, cs.planned_submission_date, cs.statutory_submission_date,
      cs.submitted_datetime, cs.approved_datetime,
      s.status_name AS status,
      a.account_name
    FROM ${MAIN}.case_summary cs
    LEFT JOIN ${MAIN}.status s ON cs.status_rid = s.rid
    LEFT JOIN ${MAIN}.account a ON cs.account_rid = a.rid
    WHERE ${conds.join(' AND ')}
    ORDER BY cs.created_datetime DESC
    LIMIT 20`;

  const res = await pool.query(sql, vals);
  return res.rows;
}

export async function getCaseProjects(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        cp.rid, pf.project_name, pf.project_code, pf.fiscal_year,
        cp.is_included,
        pf.qre_final, pf.rd_credits_total,
        pf.rd_percent_final, pf.assessment_status
      FROM ${schema}.case_projects cp
      LEFT JOIN ${schema}.project_fiscal pf ON cp.project_fiscal_rid = pf.rid
      WHERE cp.case_rid = $1
      ORDER BY pf.project_name`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseProjects error: ${err.message}`);
    return [];
  }
}

// ─── RESOURCES / PEOPLE ──────────────────────────────────────────────────────

/** List all resources working on a project with name, role, hours, R&D % */
export async function getProjectResourceList(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        r.resource_name, r.resource_firstname, r.resource_lastname,
        r.resource_designation, r.resource_code,
        pr.fiscal_year, pr.total_hours_pro_res, pr.total_cost_pro_res,
        pr.rd_percent_final, pr.qre_final,
        pr.start_date, pr.end_date
      FROM ${schema}.project_resource pr
      LEFT JOIN ${schema}.resources r ON pr.resource_rid = r.rid
      WHERE pr.project_rid = $1
      ORDER BY pr.fiscal_year DESC, pr.total_cost_pro_res DESC NULLS LAST
      LIMIT 100`;

    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectResourceList error: ${err.message}`);
    return [];
  }
}

/** Check if a specific person (by name) is working on a project — returns matched resource records */
export async function checkPersonOnProject(projectRid: string, accountRid: string, personName: string): Promise<{ found: boolean; resources: any[] }> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return { found: false, resources: [] };
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        r.resource_name, r.resource_firstname, r.resource_lastname,
        r.resource_designation, r.resource_code,
        pr.fiscal_year, pr.total_hours_pro_res, pr.total_cost_pro_res,
        pr.rd_percent_final, pr.qre_final,
        pr.start_date, pr.end_date
      FROM ${schema}.project_resource pr
      LEFT JOIN ${schema}.resources r ON pr.resource_rid = r.rid
      WHERE pr.project_rid = $1
        AND (
          r.resource_name ILIKE $2
          OR r.resource_firstname ILIKE $2
          OR r.resource_lastname ILIKE $2
          OR CONCAT(r.resource_firstname, ' ', r.resource_lastname) ILIKE $2
        )
      ORDER BY pr.fiscal_year DESC`;

    const res = await orgPool.query(sql, [projectRid, `%${personName}%`]);
    return { found: res.rows.length > 0, resources: res.rows };
  } catch (err: any) {
    logMessage(`checkPersonOnProject error: ${err.message}`);
    return { found: false, resources: [] };
  }
}

/** Get point of contact for a project from main DB (no org DB needed) */
export async function getProjectPointOfContact(projectRid: string): Promise<any | null> {
  const pool = getMainPool();
  const sql = `
    SELECT
      ps.project_name, ps.project_code,
      ps.project_point_of_contact, ps.technical_point_of_contact,
      ps.project_point_of_contact_email,
      a.account_name
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    WHERE ps.project_rid = $1
    LIMIT 1`;

  const res = await pool.query(sql, [projectRid]);
  return res.rows[0] || null;
}

// ─── FOUR-PART ASSESSMENT (org DB) ───────────────────────────────────────────

export async function getFourPartAssessment(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        rid, r_number, project_rid, tracker_one_liner, project_metadata, rationale, status,
        summary_judgment, rd_potential_category,
        permitted_purpose_status, permitted_purpose_rationale,
        technological_uncertainty_status, technological_uncertainty_rationale,
        technological_in_nature_status, technological_in_nature_rationale,
        process_of_experimentation_status, process_of_experimentation_rationale,
        created_datetime
      FROM ${schema}.four_part_assessment
      WHERE project_rid = $1
      ORDER BY created_datetime DESC LIMIT 10`;

    logMessage(`getFourPartAssessment schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getFourPartAssessment error: ${err.message}`);
    return [];
  }
}

// ─── TECHNICAL SUMMARY (org DB) ──────────────────────────────────────────────

export async function getTechnicalSummary(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        rid, r_number, project_rid, fiscal_year, technical_summary,
        version, generated_on, status, technical_summary_refinement_prompt
      FROM ${schema}.ai_technical_summary
      WHERE project_rid = $1
      ORDER BY fiscal_year DESC, version DESC NULLS LAST LIMIT 10`;

    logMessage(`getTechnicalSummary schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getTechnicalSummary error: ${err.message}`);
    return [];
  }
}

// ─── PROJECT ACTIVITIES (org DB) ─────────────────────────────────────────────

export async function getProjectActivities(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        rid, r_number, activity_type, subject, description,
        effective_start_datetime, effective_end_datetime, fiscal_year,
        assigned_to, priority_rid, task_name, mom, transcript,
        meeting_participants, attendees_list, caller_id, created_datetime
      FROM ${schema}.activities
      WHERE attach_to = $1
      ORDER BY effective_start_datetime DESC NULLS LAST, created_datetime DESC LIMIT 50`;

    logMessage(`getProjectActivities schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectActivities error: ${err.message}`);
    return [];
  }
}

// ─── PROJECT NOTES (org DB) ───────────────────────────────────────────────────

export async function getProjectNotes(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        rid, r_number, title, descriptions, fiscal_year,
        notes_owner, document_name, format, created_datetime
      FROM ${schema}.notes
      WHERE attach_to = $1
      ORDER BY created_datetime DESC LIMIT 30`;

    logMessage(`getProjectNotes schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectNotes error: ${err.message}`);
    return [];
  }
}

// ─── PROJECT ATTACHMENTS (main DB) ───────────────────────────────────────────

export async function getProjectAttachments(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const pool = getMainPool();

    const sql = `
      SELECT
        rid, r_number, document_name, attach_to, fiscal_year,
        format, size_in_mb, comments, created_datetime, browse_file
      FROM ${MAIN}.attachment_summary
      WHERE (attach_to = $1
         OR attach_to IN (
           SELECT project_fiscal_rid
           FROM ${MAIN}.project_fiscal_summary
           WHERE project_rid = $1
         ))
      AND browse_file IS NOT NULL
      AND browse_file != ''
      ORDER BY created_datetime DESC
      LIMIT 30`;

    logMessage(`getProjectAttachments projectRid=${projectRid} accountRid=${accountRid}`);
    const res = await pool.query(sql, [projectRid]);

    // Generate SAS tokens so download links are usable
    const rows = await Promise.all(
      res.rows.map(async (row: any) => {
        if (row.browse_file) {
          try {
            row.download_url = await generateSasUrl(row.browse_file);
          } catch {
            row.download_url = row.browse_file;
          }
        }
        return row;
      })
    );

    return rows;
  } catch (err: any) {
    logMessage(`getProjectAttachments error: ${err.message}`);
    return [];
  }
}

// ─── PROJECT CHECKLISTS (org DB) ─────────────────────────────────────────────

export async function getProjectChecklists(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        cl.rid, cl.checklist_name, cl.checklist_description, cl.fiscal_year,
        cl.assigned_to, cl.created_datetime,
        COUNT(ci.rid) AS total_items,
        COUNT(ci.rid) FILTER (WHERE ci.status_rid IS NOT NULL) AS completed_items
      FROM ${schema}.checklists cl
      LEFT JOIN ${schema}.checklist_items ci ON ci.checklist_rid = cl.rid
      WHERE cl.attach_to = $1
      GROUP BY cl.rid, cl.checklist_name, cl.checklist_description, cl.fiscal_year, cl.assigned_to, cl.created_datetime
      ORDER BY cl.created_datetime DESC LIMIT 20`;

    logMessage(`getProjectChecklists schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectChecklists error: ${err.message}`);
    return [];
  }
}

// ─── R&D ASSESSMENT HISTORY (org DB) ─────────────────────────────────────────

export async function getRDAssessmentHistory(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        fiscal_year, project_name, assessment_status,
        rd_percent_potential_ai, rd_percent_potential_ai_updated,
        rd_percent_adjustment, rd_percent_final,
        qre_final, rd_credits_total,
        is_qualified, is_rd_claim_qualified,
        signoff, claim_status,
        created_datetime, modified_datetime
      FROM ${schema}.project_fiscal
      WHERE project_rid = $1
      ORDER BY fiscal_year DESC, modified_datetime DESC NULLS LAST`;

    logMessage(`getRDAssessmentHistory schema=${schema}`);
    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getRDAssessmentHistory error: ${err.message}`);
    return [];
  }
}

// ─── INTERACTIONS (main DB summary) ──────────────────────────────────────────

export async function getProjectInteractions(projectRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  const sql = `
    SELECT
      ins.rid, ins.r_number, ins.fiscal_year,
      ins.sent_on_datetime, ins.sent_to, ins.sent_by_mail_id,
      ins.response_from, ins.response_updated_on, ins.response_submitted_on,
      ins.interaction_age, ins.attachment_count, ins.recipient_email, ins.recipient_name,
      it.interaction_type_name, isrc.interaction_source_name,
      ist.status_name AS interaction_status,
      s.status_name AS status
    FROM ${MAIN}.interactions_summary ins
    LEFT JOIN ${MAIN}.interaction_type it ON ins.interaction_type_rid = it.rid
    LEFT JOIN ${MAIN}.interaction_source isrc ON ins.interaction_source_rid = isrc.rid
    LEFT JOIN ${MAIN}.interaction_status ist ON ins.interaction_status_rid = ist.rid
    LEFT JOIN ${MAIN}.status s ON ins.status_rid = s.rid
    WHERE ins.project_rid = $1
    ORDER BY ins.sent_on_datetime DESC
    LIMIT ${limit}`;

  const res = await pool.query(sql, [projectRid]);
  return res.rows;
}

export async function getProjectMeetings(projectRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  const sql = `
    SELECT
      ms.rid, ms.r_number, ms.subject,
      ms.effective_start_datetime, ms.effective_end_datetime,
      ms.meeting_participants, ms.invited_by,
      ms.recurrence_type, ms.recurrence_interval, ms.recurrence_days,
      ms.minutes_of_meeting, ms.time_zone,
      s.status_name AS status
    FROM ${MAIN}.meeting_summary ms
    LEFT JOIN ${MAIN}.status s ON ms.status_rid = s.rid
    WHERE ms.account_rid IN (
      SELECT account_rid FROM ${MAIN}.project_summary WHERE project_rid = $1 LIMIT 1
    )
    AND ms.attach_to = $1
    ORDER BY ms.effective_start_datetime DESC
    LIMIT ${limit}`;

  const res = await pool.query(sql, [projectRid]);
  return res.rows;
}

// ─── R&D ASSESSMENT (org DB) ──────────────────────────────────────────────────

export async function getProjectRDAssessment(projectRid: string, accountRid: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        pf.fiscal_year, pf.project_name, pf.project_code,
        pf.rd_percent_potential_ai, pf.rd_percent_potential_ai_updated,
        pf.rd_percent_adjustment, pf.rd_percent_final,
        pf.qre_fte, pf.qre_subcon, pf.qre_nonlabor, pf.qre_final,
        pf.assessment_status, pf.is_qualified, pf.is_rd_claim_qualified,
        pf.signoff, pf.claim_status
      FROM ${schema}.project_fiscal pf
      WHERE pf.project_rid = $1
      ORDER BY pf.fiscal_year DESC`;

    const res = await orgPool.query(sql, [projectRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectRDAssessment error: ${err.message}`);
    return [];
  }
}

export async function getProjectResourceFiscal(projectRid: string, accountRid: string, fiscalYear?: string): Promise<any[]> {
  try {
    const schema = await resolveOrgSchema(projectRid, accountRid);
    if (!schema) return [];
    const orgPool = getOrgPool();

    const conds = [`prf.project_rid = $1`];
    const vals: any[] = [projectRid];
    if (fiscalYear) { conds.push(`prf.fiscal_year = $2`); vals.push(fiscalYear); }

    const sql = `
      SELECT
        prf.fiscal_year,
        r.resource_name, r.resource_code,
        prf.total_hours_from_tasks, prf.total_cost_from_tasks,
        prf.rd_percent_final, prf.qre_final,
        prf.qre_fte, prf.qre_subcon, prf.qre_nonlabor,
        prf.rd_credits_total, prf.rd_credits_fed_level,
        prf.blended_cost_project_resource_level,
        prf.effort_project_resource_level
      FROM ${schema}.project_resource prf
      LEFT JOIN ${schema}.resources r ON prf.resource_rid = r.rid
      WHERE ${conds.join(' AND ')}
      ORDER BY prf.fiscal_year DESC, prf.qre_final DESC NULLS LAST
      LIMIT 30`;

    const res = await orgPool.query(sql, vals);
    return res.rows;
  } catch (err: any) {
    logMessage(`getProjectResourceFiscal error: ${err.message}`);
    return [];
  }
}

// ─── PLATFORM LEVEL QUERIES ───────────────────────────────────────────────────

export async function getPlatformSummary(): Promise<any> {
  const pool = getMainPool();

  const sql = `
    SELECT
      COUNT(DISTINCT ps.account_rid) AS total_accounts,
      COUNT(ps.project_rid) AS total_projects,
      COUNT(*) FILTER (WHERE ps.is_rd_qualified = true) AS rd_qualified_projects,
      COALESCE(SUM(ps.qre), 0) AS total_qre_platform,
      COALESCE(SUM(ps.total_cost), 0) AS total_cost_platform,
      COALESCE(SUM(ps.total_effort), 0) AS total_effort_platform
    FROM ${MAIN}.project_summary ps`;

  const res = await pool.query(sql);
  return res.rows[0];
}

export async function getTopAccountsByProjects(limit = 10): Promise<any[]> {
  const pool = getMainPool();
  const sql = `
    SELECT
      a.account_name, a.r_number,
      COUNT(ps.project_rid) AS total_projects,
      COUNT(*) FILTER (WHERE ps.is_rd_qualified = true) AS rd_qualified,
      COALESCE(SUM(ps.qre), 0) AS total_qre
    FROM ${MAIN}.project_summary ps
    LEFT JOIN ${MAIN}.account a ON ps.account_rid = a.rid
    GROUP BY a.account_name, a.r_number
    ORDER BY total_projects DESC
    LIMIT ${limit}`;

  const res = await pool.query(sql);
  return res.rows;
}

// ─── CASE LEVEL QUERIES (extended) ───────────────────────────────────────────

/** Case resources — all people working across projects in a case */
export async function getCaseResources(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        r.resource_name, r.resource_firstname, r.resource_lastname,
        r.resource_designation, r.resource_code,
        cpr.fiscal_year,
        cpr.total_hours_pro_res, cpr.total_cost_pro_res,
        cpr.rd_percent_final, cpr.qre_final,
        pf.project_name, pf.project_code
      FROM ${schema}.case_project_resource cpr
      LEFT JOIN ${schema}.resources r ON cpr.resource_rid = r.rid
      LEFT JOIN ${schema}.project_fiscal pf ON cpr.project_fiscal_rid = pf.rid
      WHERE cpr.case_rid = $1
      ORDER BY cpr.fiscal_year DESC, cpr.total_cost_pro_res DESC NULLS LAST
      LIMIT 100`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseResources error: ${err.message}`);
    return [];
  }
}

/** Case tasks — all tasks across projects in a case */
export async function getCaseTasks(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        cpt.rid, cpt.task_name, cpt.fiscal_year,
        cpt.total_hours_pro_task, cpt.total_cost_pro_task,
        cpt.start_date, cpt.end_date,
        pf.project_name, pf.project_code
      FROM ${schema}.case_project_task cpt
      LEFT JOIN ${schema}.project_fiscal pf ON cpt.project_fiscal_rid = pf.rid
      WHERE cpt.case_rid = $1
      ORDER BY cpt.fiscal_year DESC, cpt.total_cost_pro_task DESC NULLS LAST
      LIMIT 100`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseTasks error: ${err.message}`);
    return [];
  }
}

/** Case team members */
export async function getCaseTeam(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        ct.rid, ct.team_member_rid,
        r.resource_name, r.resource_designation, r.resource_code
      FROM ${schema}.case_team ct
      LEFT JOIN ${schema}.resources r ON ct.team_member_rid = r.rid
      WHERE ct.case_rid = $1
      ORDER BY r.resource_name`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseTeam error: ${err.message}`);
    return [];
  }
}

/** Case key contacts */
export async function getCaseKeyContacts(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        rid, key_contact_name, key_contact_email,
        key_contact_role, is_primary_contact
      FROM ${schema}.case_key_contact_details
      WHERE case_rid = $1
      ORDER BY is_primary_contact DESC NULLS LAST, key_contact_name`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseKeyContacts error: ${err.message}`);
    return [];
  }
}

/** Case milestones / timeline */
export async function getCaseMilestones(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        cm.rid, cm.milestone_name, cm.milestone_description,
        cm.planned_date, cm.actual_date,
        s.status_name AS status
      FROM ${schema}.case_milestone cm
      LEFT JOIN ${schema}.status s ON cm.status_rid = s.rid
      WHERE cm.case_rid = $1
      ORDER BY cm.planned_date ASC NULLS LAST`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseMilestones error: ${err.message}`);
    return [];
  }
}

/** Case interactions — emails/interactions for the case */
export async function getCaseInteractions(caseRid: string, limit = 20): Promise<any[]> {
  const pool = getMainPool();
  try {
    const sql = `
      SELECT
        ins.rid, ins.r_number, ins.fiscal_year,
        ins.sent_on_datetime, ins.sent_to, ins.sent_by_mail_id,
        ins.response_from, ins.response_updated_on,
        ins.interaction_age, ins.attachment_count,
        ins.recipient_email, ins.recipient_name,
        it.interaction_type_name, isrc.interaction_source_name,
        ist.status_name AS interaction_status
      FROM ${MAIN}.interactions_summary ins
      LEFT JOIN ${MAIN}.interaction_type it ON ins.interaction_type_rid = it.rid
      LEFT JOIN ${MAIN}.interaction_source isrc ON ins.interaction_source_rid = isrc.rid
      LEFT JOIN ${MAIN}.interaction_status ist ON ins.interaction_status_rid = ist.rid
      WHERE ins.case_rid = $1
      ORDER BY ins.sent_on_datetime DESC
      LIMIT $2`;

    const res = await pool.query(sql, [caseRid, limit]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseInteractions error: ${err.message}`);
    return [];
  }
}

/** Case tasks (workflow tasks, not project tasks) */
export async function getCaseWorkflowTasks(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        ct.rid, ct.task_name, ct.task_description,
        ct.assigned_to, ct.due_date,
        s.status_name AS status,
        ct.created_datetime
      FROM ${schema}.case_task ct
      LEFT JOIN ${schema}.status s ON ct.status_rid = s.rid
      WHERE ct.case_rid = $1
      ORDER BY ct.due_date ASC NULLS LAST, ct.created_datetime DESC
      LIMIT 50`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseWorkflowTasks error: ${err.message}`);
    return [];
  }
}

/** Case history — submission/approval history */
export async function getCaseHistory(caseRid: string, accountRid: string): Promise<any[]> {
  try {
    const rNumber = await getAccountRNumber(accountRid);
    if (!rNumber) return [];
    const schema = getOrgSchema(rNumber);
    const orgPool = getOrgPool();

    const sql = `
      SELECT
        ch.rid, ch.action, ch.notes,
        ch.created_by, ch.created_datetime
      FROM ${schema}.case_history ch
      WHERE ch.case_rid = $1
      ORDER BY ch.created_datetime DESC
      LIMIT 50`;

    const res = await orgPool.query(sql, [caseRid]);
    return res.rows;
  } catch (err: any) {
    logMessage(`getCaseHistory error: ${err.message}`);
    return [];
  }
}
