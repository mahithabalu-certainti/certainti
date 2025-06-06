import { useApiMutation } from '../../../api/mutation';
import { NewAccountData } from '../../types';
import { AccountCreateUrl, AccountUpdateUrl } from '../urls/account-url';

export const useCreateAccount = () => {
  return useApiMutation<unknown, Partial<NewAccountData>>(
    AccountCreateUrl,
    'post'
  );
};

export const useUpdateAccount = () => {
  return useApiMutation<unknown, Partial<NewAccountData>>(
    AccountUpdateUrl,
    'put'
  );
};
