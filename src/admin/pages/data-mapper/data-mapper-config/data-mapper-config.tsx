import React, { useState, useEffect } from 'react';
import { TruncateWithTooltip } from '../../../../components';
import PDFViewer from './pdf-viewer';
import MappingTable from './mapping-table';
import {
  useMappingDetails,
  useObjectsList,
  useUpdateDataMapperConfig,
} from '../../../service/data-mapper/data-mapper-service';
import { PDFField } from '../../../types';
import { useParams } from 'react-router-dom';
import TextButton from '../../../../components/button/text-button';
import SkeletonForm from '../../../../components/form-builder/skeleton-form';
import SingleSkeleton from '../../../../components/skeleton-component/singleskeleton';
import { DataMapperIcon, ArrowIcon } from '../../../../assets';
import { useToast } from '../../../../hooks';
import { extractPDFFields, validateMappingItem } from './helper';

interface ObjectRidMap {
  [key: number]: string | number;
}

interface FieldExpression {
  type: 'chip' | 'operator' | 'manual' | 'function' | 'number' | 'conditional';
  value: string;
  functionType?: 'MIN' | 'MAX';
  functionArgs?: string[];
  conditionalData?: ConditionalExpression;
}

interface ConditionalClause {
  type: 'IF' | 'ELSE_IF' | 'ELSE';
  condition?: string; // The condition expression (not needed for ELSE)
  result: string; // The result expression
}

interface ConditionalExpression {
  clauses: ConditionalClause[];
}

interface MappingItem {
  rid: string;
  created_datetime?: string;
  created_by?: string;
  modified_datetime?: string;
  modified_by?: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table';
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
  fieldIdError?: string;
  targetError?: string;
  column_id?: string | null;
  status?: string;
}

const SIDEBAR_WIDTH = '38.1vw';

