import { Sequelize } from "sequelize";
import { IKeyContactDetail, IUpdateKeyContactDetail } from "../utils/types";

export class KeyContactService {
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

    if (keyContacts) {
      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequlize.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
      }));

      const technicalContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Technical Consultant" && e.is_primary_contact
      );
      const financialContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Financial Consultant" && e.is_primary_contact
      );
      const pointOfContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Client Project Point of Contact" && e.is_primary_contact
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
    } else {
      return {
        technicalConsultant: null,
        financialConsultant: null,
        projectPointOfContact: null,
      };
    }

    return { technicalConsultant, financialConsultant, projectPointOfContact };
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
          status: keyContactDetails.status || "Active",
          is_primary_contact:
            keyContactDetails.is_primary_contact === null
              ? null
              : keyContactDetails.is_primary_contact,
          include_in_communication:
            keyContactDetails.is_primary_contact === null
              ? null
              : keyContactDetails.is_primary_contact,
          modified_by: userId,
        },
        {
          where: {
            rid: keyContactDetails.rid,
          },
        }
      );
    } catch (error) {
      console.error("Error updating key contact details:", error);
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
        status: keyContactDetails.status || null,
        is_primary_contact: keyContactDetails.is_primary_contact || null,
        include_in_communication:
          keyContactDetails.include_in_communication || null,
        entity_rid: project_rid,
        created_by: userId,
        modified_by: userId,
        entity_type: "Project",
      });
    } catch (error) {
      console.error("Error inserting key contact details:", error);
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

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequelize.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
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
          technical_point_of_contact: findPrimary("Technical Consultant"),
          financial_consultant: findPrimary("Financial Consultant"),
          project_point_of_contact: findPrimary("Client Project Point of Contact"),
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
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }
}
