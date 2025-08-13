export interface IInteractionService {
    listInteractionPrjAccount(data : any) : Promise<any>
    fetchInteractionSummary(data : any) : Promise<{ statusCodeValue : string,data : any}>
}