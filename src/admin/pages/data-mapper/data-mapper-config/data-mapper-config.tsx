/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { SectionHeaderTab, TruncateWithTooltip } from '../../../../components';
import PDFViewer from './pdf-viewer';
import MappingTable from './mapping-table';
import {
  useMappingDetails,
  useObjectsList,
  useUpdateDataMapperConfig,
} from '../../../service/data-mapper/data-mapper-service';
import { PDFField } from '../../../types';
import * as pdfjsLib from 'pdfjs-dist';
import { useParams } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { EditIcon } from '../../../../assets';

const DataMapperConfig: React.FC = () => {
  const { mapperId } = useParams();
  const [activeTab, setActiveTab] = useState<string>('pdf_view');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PDFField[]>([]);
  const [selectedField, setSelectedField] = useState<PDFField | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [mappings, setMappings] = useState<any[]>([]);

  const updateDataMapperConfig = useUpdateDataMapperConfig();
  const { data: mappingData, isLoading } = useMappingDetails(mapperId, true);
  const { data: objectsList, isLoading: isLoadingObjects } = useObjectsList(
    mappingData?.country_rid || '',
    mappingData?.state_rid || ''
  );

  console.log('objectsList', objectsList);

  // Initialize mappings when mapping data is loaded
  useEffect(() => {
    if (mappingData?.mappings) {
      setMappings(mappingData.mappings);
    }
  }, [mappingData?.mappings]);

  // Extract PDF fields from the PDF file
  const extractFieldsFromPDF = async (pdf: pdfjsLib.PDFDocumentProxy) => {
    try {
      const extractedFields: PDFField[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const annotations = await page.getAnnotations();

        annotations.forEach((annotation: any, index: number) => {
          if (annotation.fieldType) {
            const rect = annotation.rect || [0, 0, 0, 0];
            const field: PDFField = {
              id: annotation.id || `field-${pageNum}-${index}`,
              name: annotation.fieldName || `Field ${index + 1}`,
              type: annotation.fieldType || 'text',
              page: pageNum - 1,
              rect: rect,
              x: rect[0],
              y: rect[1],
              width: rect[2] - rect[0],
              height: rect[3] - rect[1],
              defaultValue: annotation.defaultValue,
              possibleValues: annotation.options?.map(
                (opt: any) => opt.displayValue
              ),
            };
            extractedFields.push(field);
          }
        });
      }

      setFields(extractedFields);
    } catch (err) {
      console.error('Error extracting fields:', err);
    }
  };

  // Load PDF from URL or base64 when mapping data is available
  useEffect(() => {
    if (!mappingData?.file) return;

    const loadPdfData = async () => {
      setIsLoadingPdf(true);
      try {
        let blob: Blob;

        // Check if the file is base64 data
        if (mappingData.file.startsWith('data:application/pdf;base64,')) {
          // Handle base64 data
          const base64Data = mappingData.file.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } else if (mappingData.file.startsWith('data:')) {
          // Handle other base64 formats
          const response = await fetch(mappingData.file);
          blob = await response.blob();
        } else {
          // Handle URL
          const response = await fetch(mappingData.file);
          blob = await response.blob();
        }

        const file = new File([blob], 'document.pdf', {
          type: 'application/pdf',
        });
        setPdfFile(file);

        // Extract fields from the PDF
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        await extractFieldsFromPDF(pdf);
      } catch (err) {
        console.error('Error loading PDF:', err);
      } finally {
        setIsLoadingPdf(false);
      }
    };

    loadPdfData();
  }, [mappingData?.file]);

  const tabs = [
    {
      label: 'PDF',
      value: 'pdf_view',
      hide: false,
    },
    {
      label: 'Table',
      value: 'table_view',
      hide: false,
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleFieldClick = (field: PDFField) => {
    setSelectedField(field);
  };

  const handleMappingsChange = (updatedMappings: any[]) => {
    setMappings(updatedMappings);
  };

  const goBack = () => {
    window.history.back();
    setFields([]);
    setSelectedField(null);
    setActiveTab('pdf_view');
  };

  const handleSubmit = async () => {
    const payload = {
      rid: mapperId,
      mappings: mappings.map((mapping) => ({
        rid: mapping.rid,
        created_datetime: mapping.created_datetime,
        created_by: mapping.created_by,
        modified_datetime: mapping.modified_datetime,
        modified_by: mapping.modified_by,
        form_rid: mapperId,
        field_label: mapping.field_label,
        field_id: mapping.field_id,
        object_rid: mapping.object_rid || [],
      })),
    };

    console.log('Save payload:', payload);

    try {
      // Call your update service here
      // await updateDataMapperConfig.mutateAsync(payload);
    } catch (error) {
      console.error('Error saving mappings:', error);
    }
  };

  const formLoading = isLoading || isLoadingObjects || isLoadingPdf;

  return (
    <div>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <React.Suspense fallback={null}>
            <EditIcon
              alt='data-mapper-icon'
              className='h-7 w-7 p-1.5 rounded [&>path]:stroke-[#0176D3] bg-[#E3F2FD]'
            />
          </React.Suspense>
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {'Data Mapper'}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              {'Data Mapper Config'}
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            onClick={handleSubmit}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Cancel'
            onClick={goBack}
            sx={{
              width: '75px',
              minWidth: '75px',
              fontSize: '12px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      <div>
        {formLoading ? (
          <SkeletonForm />
        ) : (
          <div>
            {/* Section 1 */}
            <div className='flex items-center align-middle px-10 h-[30px] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Basic Information
            </div>
            <div className='grid grid-cols-8 gap-4 px-10 py-2'>
              {[
                { label: 'Name', value: mappingData?.form_name || '' },
                { label: 'Country', value: mappingData?.country_name || '' },
                { label: 'State', value: mappingData?.state_name || '' },
              ].map(({ label, value }) => (
                <React.Fragment key={label}>
                  <div className='text-left font-semibold text-[13px] text-[#425A76] pr-1'>
                    {label}
                  </div>
                  <div className='font-medium text-[13px] truncate min-w-0'>
                    <TruncateWithTooltip
                      text={value}
                      maxWidth='100%'
                      className='truncate inline-block max-w-full'
                      tooltipMaxWidth={'50vw'}
                    >
                      <span className='font-medium text-[13px] text-[#425A76]'>
                        {value}
                      </span>
                    </TruncateWithTooltip>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {/* Section 2 */}
            <div className='flex items-center align-middle px-10 h-[30px] border border-b-0 border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold bg-[#ECECEC]'>
              Data Mapping
            </div>
            <SectionHeaderTab
              tabs={tabs}
              onTabChange={handleTabChange}
              defaultValue={'pdf_view'}
              className='flex flex-col gap-0 border border-[#CBD6E2] border-r-0 border-l-0  px-10'
            />

            {/* Tab Content */}
            <div className='mt-4 px-10'>
              {activeTab === 'pdf_view' && pdfFile && (
                <PDFViewer
                  file={pdfFile}
                  fields={fields}
                  onFieldClick={handleFieldClick}
                  selectedField={selectedField}
                />
              )}
              {activeTab === 'table_view' && (
                <MappingTable
                  mappings={mappings}
                  objectsList={objectsList || []}
                  onMappingsChange={handleMappingsChange}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMapperConfig;