const DataMapperConfig: React.FC = () => {
  const { mapperId } = useParams();
  const { successToast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PDFField[]>([]);
  const [selectedField, setSelectedField] = useState<PDFField | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [isPdfSidebarOpen, setIsPdfSidebarOpen] = useState(true);

  const updateDataMapperConfig = useUpdateDataMapperConfig();
  const { data: mappingData, isLoading } = useMappingDetails(mapperId, true);
  const { data: objectsList, isLoading: isLoadingObjects } = useObjectsList(
    mappingData?.formDetail?.country_rid || '',
    mappingData?.formDetail?.state_rid || ''
  );

  useEffect(() => {
    if (mappingData?.mappings) {
      setMappings(mappingData.mappings as MappingItem[]);
    }
  }, [mappingData?.mappings]);

  // Load PDF from base64 when mapping data is available
  useEffect(() => {
    if (!mappingData?.base64File) return;

    const loadPdfData = async () => {
      setIsLoadingPdf(true);
      setPdfLoadError(null);
      try {
        // Handle base64 data
        const base64Data = mappingData.base64File.startsWith('data:')
          ? mappingData.base64File.split(',')[1]
          : mappingData.base64File;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });

        const file = new File([blob], 'document.pdf', {
          type: 'application/pdf',
        });
        setPdfFile(file);

        // Extract fields from the PDF using the helper function
        const extractedFields = await extractPDFFields(file);
        setFields(extractedFields);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setPdfLoadError('Failed to load PDF document');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    loadPdfData();
  }, [mappingData?.base64File]);

  const handleFieldClick = (field: PDFField) => {
    setSelectedField(field);
  };

  const handleMappingsChange = (updatedMappings: MappingItem[]) => {
    setMappings(updatedMappings);
  };

  const goBack = () => {
    window.history.back();
    setFields([]);
    setSelectedField(null);
  };

  const handleSubmit = async () => {
    // Validate all mappings and set errors
    let hasErrors = false;
    const isNonFillable =
      mappingData?.formDetail?.form_type?.toLowerCase() === 'non-fillable';
    const validatedMappings = mappings.map((mapping) => {
      const errors = validateMappingItem(mapping, isNonFillable);
      if (errors.fieldIdError || errors.targetError) {
        hasErrors = true;
      }
      return {
        ...mapping,
        fieldIdError: errors.fieldIdError,
        targetError: errors.targetError,
      };
    });

    // Update mappings with validation errors
    setMappings(validatedMappings);
    if (hasErrors) return;

    const payload = {
      rid: mapperId || '',
      mappings: mappings.map((mapping) => ({
        rid: mapping.rid,
        created_datetime: mapping.created_datetime || '',
        created_by: mapping.created_by || '',
        modified_datetime: mapping.modified_datetime || null,
        modified_by: mapping.modified_by || null,
        form_rid: mapperId || '',
        field_label: mapping.field_label,
        field_id: mapping.field_id,
        calculation_config: mapping.calculation_config,
        field_type: mapping.field_type,
        column_id: mapping.column_id || null,
        status: mapping.status,
      })),
    };

    updateDataMapperConfig.mutate(payload, {
      onSuccess: () => {
        successToast('RD Form Configuration saved successfully');
        goBack();
      },
    });
  };

  const formLoading = isLoading || isLoadingObjects || isLoadingPdf;

  return (
    <div style={{ position: 'relative' }}>
      <div className='h-[50px] flex items-center justify-between px-10 sticky top-0 z-10 bg-white border-b border-[#CBD6E2]'>
        <div className='flex items-center w-[80%] max-w-[80%]'>
          <React.Suspense fallback={null}>
            <DataMapperIcon
              alt='data-mapper-icon'
              className='h-7 w-7 p-1.5 rounded [&>path]:stroke-[#fff] bg-[#82BA8B]'
            />
          </React.Suspense>
          <div className='w-[90%]'>
            {isLoading ? (
              <div className='ml-2'>
                <SingleSkeleton width={150} height={12} />
              </div>
            ) : (
              <div className='font-semibold text-[12px] leading-[20px] ml-2 mb-[-6px] text-[#7D98B6]'>
                {`RD Form Configuration ${mappingData?.formDetail?.r_number ? `> ${mappingData?.formDetail?.r_number || ''}` : ''}`}
              </div>
            )}
            <h5 className='text-[16px] font-bold ml-2 text-[#2D3E4F]'>
              Configuration
            </h5>
          </div>
        </div>
        <div className='flex gap-3'>
          <TextButton
            label='Save'
            onClick={handleSubmit}
            loading={updateDataMapperConfig.isPending}
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
            disabled={updateDataMapperConfig.isPending}
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
                {
                  label: 'Form Name',
                  value: mappingData?.formDetail?.form_name || '',
                },
                {
                  label: 'Country',
                  value: mappingData?.formDetail?.country_name || '',
                },
                {
                  label: 'Region',
                  value: mappingData?.formDetail?.state_name || '',
                },
                {
                  label: 'Status',
                  value: mappingData?.formDetail?.status_name || '',
                },
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
                        {value || '-'}
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
            <div className='mt-4 px-10'>
              <MappingTable
                mappings={mappings}
                objectsList={objectsList || []}
                onMappingsChange={handleMappingsChange}
                formType={mappingData?.formDetail?.form_type}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsPdfSidebarOpen((prev) => !prev)}
        title={isPdfSidebarOpen ? 'Close Original Form' : 'Open Original Form'}
        aria-label={isPdfSidebarOpen ? 'Close PDF sidebar' : 'Open PDF sidebar'}
        className='fixed top-[calc(50%+45px)] -translate-y-1/2 z-[1300] w-[22px] h-14 bg-[#2D3E4F] border-none rounded-l-lg flex items-center justify-center shadow-[-2px_2px_10px_rgba(0,0,0,0.22)] p-0 outline-none cursor-pointer'
        style={{
          right: isPdfSidebarOpen ? SIDEBAR_WIDTH : '0px',
          transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <ArrowIcon
          className='w-4 h-4 [&>path]:stroke-white'
          style={{
            transform: isPdfSidebarOpen ? 'rotate(-90deg)' : 'rotate(90deg)',
            transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
            display: 'block',
          }}
        />
      </button>

      <div
        className='fixed top-[90px] right-0 bottom-0 z-[1200] pointer-events-none'
        style={{
          width: SIDEBAR_WIDTH,
          transform: isPdfSidebarOpen
            ? 'translateX(0)'
            : `translateX(${SIDEBAR_WIDTH})`,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}
      >
        <div className='pointer-events-auto w-full h-full bg-white shadow-[-4px_0_28px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden'>
          <div className='px-4 py-1 bg-[#F3F6FA] border-b border-[#CBD6E2] text-[#2D3E4F] text-[14px] font-bold shrink-0 tracking-[0.01em]'>
            Original Form — PDF Viewer
          </div>
          <div className='flex-1 overflow-hidden flex flex-col min-h-0'>
            {formLoading ? (
              <div className='bg-white h-full flex items-center justify-center text-gray-500'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                </div>
              </div>
            ) : pdfFile ? (
              <div className='flex-1 min-h-0 p-3 flex flex-col'>
                <PDFViewer
                  file={pdfFile}
                  fields={fields}
                  onFieldClick={handleFieldClick}
                  selectedField={selectedField}
                />
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center bg-[#F8FAFC]'>
                <span
                  className={`font-medium text-[13px] ${pdfLoadError ? 'text-red-600' : 'text-[#7D98B6]'}`}
                >
                  {pdfLoadError || 'No PDF available'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMapperConfig;
