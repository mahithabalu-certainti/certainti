import { UserDetails } from "../models/userDetailsModel";
import { User, Profile, BusinessTeams } from "../models/index";
import { constants } from "../utils/constant";
import { IUpdateUserData, IUserData } from "../utils/types";
import { Op, WhereOptions } from "sequelize";
import Department from "../models/departmentModel";
import FunctionGroup from "../models/functionGroupModel";

class UserService {
  private accountRepository: typeof User | null = null;

  /**
   * Retrieves the User model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof User} - The model for User entities.
   */
  getAccountRepository(): typeof User {
    if (!this.accountRepository) {
      this.accountRepository = User;
    }
    return this.accountRepository;
  }

  async createUser(userData: IUserData, azureId: string) {
    try {
      const {
        first_name,
        last_name,
        email,
        profile_id,
        status,
        street,
        city,
        state,
        zip_code,
        country,
        role,
        middle_name,
        created_by,
        organization,
      } = userData;

      const repository = this.getAccountRepository();

      const user = await repository.create({
        azure_id: azureId,
        first_name,
        last_name,
        email,
        profile_rid: profile_id,
        status,
        street,
        city,
        state,
        zip_code,
        country,
        role_rid: role,
        middle_name,
        full_name:
          first_name + (middle_name ? " " + middle_name : "") + " " + last_name,
        created_by,
      });

      if (organization === constants.PLATFORM_ONE) {
        this.createUserDetails(userData, user.rid);
      }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          user,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
        error: (err as Error).message,
      };
    }
  }

  async updateUser(userData: IUpdateUserData, userId: string) {
    try {
      const {
        first_name,
        last_name,
        profile_id,
        status,
        street,
        city,
        state,
        zip_code,
        country,
        role,
        middle_name,
        organization,
        updated_by,
      } = userData;

      const repository = this.getAccountRepository();

      const user = await repository.findOne({ where: { rid: userId } });

      if (!user) {
        return {
          statusCode: constants.FAILED,
          message: "User not found",
        };
      }

      const updatedData = await repository.update(
        {
          first_name,
          last_name,
          profile_rid: profile_id,
          status,
          street,
          city,
          state,
          zip_code,
          country,
          role_rid: role,
          middle_name,
          modified_by: updated_by,
        },
        {
          where: {
            rid: userId,
          },
        }
      );

      if (organization === constants.PLATFORM_ONE) {
        this.updateUserDetails(userData, userId);
      }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          user: updatedData,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
      };
    }
  }

  async createUserDetails(userData: IUserData, userId: string) {
    const {
      department_id,
      designation,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      employee_id,
      function_group_id,
      mobile,
    } = userData;

    await UserDetails.create({
      user_id: userId,
      department_id,
      designation,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      employee_id,
      function_group_id,
      mobile,
    });
  }

  async updateUserDetails(userData: IUpdateUserData, userId: string) {
    const {
      department_id,
      designation,
      employee_id,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      function_group_id,
      mobile,
    } = userData;

    await UserDetails.update(
      {
        department_id,
        designation,
        employment_date,
        manager_email,
        manager_employee_id,
        manager_name,
        employee_id,
        function_group_id,
        mobile,
      },
      {
        where: {
          user_id: userId,
        },
      }
    );
  }

  async listUsers(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    organization: string
  ) {
    try {
      let users = null;
      const offset = (page - 1) * limit;

      const whereClause = this.buildWhereClause(filters, search);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      if (organization == constants.PLATFORM_TWO) {
        users = await this.fetchUser(
          whereClause,
          limit,
          offset,
          finalSortBy,
          finalSortOrder
        );
      } else {
        users = await this.fetchUserDetails(
          whereClause,
          limit,
          offset,
          finalSortBy,
          finalSortOrder
        );
      }
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          users,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async listUserById(userId: string, organization: string) {
    try {
      let users = null;
      if (organization === constants.PLATFORM_TWO) {
        users = await User.findAll({
          where: {
            rid: userId,
          },
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["profile_name"],
              required: true,
            },
            {
              model: BusinessTeams,
              as: "business_teams",
              attributes: ["business_teams"],
              required: true,
            },
          ],
        });
      } else {
        users = UserDetails.findAll({
          where: {
            user_id: userId,
          },
          include: [
            {
              model: User,
              required: true,
            },
            {
              model: Department,
              attributes: ["department_name"],
              required: true,
            },
            {
              model: FunctionGroup,
              attributes: ["function_group_name"],
              required: true,
            },
          ],
        });
      }
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          users,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  async roles() {
    try {
      const roles = await BusinessTeams.findAll();
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          roles,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
      };
    }
  }

  async profiles() {
    try {
      const profiles = await Profile.findAll();
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profiles,
        },
      };
    } catch (err) {
      return {
        statusCode: constants.FAILED,
        message: constants.FAILED_MESSAGE,
      };
    }
  }

  async fetchUser(
    whereClause: Record<string, any>,
    limit: number,
    offset: number,
    sortBy: string,
    sortOrder: string
  ) {
    return await User.findAll({
      where: whereClause,
      attributes: ["rid", "email", "status", "full_name", "first_name"],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["profile_name"],
          required: true,
        },
        {
          model: BusinessTeams,
          as: "business_teams",
          attributes: ["business_teams"],
          required: true,
        },
      ],
    });
  }

  async fetchUserDetails(
    whereClause: Record<string, any>,
    limit: number,
    offset: number,
    sortBy: string,
    sortOrder: string
  ) {
    return await UserDetails.findAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          required: true,
        },
        {
          model: Department,
          attributes: ["department_name"],
          required: true,
        },
        {
          model: FunctionGroup,
          attributes: ["function_group_name"],
          required: true,
        },
      ],
    });
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): Record<string, any> {
    let whereClause: Record<string, any> = {};

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { "$business_teams.business_teams$": { [Op.iLike]: `%${search}%` } },
        ],
      };

      if (Object.keys(whereClause).length > 0) {
        whereClause = {
          [Op.and]: [whereClause, searchCondition],
        };
      } else {
        whereClause = searchCondition;
      }
    }

    const filterFields = [
      { clientField: "user_name", dbField: "first_name" },
      { clientField: "full_name", dbField: "full_name" },
      { clientField: "email", dbField: "email" },
      { clientField: "status", dbField: "status" },
    ];

    filterFields.forEach((fieldMapping) => {
      const { clientField, dbField } = fieldMapping;

      if (filters[clientField]) {
        const fieldFilter = filters[clientField];

        if (fieldFilter.startsWith) {
          whereClause[dbField] = { [Op.iLike]: `${fieldFilter.startsWith}%` };
        } else if (fieldFilter.endWith) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.endWith}` };
        } else if (fieldFilter.contains) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.contains}%` };
        } else if (fieldFilter.value) {
          whereClause[dbField] = fieldFilter.value;
        }
      }
    });

    if (filters.profile && filters.profile.startsWith) {
      whereClause["$profile.profile_name$"] = {
        [Op.iLike]: `%${filters.profile.startsWith}%`,
      };
    }

    return whereClause;
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "first_name",
      "last_name",
      "email",
      "status",
      "createdAt",
      "updatedAt",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "createdAt";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }
}

export default UserService;
