import { Sequelize } from "sequelize";
import { IKeyContactDetail, IUpdateKeyContactDetail } from "../utils/types";
import { primaryKeyContacts, rawQueries, STATUS_MESSAGE } from "../utils/constants";
import { logMessage } from "../utils/helpers";
import { Logger } from "winston";
import { CaseStatusResult } from "../utils/types";
import { initMainDbSequelize } from "../config/mainDataSource";

export class KeyContactService {

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async manageKeyContacts(
    key_contacts: IKeyContactDetail,
    projectId: string,
    userId: string,
    KeyContact: any
  ) {
    for (const contact of Object.values(key_contacts)) {
      if (contact.action_type === "edit") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          this.updateKeyContactDetails(contact, userId, KeyContact);
        }
      } else if (contact.action_type === "delete") {
        {
          this.deleteKeyContactDetails(contact.rid, projectId, KeyContact);
        }
      } else if (contact.action_type === "add") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          this.insertKeyContactDetails(KeyContact, contact, projectId, userId);
        }
      }
    }
  }

  async calculateKeyContactDetails(keyContacts: any[], mainDbSequlize: any) {
    let technicalConsultant = "-";
    let financialConsultant = "-";
    let projectPointOfContact = "-";
    let projectPointOfContactEmail = '-';
    let isEmailRecipient = false;

    if (keyContacts) {
      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);
      const statusIds = [
        ...new Set(keyContacts.map((r: any) => r.status_rid)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};
      let statusMap: Record<string, string> = {};
      let keyContactRoleMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequlize.query(
          rawQueries.fetchKeyContactsByIds(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );

        keyContactRoleMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.role_map, c.role_name])
        );
      }
      if (statusIds.length > 0) {
        const statusRows = await mainDbSequlize.query(
          rawQueries.fetchStatusByIds(),
          {
            replacements: { ids: statusIds },
            type: "SELECT",
          }
        );

        statusMap = Object.fromEntries(
          statusRows.map((s: any) => [s.rid, s.status_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
        status_name: statusMap[kc.status_rid] || null,
        role_map: keyContactRoleMap[kc.key_contact_role] || null,
      }));
      const technicalContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === keyContactRoleMap[primaryKeyContacts.technical_point_of_contact] && e.is_primary_contact
      );
      const financialContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === keyContactRoleMap[primaryKeyContacts.financial_consultant] && e.is_primary_contact
      );
      const pointOfContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === keyContactRoleMap[primaryKeyContacts.project_point_of_contact] && e.is_primary_contact
      );

      const isEmailRecipientInfo = enrichedKeyContacts.some(
        (e: any) => e.include_in_communication === true && e.status_name === STATUS_MESSAGE.active
      );

      technicalConsultant = technicalContact
        ? technicalContact.key_contact_name
        : null;
      financialConsultant = financialContact
        ? financialContact.key_contact_name
        : null;
      projectPointOfContact = pointOfContact
        ? pointOfContact.key_contact_name
        : null;
      projectPointOfContactEmail = pointOfContact
        ? pointOfContact.key_contact_email
        : null;
      isEmailRecipient = isEmailRecipientInfo || false;
    } else {
      return {
        technicalConsultant: null,
        financialConsultant: null,
        projectPointOfContact: null,
        projectPointOfContactEmail: null,
        isEmailRecipient: false
      };
    }

    return { technicalConsultant, financialConsultant, projectPointOfContact, projectPointOfContactEmail, isEmailRecipient };
  }

  async deleteKeyContactDetails(
    key_contact_id: string,
    project_rid: string,
    KeyContactModel: any
  ) {
    await KeyContactModel.destroy({
      where: {
        rid: key_contact_id,
      },
    });
  }

  async updateCaseKeyContactDetails(
    key_contact: IUpdateKeyContactDetail,
    userId: string,
    CaseKeyContactDetails: any,
    Case: any,
    projectCaseMapping: any[]
  ) {
    try {

      if (projectCaseMapping.length > 0) {
        for (const caseMapping of projectCaseMapping) {

          const caseData = await Case.findOne({
            where: {
              rid: caseMapping.case_rid,
            },
          });

          if (!caseData) {
            continue;
          }
          const mainSequelize = await initMainDbSequelize();

          const caseStatus = await mainSequelize.query(
            rawQueries.fetchCaseStatusByRid(caseData.status_rid),
            {
              type: "SELECT",
            }
          ) as CaseStatusResult[];

          if (caseStatus[0]?.status_name === "Closed") {
            continue;
          }

          const keyContactDetails = key_contact;

          await CaseKeyContactDetails.update(
            {
              key_contact_name: keyContactDetails.key_contact_name || null,
              key_contact_email: keyContactDetails.key_contact_email || null,
              key_contact_role: keyContactDetails.key_contact_role || null,
              status_rid: keyContactDetails.status_rid,
              interaction_cc_recipient:
                keyContactDetails.interaction_cc_recipient === null
                  ? null
                  : keyContactDetails.interaction_cc_recipient,
              is_primary_contact:
                keyContactDetails.is_primary_contact === null
                  ? null
                  : keyContactDetails.is_primary_contact,
              include_in_communication:
                keyContactDetails.include_in_communication === null
                  ? null
                  : keyContactDetails.include_in_communication,
              modified_by: userId,
            },
            {
              where: {
                key_contact_rid: keyContactDetails.rid,
              },
            }
          );
        }

      }


    } catch (error) {
      logMessage(`Error updating key contact details: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
  async updateKeyContactDetails(
    key_contact: IUpdateKeyContactDetail,
    userId: string,
    KeyContact: any
  ) {
    try {
      const keyContactDetails = key_contact;

      await KeyContact.update(
        {
          key_contact_name: keyContactDetails.key_contact_name || null,
          key_contact_email: keyContactDetails.key_contact_email || null,
          key_contact_role: keyContactDetails.key_contact_role || null,
          status_rid: keyContactDetails.status_rid,
          interaction_cc_recipient:
            keyContactDetails.interaction_cc_recipient === null
              ? null
              : keyContactDetails.interaction_cc_recipient,
          is_primary_contact:
            keyContactDetails.is_primary_contact === null
              ? null
              : keyContactDetails.is_primary_contact,
          include_in_communication:
            keyContactDetails.include_in_communication === null
              ? null
              : keyContactDetails.include_in_communication,
          modified_by: userId,
        },
        {
          where: {
            rid: keyContactDetails.rid,
          },
        }
      );
    } catch (error) {
      logMessage(`Error updating key contact details: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async insertKeyContactDetails(
    KeyContactModel: any,
    keyContacts: IKeyContactDetail,
    project_rid: string,
    userId: string
  ) {
    try {
      const keyContactDetails = keyContacts;
      await KeyContactModel.create({
        key_contact_name: keyContactDetails.key_contact_name || null,
        key_contact_email: keyContactDetails.key_contact_email || null,
        key_contact_role: keyContactDetails.key_contact_role || null,
        status_rid: keyContactDetails.status_rid || null,
        is_primary_contact: keyContactDetails.is_primary_contact || null,
        interaction_cc_recipient: keyContactDetails.interaction_cc_recipient || null,
        include_in_communication:
          keyContactDetails.include_in_communication === null ? null : keyContactDetails.include_in_communication,
        entity_rid: project_rid,
        created_by: userId,
        entity_type: "Project",
      });
    } catch (error) {
      logMessage(`Error inserting key contact details: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async insertKeyRole(
    projects: any[],
    mainDbSequelize: Sequelize
  ): Promise<any[]> {
    try {
      const allKeyContacts = projects.flatMap((p) => [
        ...(p.keyContact || []),
        ...(p.ProjectFiscal || []).flatMap(
          (child: any) => child.keyContact || []
        ),
      ]);

      const keyContactIds = Array.from(
        new Set(
          allKeyContacts.map((r: any) => r.key_contact_role).filter(Boolean)
        )
      );

      let keyContactMap: Record<string, string> = {};
      let keyContactRoleMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequelize.query(
          rawQueries.fetchKeyContactsByIds(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          (Array.isArray(keyContactRows) ? keyContactRows : []).map(
            (row: any) => [row.rid, row.role_name]
          )
        );
        keyContactRoleMap = Object.fromEntries(
          (Array.isArray(keyContactRows) ? keyContactRows : []).map(
            (row: any) => [row.role_map, row.role_name]
          )
        );
      }

      const enrichKeyContacts = (keyContacts: any[] = []) => {
        const enriched = keyContacts.map((kc: any) => ({
          ...kc,
          role_name: keyContactMap[kc.key_contact_role] || null,
        }));

        const findPrimary = (roleName: string) =>
          enriched.find(
            (kc) => kc.role_name === roleName && kc.is_primary_contact
          )?.key_contact_name || null;

        return {
          keyContact: [],
          technical_point_of_contact: findPrimary(keyContactRoleMap["technical_point_of_contact"]),
          financial_consultant: findPrimary(keyContactRoleMap["financial_consultant"]),
          project_point_of_contact: findPrimary(keyContactRoleMap["project_point_of_contact"]),
        };
      };

      return projects.map((project) => {
        const baseProject =
          typeof project.toJSON === "function" ? project.toJSON() : project;

        const enrichedParent = enrichKeyContacts(baseProject.keyContact);

        let enrichedChildren: any[] = [];

        if (Array.isArray(baseProject.ProjectFiscal)) {
          enrichedChildren = baseProject.ProjectFiscal.map((child: any) => {
            const baseChild =
              typeof child.toJSON === "function" ? child.toJSON() : child;

            const enrichedChild = enrichKeyContacts(baseChild.keyContact);

            return {
              ...baseChild,
              ...enrichedChild,
            };
          });
        }

        return {
          ...baseProject,
          ...enrichedParent,
          ProjectFiscal: enrichedChildren,
        };
      });
    } catch (err) {
      logMessage(`Error enriching key roles: ${err instanceof Error ? err.message : err}`);
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }
}
