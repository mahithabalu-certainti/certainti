import { FilterType, validColumns, columnType, validColumnsForSorting } from "./types"

export const fetchCasesHeadersDatas = (schemaName : string, caseRid : string) => {
    return `
    SELECT c.rid, c.account_rid, ad.account_name, c.case_name, c.filing_type_rid,
    c.case_owner_rid, c.fiscal_year, c.status_rid, c.case_total_projects,
    c.case_total_project_cost, c.case_total_rd_cost, c.case_total_qre_cost

    FROM
    ${schemaName}.cases c
    LEFT JOIN ${schemaName}.account_details ad ON ad.account_rid = c.account_rid
    WHERE
    c.rid = '${caseRid}'
    `
}

export const fetchProjectsForCases = (schemaName : string, page : number, limit : number, sort : string, sortBy : string, filter : FilterType, accountRid : string, fiscalYear : number, pointOfContactRid : string, technicalPointOfContactRid : string, isSorting : boolean, search : string, caseRid : string, assignedApi : boolean) => {
    const offset = (page - 1) * limit
    const pagination = `LIMIT ${limit} OFFSET ${offset}`
    let sortValue : string;
    let searchValue : string;
    let filterQueryConditions : string[] = []
    let combinedFilterQuery : string = ``
    let and : string = ``

    let whereConditions : string = ``

    if(assignedApi) {
        whereConditions = `cp.case_rid = '${caseRid}'`
    } else {
        whereConditions = `pf.account_rid = '${accountRid}' AND pf.fiscal_year = ${fiscalYear}`
    }

    if(!isSorting) {
        let dynamicAlias : string = ``
        if(sort.includes(validColumnsForSorting[sort]) && validColumnsForSorting[sort] === 'project_point_of_contact') {
            dynamicAlias = `poc`
            sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`
        } else if(sort.includes(validColumnsForSorting[sort]) && validColumnsForSorting[sort] === 'project_point_of_contact') {
            dynamicAlias = `tpoc`
            sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`
        } else if(sort.includes(validColumnsForSorting[sort])) {
            dynamicAlias = `pf`
            sortValue = `ORDER BY ${dynamicAlias}.${validColumnsForSorting[sort]} ${sortBy}`
        } else sortValue = `ORDER BY pf.project_code ASC`
    } else {
        sortValue = ``
    }

    if(search) searchValue = `%${search}%`
    else searchValue = `%%`


    if(Object.keys(filter).length > 0) {
        let validKey : string;
        let dynamicAlias : string = ``
        and = ` AND `
        for(let [key, condition] of Object.entries(filter)) {
            if(Object.keys(validColumns).includes(key)) {
                validKey = validColumns[key]
                if(validKey === 'project_point_of_contact') dynamicAlias = `poc`
                else if(validKey === 'project_technical_point_of_contact') dynamicAlias = `tpoc`
                else dynamicAlias = `pf`
                for(let [cond, value] of Object.entries(condition)) {
                    switch(columnType[validKey]) {
                        case "string" : {
                            if(cond === 'equals') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} = '${value}'`)
                            }
                            if(cond === 'not_equals') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} != '${value}'`)
                            }
                            if(cond === 'contains') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} ILIKE '%${value}%'`)
                            }
                            if(cond === 'is_empty') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} IS NULL`)
                            }
                            if(cond === 'in') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} IN (${value.map((d : any) => `'${d}'`).join(',')})`)
                            }
                            break;
                        }
                        case "number" : {
                            if(cond === 'equals') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} = ${value}`)
                            }
                            if(cond === 'not_equals') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} != ${value}`)
                            }
                            if(cond === 'greater_than') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} > ${value}`)
                            }
                            if(cond === 'less_than') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} < ${value}`)
                            }    
                            if(cond === 'is_empty') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} IS NULL`)
                            }
                            if(cond === 'between') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} BETWEEN ${value.map((d : any) => d).join(' AND ')}`)
                            }
                            break;                         
                        }
                        case "date" : {
                            if(cond === 'equals') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} = '${value}'`)
                            }
                            if(cond === 'after') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} > '${value}'`)
                            }
                            if(cond === 'before') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} < '${value}'`)
                            }    
                            if(cond === 'is_empty') {
                                filterQueryConditions.push(`${dynamicAlias}.${validKey} IS NULL`)
                            }
                            if(cond === 'between') {
                                filterQueryConditions.push(`DATE(${dynamicAlias}.${validKey}) BETWEEN ${value.map((d : any) => `'${d}'`).join(' AND ')}`)
                            }
                            break;        
                        }
                    }
                }
            }
        }
    }
    else {
        and = ` `
        filterQueryConditions = []
    }
    if(filterQueryConditions.length > 0) {
        combinedFilterQuery = filterQueryConditions.join('AND')
    } else {
        combinedFilterQuery = ` `
    }

    let query = 
    `
    WITH fetch_all_prj_ids AS (
    SELECT pf.rid 
    FROM ${schemaName}.project_fiscal pf
    WHERE
    pf.account_rid = '${accountRid}' AND pf.fiscal_year = ${fiscalYear}
    ),
    fetch_project_point_of_contact AS (
    SELECT pf.rid, kc.key_contact_name AS project_point_of_contact
    FROM 
    ${schemaName}.key_contact_details kc
    LEFT JOIN fetch_all_prj_ids pf ON pf.rid = kc.entity_rid
    WHERE
    kc.entity_rid IN (pf.rid)
    AND
    kc.key_contact_role = '${pointOfContactRid}'
    ),

    fetch_project_technical_point_of_contact AS (
    SELECT pf.rid, kc.key_contact_name AS project_technical_point_of_contact
    FROM 
    ${schemaName}.key_contact_details kc
    LEFT JOIN fetch_all_prj_ids pf ON pf.rid = kc.entity_rid
    WHERE
    kc.entity_rid IN (pf.rid)
    AND
    kc.key_contact_role = '${technicalPointOfContactRid}'
    ), 

    fetch_projects AS (
    SELECT pf.rid, pf.project_code, pf.project_name, pf.project_type_rid, 
    pf.fiscal_year, pf.project_classification_rid, pf.project_client_group,
    pf.project_group, pf.total_effort_prj, pf.total_cost_prj, pf.total_cost_fte_prj,
    pf.total_cost_subcon_prj, pf.total_cost_nonlabor_prj, pf.assessment_status,
    pf.rd_percent_final, pf.qre_final, pf.comments, pf.modified_datetime, pf.r_number,
    poc.project_point_of_contact, tpoc.project_technical_point_of_contact, pf.account_rid,
    pf.project_rid,
    CASE WHEN cp.project_fiscal_rid = pf.rid AND cp.case_rid = '${caseRid}' THEN true ELSE FALSE END AS is_project_added
    FROM
    ${schemaName}.project_fiscal pf
    LEFT JOIN fetch_project_point_of_contact poc ON poc.rid = pf.rid
    LEFT JOIN fetch_project_technical_point_of_contact tpoc ON tpoc.rid = pf.rid
    LEFT JOIN fetch_all_prj_ids fp ON fp.rid = pf.rid
    LEFT JOIN ${schemaName}.case_projects cp ON cp.project_fiscal_rid = pf.rid
    WHERE
    ${whereConditions}
    AND
    (pf.project_code ILIKE '${searchValue}' OR pf.project_name ILIKE '${searchValue}' OR pf.r_number ILIKE '${searchValue}')
    ${and}
    ${combinedFilterQuery}
    ${sortValue}
    ),

    total_projects AS (
    SELECT t.*, COUNT(t.*) OVER() AS total_result FROM fetch_projects t
    ),

    paginated_projects AS (
    SELECT * FROM total_projects ${pagination}
    )
    SELECT * FROM paginated_projects
    `
    return query;
}