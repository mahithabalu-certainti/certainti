import { resourceServiceApi } from '../../../api/api';
import { ImportTemplatePayload } from '../../types';

export const uploadImportTemplateUrl = () => `/api/template/upload`;
export const importTemplateFileUpload = async (
  payload: ImportTemplatePayload
) => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('templateId', payload.templateId);

  const response = await resourceServiceApi.post(
    uploadImportTemplateUrl(),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};
