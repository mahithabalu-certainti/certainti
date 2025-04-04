export interface IAuthDetails {
  isAuthenticated: boolean | null;
  authToken: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
}
