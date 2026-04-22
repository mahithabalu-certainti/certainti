import { useApiMutation } from '../../../api/mutation';
// import { updatedAccountFormData } from '../../types';
import { AccountCreateUrl, AccountUpdateUrl } from '../urls/account-url';

export const useCreateAccount = () => {
  return useApiMutation<unknown, FormData>(AccountCreateUrl, 'post');
};

export const useUpdateAccount = () => {
  return useApiMutation<unknown, FormData>(AccountUpdateUrl, 'put');
};
