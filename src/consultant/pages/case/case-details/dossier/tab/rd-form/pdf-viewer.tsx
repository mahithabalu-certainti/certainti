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
  Chip,
} from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { COMMON_MENU_PROPS, getSelectStyles } from './helper';
import {
  ArrowBackIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
} from '../../../../../../../assets';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PdfFormFieldValues {
  [fieldName: string]: string | boolean;
}
interface PdfViewerProps {
  base64?: string; // Can be base64 string
  isLoadingPdf?: boolean;
  isPdfError?: boolean;
  downloadName: string;
}

interface PdfViewerProps {
  base64?: string;
  url?: string;
  isLoadingPdf?: boolean;
  isPdfError?: boolean;
  /** Called whenever any form field value changes. Receives all current field values. */
  onFieldChange?: (values: PdfFormFieldValues) => void;
  /** Called with updated base64 PDF bytes whenever fields change (auto-save). */
  onPdfUpdate?: (updatedBase64: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const base64ToUint8Array = (base64: string): Uint8Array => {
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

const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/** Fetch a URL and return its bytes */
const fetchUrlAsUint8Array = async (url: string): Promise<Uint8Array> => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

// ─── Annotation field overlay item ──────────────────────────────────────────

interface FieldOverlay {
  id: string;
  fieldType: string; // 'text' | 'checkbox' | 'radio' | 'choice' | 'signature' | 'unknown'
  fieldName: string;
  rect: { left: number; top: number; width: number; height: number };
  options?: string[]; // for dropdowns
  radioGroup?: string; // for radio buttons
  readOnly: boolean;
  multiLine: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const PdfViewer: React.FC<PdfViewerProps> = ({
  base64,
  url,
  isLoadingPdf,
  isPdfError,
  onFieldChange,
  onPdfUpdate,
  downloadName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  /** Raw PDF bytes kept in sync so pdf-lib can re-serialize after each edit */
  const pdfBytesRef = useRef<Uint8Array | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isFilledForm, setIsFilledForm] = useState(false);
  const [fieldOverlays, setFieldOverlays] = useState<FieldOverlay[]>([]);
  const [fieldValues, setFieldValues] = useState<PdfFormFieldValues>({});

  const renderTaskRef = useRef<any>(null);
  // debounce timer for pdf-lib re-serialization
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadPDF = async () => {
      if (!base64 && !url) return;

      // Reset zoom and page to initial defaults whenever a new PDF is loaded
      setScale(1);
      setCurrentPage(1);
      setIsLoading(true);
      setError('');
      setFieldOverlays([]);
      setFieldValues({});
      setIsFilledForm(false);

      try {
        let rawBytes: Uint8Array;

        if (base64) {
          rawBytes = base64ToUint8Array(base64);
        } else {
          rawBytes = await fetchUrlAsUint8Array(url!);
        }

        pdfBytesRef.current = rawBytes;

        const loadingTask = pdfjsLib.getDocument({ data: rawBytes });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);

        // ── Detect fillable form ──────────────────────────────────────────
        const fieldObjects = await pdf.getFieldObjects().catch(() => null);
        const hasFields = fieldObjects && Object.keys(fieldObjects).length > 0;
        setIsFilledForm(!!hasFields);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [base64, url]);

  // ── Render page canvas ────────────────────────────────────────────────────
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          /* ignore */
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

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        // ── Build annotation field overlays ──────────────────────────────
        if (isFilledForm) {
          const annotations = await page.getAnnotations({ intent: 'display' });
          const overlays: FieldOverlay[] = [];

          for (const ann of annotations) {
            // Only interactive widget annotations (form fields)
            if (ann.subtype !== 'Widget') continue;

            // ann.rect is [x1, y1, x2, y2] in PDF coordinate space
            const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(
              ann.rect
            );

            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);

            const fieldType = resolveFieldType(ann);
            const fieldName: string = ann.fieldName ?? ann.id ?? '';

            overlays.push({
              id: ann.id,
              fieldType,
              fieldName,
              rect: { left, top, width, height },
              options: ann.options?.map((o: any) =>
                typeof o === 'string' ? o : (o.displayValue ?? o.exportValue)
              ),
              radioGroup: ann.radioGroup ?? undefined,
              readOnly: !!(ann.readOnly || ann.fieldFlags & 1),
              multiLine: !!(ann.multiLine || ann.fieldFlags & (1 << 12)),
            });

            // Pre-populate current values
            if (!(fieldName in fieldValues)) {
              const currentVal =
                ann.fieldValue !== undefined && ann.fieldValue !== null
                  ? ann.fieldValue
                  : fieldType === 'checkbox'
                    ? false
                    : '';
              setFieldValues((prev) => ({
                ...prev,
                [fieldName]:
                  typeof currentVal === 'boolean'
                    ? currentVal
                    : String(currentVal ?? ''),
              }));
            }
          }

          setFieldOverlays(overlays);
        }
      } catch (err: any) {
        const isCancelled =
          err?.name === 'RenderingCancelledException' ||
          err?.name === 'TransportException';
        if (!isCancelled) {
          console.error('Error rendering page:', err);
          setError('Failed to load PDF. Please try again.');
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pdfDoc, scale, isFilledForm]
  );

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // ── Resolve human-readable field type from annotation ─────────────────────
  function resolveFieldType(ann: any): string {
    const ft = ann.fieldType as string | undefined;
    if (ft === 'Tx') return ann.multiLine ? 'textarea' : 'text';
    if (ft === 'Btn') {
      // bit 16 (0-indexed: 15) set => radio button
      if (ann.radioButton || (ann.fieldFlags & (1 << 15)) !== 0) return 'radio';
      return 'checkbox';
    }
    if (ft === 'Ch') return 'choice';
    if (ft === 'Sig') return 'signature';
    return 'text';
  }

  // ── Auto-save: re-embed values into PDF bytes via pdf-lib ─────────────────
  const persistToPdf = useCallback(
    async (values: PdfFormFieldValues) => {
      if (!pdfBytesRef.current) return;
      try {
        const pdfLibDoc = await PDFDocument.load(pdfBytesRef.current, {
          ignoreEncryption: true,
        });
        const form = pdfLibDoc.getForm();

        for (const [name, value] of Object.entries(values)) {
          try {
            const field = form.getField(name);
            const fieldType = field.constructor.name;

            if (fieldType === 'PDFTextField') {
              (field as any).setText(String(value ?? ''));
            } else if (fieldType === 'PDFCheckBox') {
              if (value) {
                (field as any).check();
              } else {
                (field as any).uncheck();
              }
            } else if (fieldType === 'PDFDropdown') {
              (field as any).select(String(value ?? ''));
            } else if (fieldType === 'PDFRadioGroup') {
              (field as any).select(String(value ?? ''));
            }
          } catch {
            // Field may not be found by pdf-lib – skip silently
          }
        }

        const updatedBytes = await pdfLibDoc.save();
        pdfBytesRef.current = updatedBytes;
        const updatedBase64 = uint8ArrayToBase64(updatedBytes);
        onPdfUpdate?.(`data:application/pdf;base64,${updatedBase64}`);
      } catch (err) {
        console.error('Error persisting PDF form values:', err);
      }
    },
    [onPdfUpdate]
  );

  // ── Handle field value change ─────────────────────────────────────────────
  const handleFieldChange = useCallback(
    (fieldName: string, value: string | boolean) => {
      setFieldValues((prev) => {
        const updated = { ...prev, [fieldName]: value };
        onFieldChange?.(updated);

        // Debounced auto-save (300 ms – feels instant like Excel)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          persistToPdf(updated);
        }, 300);

        return updated;
      });
    },
    [onFieldChange, persistToPdf]
  );

