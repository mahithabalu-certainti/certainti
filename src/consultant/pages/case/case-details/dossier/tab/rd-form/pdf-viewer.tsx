/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';
import {
  ArrowBackIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
} from '../../../../../../../assets';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  base64?: string; // Can be base64 string
  isLoadingPdf?: boolean;
  isPdfError?: boolean;
  downloadName: string;
}

// Helper function to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  // Remove data:application/pdf;base64, prefix if present
  const base64String = base64.includes('base64,')
    ? base64.split('base64,')[1]
    : base64;

  const binaryString = window.atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

const PdfViewer: React.FC<PdfViewerProps> = ({
  base64,
  isLoadingPdf,
  isPdfError,
  downloadName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (!base64) return;

      // Reset zoom and page to initial defaults whenever a new PDF is loaded
      setScale(1);
      setCurrentPage(1);
      setIsLoading(true);
      setError('');

      try {
        const pdfData = base64ToUint8Array(base64);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        setPdfDoc(pdf);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [base64]);

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

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        // Ignore cancellation errors
        const isCancelled =
          err?.name === 'RenderingCancelledException' ||
          err?.name === 'TransportException';

        if (!isCancelled) {
          console.error('Error rendering page:', err);
          setError('Failed to load PDF. Please try again.');
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

  const handleDownload = () => {
    if (!base64) return;

    try {
      const pdfBytes = base64ToUint8Array(base64);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  if (isLoading || isLoadingPdf) {
    return (
      <div className='flex flex-col h-full gap-3 animate-pulse'>
        {/* Controls skeleton */}
        <div className='w-full h-[40px] rounded-[4px] bg-gray-200' />
        {/* Content skeleton */}
        <div className='w-full h-[200px] rounded-[4px] bg-gray-200' />
      </div>
    );
  }

  if (error || isPdfError) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-[13px] text-red-500'>{error}</div>
      </div>
    );
  }

  return (
    <Box className='flex flex-col h-full'>
      {/* PDF Controls */}
      <div className='sticky top-[30px] z-10 bg-white rounded-[4px] border border-[#CBD6E2] px-3 py-2 mb-4'>
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
          <Typography variant='body2' className='text-[#7D98B6] text-[13px]'>
            {pdfDoc && `Page ${currentPage} of ${pdfDoc.numPages}`}
          </Typography>
          <Box
            className='border border-[#CBD6E2] flex items-center justify-center rounded-[4px] ml-auto'
            onClick={() => handleDownload()}
          >
            <IconButton
              size='small'
              disabled={!pdfDoc}
              sx={{
                '&.Mui-disabled': { color: '#CBD6E2' },
              }}
            >
              <DownloadIcon
                className={`w-5 h-5 ${!pdfDoc ? '[&>path]:stroke-[#CBD6E2]' : ''}`}
              />
            </IconButton>
          </Box>
        </Box>
      </div>

      {/* PDF Canvas Container */}
      <div className='flex-1 bg-[#F3F4F6] p-8 rounded-[4px] border border-[#CBD6E2]'>
        <Box ref={containerRef} className='relative inline-block'>
          <canvas ref={canvasRef} className='shadow-lg bg-white' />
        </Box>
      </div>
    </Box>
  );
};

export default PdfViewer;
