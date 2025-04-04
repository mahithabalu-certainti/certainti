import { UserDetails } from "../models/userDetailsModel";
import { User, Profile, BusinessTeams } from "../models/index";
import { constants } from "../utils/constant";
import { IUpdateUserData, IUserData } from "../utils/types";
import { Op } from "sequelize";
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

  /**
   * Creates a new user in the database using the provided user data.
   * The user data is processed and then inserted into the `User` model.
   * If the organization is `PLATFORM_ONE`, additional user details are created.
   *
   * @param {IUserData} userData - The data of the user to be created.
   * @param {string} azureId - The Azure ID associated with the user.
   *
   * @returns {Promise<{statusCode: number, message: string, data: {user: typeof User}} | {statusCode: number, message: string, error: string}>}
   * - On success, it returns a success status, a success message, and the created user data.
   * - On failure, it returns a failure status, a failure message, and the error message.
   */
  async createUser(
    userData: IUserData,
    azureId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { user: any };
  }> {
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Updates an existing user in the database using the provided user data.
   * The user is searched by its `userId`, and if found, its data is updated
   * with the new provided values. If the organization is `PLATFORM_ONE`,
   * additional user details are updated.
   *
   * @param {IUpdateUserData} userData - The new data for the user to be updated.
   * @param {string} userId - The ID of the user to be updated.
   *
   * @returns {Promise<{statusCode: number, message: string, data: {user: typeof User}} | {statusCode: number, message: string}>}
   * - On success, it returns a success status, a success message, and the updated user data.
   * - On failure, it returns a failure status and a message indicating the error (e.g., user not found).
   */
  async updateUser(
    userData: IUpdateUserData,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { user: any };
  }> {
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
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: "User not found",
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
          modified_datetime: new Date(),
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Creates a new UserDetails record associated with the given user.
   * It saves the provided user data, including department, designation,
   * employment information, and manager details.
   *
   * @param {IUserData} userData - The data to be saved for the new UserDetails.
   * @param {string} userId - The ID of the user to associate the details with.
   *
   * @returns {Promise<void>} - A promise that resolves when the UserDetails
   * record is successfully created.
   */
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

  /**
   * Updates the UserDetails record associated with the given user.
   * It updates the user's department, designation, employment information,
   * manager details, and other related fields.
   *
   * @param {IUpdateUserData} userData - The data to be updated for the UserDetails.
   * @param {string} userId - The ID of the user whose details need to be updated.
   *
   * @returns {Promise<void>} - A promise that resolves when the UserDetails
   * record is successfully updated.
   */
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
        modified_datetime: new Date(),
      },
      {
        where: {
          user_id: userId,
        },
      }
    );
  }

  /**
   * Retrieves a paginated list of users based on search and filter criteria,
   * as well as sorting parameters. The method fetches user data either
   * from the `PLATFORM_TWO` organization or from the `PLATFORM_ONE` organization
   * using different fetch strategies.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of users to fetch per page.
   * @param {string} search - The search query to filter users by.
   * @param {Record<string, string>} filters - The filters applied to user data.
   * @param {string} sortBy - The field by which to sort the results.
   * @param {string} sortOrder - The order of sorting ('ASC' or 'DESC').
   * @param {string} organization - The organization type used to determine the fetch method.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { users: any } }>}
   * A promise that resolves to an object containing the status, message,
   * and user data.
   */
  async listUsers(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    organization: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any };
  }> {
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a user's details by their user ID based on the organization type.
   * Depending on the organization, it fetches either basic user information from
   * `PLATFORM_TWO` or detailed user information from `PLATFORM_ONE`,
   * including related data such as profile, business teams, department, and function group.
   *
   * @param {string} userId - The ID of the user to retrieve.
   * @param {string} organization - The organization type used to determine the fetch method.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { users: any } }>}
   * A promise that resolves to an object containing the status, message,
   * and user data.
   */
  async listUserById(
    userId: string,
    organization: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any };
  }> {
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a list of all roles from the `BusinessTeams` model.
   *
   * This method fetches all the available business team roles from the database and returns them in the response.
   * If the fetch is successful, it returns the roles in the `data` field of the response.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { roles: any[] } }>}
   * A promise that resolves to an object containing the status, message, and the list of roles.
   */
  async roles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { roles: any };
  }> {
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a list of all profiles from the `Profile` model.
   *
   * This method fetches all the available profiles from the database and returns them in the response.
   * If the fetch is successful, it returns the profiles in the `data` field of the response.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { profiles: any[] } }>}
   * A promise that resolves to an object containing the status, message, and the list of profiles.
   */
  async profiles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { profiles: any };
  }> {
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
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches user details based on the provided filters, pagination, and sorting.
   *
   * This method retrieves a list of users from the database, including their profile and business teams,
   * based on the `whereClause` filter, with pagination (`limit` and `offset`), and sorted according to
   * the `sortBy` and `sortOrder` parameters. The resulting users' attributes include their ID, email,
   * status, full name, first name, along with the profile and business team information.
   *
   * @param {Record<string, any>} whereClause - The filtering conditions to apply to the query.
   * @param {number} limit - The maximum number of records to return.
   * @param {number} offset - The number of records to skip for pagination.
   * @param {string} sortBy - The field to sort by.
   * @param {string} sortOrder - The sorting order, either 'ASC' or 'DESC'.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of user objects that match the query criteria.
   */
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

  /**
   * Fetches detailed user information based on the provided filters, pagination, and sorting.
   *
   * This method retrieves a list of user details from the database, including the associated user,
   * department, and function group information, based on the `whereClause` filter. Pagination is
   * applied using the `limit` and `offset` parameters, and sorting is done based on the `sortBy`
   * and `sortOrder` parameters.
   *
   * @param {Record<string, any>} whereClause - The filtering conditions to apply to the query.
   * @param {number} limit - The maximum number of records to return.
   * @param {number} offset - The number of records to skip for pagination.
   * @param {string} sortBy - The field to sort by.
   * @param {string} sortOrder - The sorting order, either 'ASC' or 'DESC'.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of user details objects that match the query criteria.
   */
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

  /**
   * Builds a `whereClause` object for filtering database queries based on provided filters and search criteria.
   *
   * This method constructs a `whereClause` object used to filter database records. It supports searching
   * for users by fields such as `full_name`, `first_name`, `email`, and `business_teams.business_teams`,
   * as well as applying additional filters for specific fields (e.g., `user_name`, `status`, etc.).
   *
   * @param {Record<string, any>} filters - The filtering conditions for specific fields (e.g., user_name, status).
   * @param {string} search - The search term to be used for full text search in various fields.
   *
   * @returns {Record<string, any>} - The constructed `whereClause` object used for filtering database queries.
   */
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

  /**
   * Retrieves the sorting parameters for database queries based on the provided `sortBy` and `sortOrder`.
   *
   * This method ensures that the `sortBy` field is one of the valid columns, falling back to the `created_datetime`
   * field if it's not valid. It also ensures that the `sortOrder` is either 'ASC' or 'DESC', defaulting to 'DESC'
   * if the provided value is invalid.
   *
   * @param {string} sortBy - The field to sort by. Should be one of the valid columns.
   * @param {string} sortOrder - The sorting order, either 'ASC' (ascending) or 'DESC' (descending).
   *
   * @returns {[string, string]} - An array containing the valid sorting field and the sorting order.
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "first_name",
      "last_name",
      "email",
      "status",
      "created_datetime",
      "modified_datetime",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

export default UserService;
