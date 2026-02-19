import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { ArrowBackIcon, ZoomInIcon, ZoomOutIcon } from '../../../../assets';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  file: File;
  fields: PDFField[];
  onFieldClick: (field: PDFField) => void;
  selectedField: PDFField | null;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  fields,
  onFieldClick,
  selectedField,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [canvasDisplayScale, setCanvasDisplayScale] = useState(1);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

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

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }

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

        // Store the render task so we can cancel it if needed
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        // Set display scale to 1 since canvas is not CSS-scaled
        setCanvasDisplayScale(1);
      } catch (error: unknown) {
        // Ignore cancellation errors
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          error.name !== 'RenderingCancelledException'
        ) {
          console.error('Error rendering page:', error);
        }
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

  const handleFieldClick = (field: PDFField) => {
    if (field.id) {
      const fallbackCopy = (text: string) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(ta);
        }
      };

      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(field.id)
            .catch(() => fallbackCopy(field.id));
        } else {
          fallbackCopy(field.id);
        }
      } catch {
        fallbackCopy(field.id);
      }

      setCopiedFieldId(field.id);
      setTimeout(() => setCopiedFieldId(null), 1500);
    }
    onFieldClick(field);
  };

  const currentPageFields = fields.filter(
    (field) => field.page === currentPage - 1
  );

  return (
    <div className='flex flex-col h-full max-h-[calc(100vh-80px)]'>
      {/* PDF Controls */}
      <div className='bg-white rounded-[4px] border border-[#CBD6E2] px-3 py-2 mb-4 flex-shrink-0'>
        <Box className='flex items-center gap-4 flex-wrap'>
          {/* Zoom Controls */}
          <Box className='flex items-center gap-2'>
            <Typography
              variant='body2'
              className='font-semibold text-[#2D3E4F] text-[13px]'
            >
              Zoom:
            </Typography>
            <IconButton
              size='small'
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              disableRipple
              sx={{
                '&.Mui-disabled': { color: '#CBD6E2' },
              }}
            >
              <ZoomOutIcon
                className={`w-4.5 h-4.5 ${scale <= 0.5 ? '[&>path]:stroke-[#CBD6E2]' : ''}`}
              />
            </IconButton>
            <FormControl size='small'>
              <Select
                value={Math.round(scale * 100)}
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                MenuProps={COMMON_MENU_PROPS}
                sx={getSelectStyles(false, false)}
              >
                {ZOOM_LEVELS.map((value) => (
                  <MenuItem key={value} value={value} sx={{ fontSize: '13px' }}>
                    {value}%
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size='small'
              onClick={handleZoomIn}
              disabled={scale >= 3}
              disableRipple
              sx={{
                '&.Mui-disabled': { color: '#CBD6E2' },
              }}
            >
              <ZoomInIcon
                className={`w-4.5 h-4.5 ${scale >= 3 ? '[&>path]:stroke-[#CBD6E2]' : ''}`}
              />
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
            {pdfDoc && (
              <FormControl size='small'>
                <Select
                  value={currentPage}
                  onChange={handlePageChange}
                  MenuProps={COMMON_MENU_PROPS}
                  sx={getSelectStyles(false, false)}
                >
                  {Array.from({ length: pdfDoc.numPages }, (_, i) => (
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
            )}
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
      <div className='flex-1 overflow-auto bg-[#fff] rounded-[4px] border border-[#CBD6E2]'>
        <Box ref={containerRef} className='relative inline-block'>
          <canvas ref={canvasRef} className='shadow-lg bg-white' />

          {currentPageFields.map((field, index) => (
            <Tooltip
              key={`${field.id}_${field.page}_${index}`}
              title={
                copiedFieldId === field.id
                  ? `✓ Copied: ${field.id}`
                  : `Click to copy Field ID: ${field.id}`
              }
              placement='top'
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: '11px',
                    bgcolor: copiedFieldId === field.id ? '#166534' : '#1e293b',
                    color: '#fff',
                    borderRadius: '4px',
                    maxWidth: 300,
                    wordBreak: 'break-all',
                  },
                },
                arrow: {
                  sx: {
                    color: copiedFieldId === field.id ? '#166534' : '#1e293b',
                  },
                },
              }}
            >
              <Box
                onClick={() => handleFieldClick(field)}
                sx={{
                  position: 'absolute',
                  cursor: 'pointer',
                  border: '2px solid',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  left: `${field.x * scale * canvasDisplayScale}px`,
                  top: `${field.y * scale * canvasDisplayScale}px`,
                  width: `${field.width * scale * canvasDisplayScale}px`,
                  height: `${field.height * scale * canvasDisplayScale}px`,
                  borderColor:
                    copiedFieldId === field.id
                      ? '#16a34a'
                      : selectedField?.id === field.id
                        ? '#dc2626'
                        : '#3b82f6',
                  backgroundColor:
                    copiedFieldId === field.id
                      ? 'rgba(22, 163, 74, 0.2)'
                      : selectedField?.id === field.id
                        ? 'rgba(220, 38, 38, 0.2)'
                        : 'rgba(59, 130, 246, 0.15)',
                  '&:hover': {
                    backgroundColor:
                      copiedFieldId === field.id
                        ? 'rgba(22, 163, 74, 0.35)'
                        : selectedField?.id === field.id
                          ? 'rgba(220, 38, 38, 0.35)'
                          : 'rgba(59, 130, 246, 0.3)',
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </div>
    </div>
  );
};

export default PDFViewer;
