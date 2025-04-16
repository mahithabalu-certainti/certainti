import { UserRoles } from "../../common-service";

export interface IAuthDetails {
  isAuthenticated: boolean | null;
  authToken: string | null;
  azureId: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  role: UserRoles | null;
}
