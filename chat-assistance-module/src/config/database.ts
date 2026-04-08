import { Pool } from 'pg';
import { logMessage } from '../utils/logger';

// In-memory cache: projectRid -> schema name
const schemaCache = new Map<string, string>();

let mainPool: Pool | null = null;
let orgPool: Pool | null = null;

function getEnvPrefix(): string {
  return (process.env.APP_ENV || 'DEV').toUpperCase();
}

export function getMainPool(): Pool {
  if (!mainPool) {
    const env = getEnvPrefix();
    mainPool = new Pool({
      host: process.env[`${env}_MAIN_DB_HOST`],
      database: process.env[`${env}_MAIN_DB_NAME`],
      user: process.env[`${env}_MAIN_DB_USER`],
      password: process.env[`${env}_MAIN_DB_PASSWORD`],
      port: 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    mainPool.on('error', (err) => logMessage(`Main DB pool error: ${err.message}`));
    logMessage(`Main DB pool initialized [${env}]`);
  }
  return mainPool;
}

export function getOrgPool(): Pool {
  if (!orgPool) {
    const env = getEnvPrefix();
    orgPool = new Pool({
      host: process.env[`${env}_ORG_DB_HOST`],
      database: process.env[`${env}_ORG_DB_NAME`],
      user: process.env[`${env}_ORG_DB_USER`],
      password: process.env[`${env}_ORG_DB_PASSWORD`],
      port: 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    orgPool.on('error', (err) => logMessage(`Org DB pool error: ${err.message}`));
    logMessage(`Org DB pool initialized [${env}]`);
  }
  return orgPool;
}

// Derive org schema name from account r_number (e.g. ACC-00001 -> trd365_00001)
export function getOrgSchema(accountRNumber: string): string {
  const digits = accountRNumber.replace(/\D/g, '');
  return `trd365_${digits}`;
}

// Find which org schema contains a project — searches across all org schemas
export async function findOrgSchemaForProject(projectRid: string): Promise<string | null> {
  const pool = getOrgPool();
  try {
    // Get all org schemas
    const schemasRes = await pool.query(
      `SELECT DISTINCT table_schema FROM information_schema.tables
       WHERE table_schema LIKE 'trd365_%' AND table_name = 'project'
       ORDER BY table_schema`
    );
    const schemas: string[] = schemasRes.rows.map((r: any) => r.table_schema);

    for (const schema of schemas) {
      const res = await pool.query(
        `SELECT 1 FROM ${schema}.project WHERE rid = $1 LIMIT 1`,
        [projectRid]
      );
      if (res.rows.length > 0) return schema;
    }
    return null;
  } catch (err: any) {
    logMessage(`findOrgSchemaForProject error: ${err.message}`);
    return null;
  }
}