  // ── Zoom & navigation helpers ─────────────────────────────────────────────
  const handleZoomIn = () => setScale((p) => Math.min(p + 0.25, 3));
  const handleZoomOut = () => setScale((p) => Math.max(p - 0.25, 0.5));
  const handlePageChange = (event: SelectChangeEvent<number>) =>
    setCurrentPage(Number(event.target.value));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => (pdfDoc ? Math.min(p + 1, pdfDoc.numPages) : p));

  // ── Render form field overlay element ────────────────────────────────────
  const renderFieldOverlay = (overlay: FieldOverlay) => {
    const { id, fieldType, fieldName, rect, readOnly } = overlay;
    const value = fieldValues[fieldName];

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      boxSizing: 'border-box',
    };

    const inputStyle: React.CSSProperties = {
      ...baseStyle,
      border: readOnly ? '1px solid transparent' : '1.5px solid #3B82F6',
      borderRadius: 2,
      background: readOnly ? 'rgba(243,244,246,0.7)' : 'rgba(255,255,255,0.92)',
      fontSize: Math.max(10, Math.round(12 * scale)),
      fontFamily: 'inherit',
      padding: '0 4px',
      outline: 'none',
      color: '#1E293B',
      resize: 'none',
      cursor: readOnly ? 'not-allowed' : 'text',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    };

    if (fieldType === 'checkbox') {
      return (
        <label
          key={id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: readOnly ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type='checkbox'
            checked={!!value}
            disabled={readOnly}
            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'inherit',
              accentColor: '#3B82F6',
            }}
          />
        </label>
      );
    }

    if (fieldType === 'radio') {
      return (
        <label
          key={id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: readOnly ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type='radio'
            name={overlay.radioGroup ?? fieldName}
            checked={value === id}
            disabled={readOnly}
            onChange={() => handleFieldChange(fieldName, id)}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'inherit',
              accentColor: '#3B82F6',
            }}
          />
        </label>
      );
    }

    if (fieldType === 'choice' && overlay.options?.length) {
      return (
        <select
          key={id}
          value={String(value ?? '')}
          disabled={readOnly}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          style={{
            ...inputStyle,
            appearance: 'auto',
            paddingRight: 20,
          }}
        >
          <option value='' />
          {overlay.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (fieldType === 'textarea') {
      return (
        <textarea
          key={id}
          value={String(value ?? '')}
          readOnly={readOnly}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          style={{ ...inputStyle, height: rect.height, paddingTop: 4 }}
          onFocus={(e) => {
            if (!readOnly) {
              (e.target as HTMLTextAreaElement).style.borderColor = '#2563EB';
              (e.target as HTMLTextAreaElement).style.boxShadow =
                '0 0 0 2px rgba(37,99,235,0.2)';
            }
          }}
          onBlur={(e) => {
            (e.target as HTMLTextAreaElement).style.borderColor = '#3B82F6';
            (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
          }}
        />
      );
    }

    if (fieldType === 'signature') {
      return (
        <div
          key={id}
          style={{
            ...baseStyle,
            border: '1.5px dashed #94A3B8',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
            fontSize: Math.max(9, Math.round(10 * scale)),
            background: 'rgba(248,250,252,0.85)',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          Signature Field
        </div>
      );
    }

    // Default: text input
    return (
      <input
        key={id}
        type='text'
        value={String(value ?? '')}
        readOnly={readOnly}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        style={inputStyle}
        onFocus={(e) => {
          if (!readOnly) {
            (e.target as HTMLInputElement).style.borderColor = '#2563EB';
            (e.target as HTMLInputElement).style.boxShadow =
              '0 0 0 2px rgba(37,99,235,0.2)';
          }
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.borderColor = '#3B82F6';
          (e.target as HTMLInputElement).style.boxShadow = 'none';
        }}
      />
    );
  };

  // ── Loading / Error states ────────────────────────────────────────────────
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
        <div className='w-full h-[40px] rounded-[4px] bg-gray-200' />
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Box className='flex flex-col h-full'>
      {/* PDF Controls */}
      <div className='sticky top-[30px] z-10 bg-white rounded-[4px] border border-[#CBD6E2] px-3 py-2 mb-4'>
        <Box className='flex items-center gap-4 flex-wrap'>
          {/* Fillable form badge */}
          {isFilledForm && (
            <Chip
              label='Fillable Form'
              size='small'
              sx={{
                height: 22,
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                borderRadius: '4px',
              }}
            />
          )}

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
              sx={{ '&.Mui-disabled': { color: '#CBD6E2' } }}
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
              sx={{ '&.Mui-disabled': { color: '#CBD6E2' } }}
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
              sx={{ '&.Mui-disabled': { color: '#CBD6E2' } }}
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
              sx={{ '&.Mui-disabled': { color: '#CBD6E2' } }}
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
          {/* PDF rendered canvas */}
          <canvas ref={canvasRef} className='shadow-lg bg-white block' />

          {/* Interactive form field overlays */}
          {isFilledForm &&
            fieldOverlays.map((overlay) => renderFieldOverlay(overlay))}
        </Box>
      </div>
    </Box>
  );
};

export default PdfViewer;
