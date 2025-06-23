import { api } from '../../../api/api';
import { UploadImportPayload } from '../../../common-service';
import { uploadUrl } from '../urls';

export const uploadImportFile = async (payload: UploadImportPayload) => {
  const response = await api.post(uploadUrl(), payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};
