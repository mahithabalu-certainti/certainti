export interface ICreateNotesSchema {
    browse_file: string,
    account_rid: string,
    document_name: string,
    attach_to: string,
    attachment_level: string,
    fiscal_year: number,
    format: string,
    size_in_mb: number,
    title: string,
    notes_owner: string,
    descriptions : string,
}

export interface IUpdateNotesSchema {
    rid : string,
    browse_file: string,
    account_rid: string,
    document_name: string,
    attach_to: string,
    attachment_level: string,
    fiscal_year: number,
    format: string,
    size_in_mb: number,
    title: string,
    notes_owner: string,
    descriptions : string,
}