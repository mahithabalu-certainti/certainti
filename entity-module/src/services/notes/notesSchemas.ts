export interface ICreateNotesSchema {
    browse_file: string | null,
    account_rid: string,
    document_name: string | null,
    attach_to: string,
    attachment_level: string,
    fiscal_year: number,
    format: string | null,
    size_in_mb: number | null,
    title: string,
    notes_owner: string,
    descriptions : string,
}

export interface IUpdateNotesSchema {
    rid : string,
    browse_file: string | null,
    account_rid: string,
    document_name: string | null,
    attach_to: string,
    attachment_level: string,
    fiscal_year: number,
    format: string | null,
    size_in_mb: number | null,
    title: string,
    notes_owner: string,
    descriptions : string,
}