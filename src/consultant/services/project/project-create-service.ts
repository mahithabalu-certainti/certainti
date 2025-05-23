import {  useApiMutationSericve } from '../../../api/mutation';
import { NewProjectData } from '../../types/project';
import { ProjectCreateUrl, ProjectUpdateUrl } from '../urls';


export const useCreateProject = () => {
  return useApiMutationSericve<unknown, Partial<NewProjectData>>(
    ProjectCreateUrl,
    'post'
  );
};

export const useUpdateProject = () => {
  return useApiMutationSericve<unknown, Partial<NewProjectData>>(
    ProjectUpdateUrl,
    'put'
  );
};