import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  IconButton,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFField } from '../../../types';
import { ArrowBackIcon, CopyIcon, TickIcon } from '../../../../assets';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  file: File;
  fields: PDFField[];
  onFieldClick: (field: PDFField) => void;
  selectedField: PDFField | null;
}

interface DetailItemProps {
  label: string;
  value: string | React.ReactNode;
  onCopy?: () => void;
  multiline?: boolean;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

const DetailItem = ({
  label,
  value,
  onCopy,
  multiline = false,
}: DetailItemProps) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };
  return (
    <div>
      <div className='font-semibold text-sm text-gray-700 mb-1'>{label}</div>

      <div
        className={`flex items-start justify-between bg-gray-50 border border-gray-200 rounded-[2px] p-2 ${
          multiline ? 'flex-col space-y-2' : ''
        }`}
      >
        <div className='flex-1 text-gray-700 break-all text-sm pl-1'>
          {value}
        </div>

        {onCopy && (
          <Tooltip title={showCopied ? 'Copied' : 'Copy'} arrow placement='top'>
            <button
              onClick={handleCopy}
              className='ml-2 pt-0.5 text-gray-500 hover:text-blue-600 transition cursor-pointer'
            >
              {showCopied ? (
                <TickIcon alt='tick-icon' className='w-4 h-4' />
              ) : (
                <CopyIcon className='w-4 h-4' />
              )}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const FieldDetailsPanel = ({ field }: { field: PDFField | null }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!field) {
    return (
      <div className='bg-white rounded-[4px] border border-[#CBD6E2] sticky top-0 h-fit'>
        <div className='py-2.5 px-4 text-xl font-bold text-[#425A76] border-b border-[#CBD6E2]'>
          Field Details
        </div>
        <div className='flex-1 min-h-[100px] text-base text-[#425a76cf] break-all p-4'>
          Click on a field to view its details.
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-[4px] border border-[#CBD6E2] sticky top-0 h-fit'>
      <div className='py-2.5 px-4 text-xl font-bold text-[#425A76] border-b border-[#CBD6E2]'>
        Field Details
      </div>

      <div className='space-y-6 p-4'>
        <DetailItem
          label='Field ID'
          value={field.id}
          onCopy={() => copyToClipboard(field.id)}
        />

        <DetailItem
          label='Field Name'
          value={field.name}
          onCopy={() => copyToClipboard(field.name)}
        />

        <div className='grid grid-cols-1 gap-4'>
          <DetailItem label='Field Type' value={field.type} />
          <DetailItem label='Page' value={String(field.page + 1)} />
          <DetailItem
            label='Position'
            value={
              <>
                <span>
                  X: {field.x.toFixed(2)}, Y: {field.y.toFixed(2)}
                </span>
                <span>Width: {field.width.toFixed(2)}</span>
                <span> Height: {field.height.toFixed(2)}</span>
              </>
            }
            multiline
          />
        </div>

        {field.possibleValues && field.possibleValues.length > 0 && (
          <DetailItem
            label='Possible Values'
            value={field.possibleValues.join(', ') || '-'}
            multiline
          />
        )}

        {field.defaultValue && (
          <DetailItem
            label='Default Value'
            value={field.defaultValue}
            multiline
          />
        )}
      </div>
    </div>
  );
};

export default function PDFViewer({
  file,
  fields,
  onFieldClick,
  selectedField,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const loadPDF = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
    };
    loadPDF();
  }, [file]);

  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePageChange = (event: SelectChangeEvent<number>) => {
    setCurrentPage(Number(event.target.value));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const currentPageFields = fields.filter(
    (field) => field.page === currentPage - 1
  );

  return (
    <div className='flex gap-4 h-full max-h-[calc(100vh-290px)]'>
      {/* Left Side - PDF Viewer (70%) */}
      <Box className='flex-1 flex flex-col' style={{ flex: '0 0 70%' }}>
        {/* PDF Controls */}
        <div className='bg-white rounded-[4px] border border-[#CBD6E2] px-3 py-2 mb-4'>
          <Box className='flex items-center gap-4 flex-wrap'>
            {/* Zoom Controls */}
            <Box className='flex items-center gap-2'>
              <Typography
                variant='body2'
                className='font-semibold text-[#2D3E4F] text-[13px]'
              >
                Zoom:
              </Typography>
              <FormControl size='small'>
                <Select
                  value={Math.round(scale * 100)}
                  onChange={(e) => setScale(Number(e.target.value) / 100)}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(false, false)}
                >
                  {ZOOM_LEVELS.map((value) => (
                    <MenuItem
                      key={value}
                      value={value}
                      sx={{ fontSize: '13px' }}
                    >
                      {value}%
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size='small'
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                disableRipple
              >
                <span className='text-xl font-bold'>-</span>
              </IconButton>
              <IconButton
                size='small'
                onClick={handleZoomIn}
                disabled={scale >= 3}
                disableRipple
              >
                <span className='text-xl font-bold'>+</span>
              </IconButton>
            </Box>

            {/* Page Navigation */}
            <Box className='flex items-center gap-2'>
              <Typography
                variant='body2'
                className='font-semibold text-[#2D3E4F] text-[13px]'
              >
                Jump To:
              </Typography>
              <IconButton
                onClick={handlePrevPage}
                size='small'
                disabled={currentPage === 1}
                sx={{
                  '&.Mui-disabled': { color: '#CBD6E2' },
                }}
              >
                <ArrowBackIcon
                  className={`w-3 h-3 ${currentPage === 1 ? '[&>path]:stroke-[#CBD6E2]' : ''}`}
                />
              </IconButton>
              <FormControl size='small'>
                <Select
                  value={currentPage}
                  onChange={handlePageChange}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(false, false)}
                >
                  {pdfDoc &&
                    Array.from({ length: pdfDoc.numPages }, (_, i) => (
                      <MenuItem
                        key={i + 1}
                        value={i + 1}
                        sx={{ fontSize: '13px' }}
                      >
                        Page {i + 1}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <IconButton
                onClick={handleNextPage}
                size='small'
                disabled={!pdfDoc || currentPage === pdfDoc.numPages}
                sx={{
                  '&.Mui-disabled': { color: '#CBD6E2' },
                }}
              >
                <ArrowBackIcon
                  className={`w-3 h-3 ${currentPage === pdfDoc?.numPages ? '[&>path]:stroke-[#CBD6E2]' : ''} rotate-180`}
                />
              </IconButton>
            </Box>

            {/* Page Counter */}
            <Typography
              variant='body2'
              className='text-[#7D98B6] ml-auto text-[13px]'
            >
              {pdfDoc && `Page ${currentPage} of ${pdfDoc.numPages}`}
            </Typography>
          </Box>
        </div>

        {/* PDF Canvas Container */}
        <div className='flex-1 overflow-auto bg-[#F3F4F6] p-8 rounded-[4px] border border-[#CBD6E2]'>
          <Box ref={containerRef} className='relative inline-block'>
            <canvas ref={canvasRef} className='shadow-lg bg-white' />

            {currentPageFields.map((field) => (
              <Box
                key={field.id}
                onClick={() => onFieldClick(field)}
                className='absolute cursor-pointer border-2 transition-all hover:bg-blue-500 hover:bg-opacity-30'
                style={{
                  left: `${field.x * scale}px`,
                  top: `${field.y * scale}px`,
                  width: `${field.width * scale}px`,
                  height: `${field.height * scale}px`,
                  borderColor:
                    selectedField?.id === field.id ? '#dc2626' : '#3b82f6',
                  backgroundColor:
                    selectedField?.id === field.id
                      ? 'rgba(220, 38, 38, 0.2)'
                      : 'rgba(59, 130, 246, 0.15)',
                }}
                title={`${field.name} (${field.type})`}
              />
            ))}
          </Box>
        </div>
      </Box>

      {/* Right Side - Field Details (30%) */}
      <div className='flex-shrink-0' style={{ width: '30%' }}>
        <FieldDetailsPanel field={selectedField} />
      </div>
    </div>
  );
}
