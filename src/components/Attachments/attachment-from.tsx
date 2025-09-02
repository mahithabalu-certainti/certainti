import React, { useMemo, useState } from 'react';
import { FormBuilder } from '../form-builder';
import {
  OnChange,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
} from '../../common-service';
import { getFiscalYears } from '../../common-utils';
import { AttachmentFormData } from './form-data';
import { OthersEnum, SelectOption } from '../../consultant/types';
import { AttachmentUploadPayload } from '../../consultant/types/attachment';

interface AttachmentFormProps {
  onFormSubmit: (data: Partial<AttachmentUploadPayload>) => void;
  formRef: React.RefObject<HTMLFormElement>;
  projectFiscalYear?: number | string;
}

export const AttachmentForm: React.FC<AttachmentFormProps> = ({
  onFormSubmit,
  formRef,
  projectFiscalYear,
}) => {
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [showCategoryOthersField, setShowCategoryOthersField] =
    useState<boolean>(false);
  const [showTypeOthersField, setShowTypeOthersField] =
    useState<boolean>(false);
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);
  const fiscalYears = getFiscalYears(20);

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  const onChangeField = (data: OnChange) => {
    if (data.fieldName === 'document_category_rid') {
      setCurrentCategory(data.fieldValue as string);
      const selectedCategory = memoizedDocumentCategories.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowCategoryOthersField(
        selectedCategory?.label.toLowerCase() === OthersEnum.Others
      );
      setShowTypeOthersField(false);
    }
    if (data.fieldName === 'document_type_rid') {
      const selectedType = memoizedDocumentTypes.find(
        (option) => String(option.value) === String(data.fieldValue)
      );
      setShowTypeOthersField(
        selectedType?.label.toLowerCase() === OthersEnum.Others
      );
    }
  };

  const submitData = (data: Partial<AttachmentUploadPayload>) => {
    const transformData = {
      ...data,
      document_category_others: showCategoryOthersField
        ? data.document_category_others
        : '',
      document_type_others: showTypeOthersField
        ? data.document_type_others
        : '',
    };
    onFormSubmit(transformData);
  };

  const formConfig = AttachmentFormData(
    fiscalYears,
    memoizedDocumentCategories,
    memoizedDocumentTypes,
    categoryTypes.isLoading,
    showCategoryOthersField,
    showTypeOthersField,
    projectFiscalYear
  );

  return (
    <div>
      <FormBuilder
        loading={false}
        data={formConfig}
        values={
          projectFiscalYear ? { fiscal_year: String(projectFiscalYear) } : {}
        }
        outData={submitData}
        formRef={formRef}
        onChange={onChangeField}
      />
    </div>
  );
};

export default AttachmentForm;
