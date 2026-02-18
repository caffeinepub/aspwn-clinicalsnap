// Photo import button with robust iPad compatibility, cancellation detection, clear error feedback, and view template selection for imported photos

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/lib/state/useAppStore';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';
import { logImportDiagnostic } from '@/lib/media/cameraDiagnostics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VIEW_TEMPLATES } from '@/lib/models';

interface SessionPhotoImportButtonProps {
  sessionId: string;
  patientId: string;
  disabled?: boolean;
}

export function SessionPhotoImportButton({
  sessionId,
  patientId,
  disabled,
}: SessionPhotoImportButtonProps) {
  const { createPhoto } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const importStartTimeRef = useRef<number>(0);
  const windowFocusTimeoutRef = useRef<number | null>(null);

  // Check if patient/session are valid
  const hasValidContext = Boolean(patientId && sessionId);

  const handleImportClick = () => {
    if (!hasValidContext) {
      const errorMsg = 'Please select a patient and session before importing photos.';
      toast.error(errorMsg);
      logImportDiagnostic('error', {
        message: 'Import blocked: missing patient or session',
      });
      return;
    }

    if (inputRef.current) {
      // Reset input to allow re-selection of same files
      inputRef.current.value = '';
      importStartTimeRef.current = Date.now();
      
      logImportDiagnostic('initiated');

      inputRef.current.click();

      // Set up cancellation detection for iPad Safari
      // If user returns focus without selecting files, treat as cancel
      if (windowFocusTimeoutRef.current !== null) {
        clearTimeout(windowFocusTimeoutRef.current);
      }

      const handleWindowFocus = () => {
        windowFocusTimeoutRef.current = window.setTimeout(() => {
          if (!isProcessing && importStartTimeRef.current > 0) {
            const elapsed = Date.now() - importStartTimeRef.current;
            // If focus returns quickly (< 500ms) or after a while without processing, likely canceled
            if (elapsed < 500 || elapsed > 1000) {
              logImportDiagnostic('canceled', {
                message: 'Import likely canceled by user (focus returned without file selection)',
                elapsedMs: elapsed,
              });
              importStartTimeRef.current = 0;
            }
          }
          window.removeEventListener('focus', handleWindowFocus);
        }, 300);
      };

      window.addEventListener('focus', handleWindowFocus, { once: true });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      logImportDiagnostic('canceled', {
        message: 'No files selected',
      });
      importStartTimeRef.current = 0;
      return;
    }

    if (!hasValidContext) {
      toast.error('Cannot import: patient or session not selected');
      logImportDiagnostic('error', {
        message: 'Import blocked during processing: missing patient or session',
      });
      importStartTimeRef.current = 0;
      return;
    }

    // Show template selection dialog
    setPendingFiles(files);
    setSelectedTemplate('none');
    setShowTemplateDialog(true);
  };

  const handleTemplateConfirm = async () => {
    if (!pendingFiles || !hasValidContext) {
      setShowTemplateDialog(false);
      setPendingFiles(null);
      return;
    }

    setShowTemplateDialog(false);
    setIsProcessing(true);

    const viewTemplate = selectedTemplate === 'none' ? undefined : selectedTemplate;

    logImportDiagnostic('initiated', {
      fileCount: pendingFiles.length,
      mimeTypes: Array.from(pendingFiles).map(f => f.type),
      hasViewTemplate: Boolean(viewTemplate),
    });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        
        try {
          const photoData = await captureFileToPhoto(file, sessionId, patientId);
          await createPhoto({
            ...photoData,
            sessionId,
            patientId,
            capturedAt: photoData.timestamp,
            viewTemplate,
          });
          
          successCount++;
        } catch (err) {
          failCount++;
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`File ${i + 1}: ${errorMsg}`);
          
          console.error(`Failed to import file ${i + 1}:`, err);
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully imported ${successCount} photo${successCount > 1 ? 's' : ''}`);
        logImportDiagnostic('success', {
          successCount,
          failCount,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Imported ${successCount} photo${successCount > 1 ? 's' : ''}, ${failCount} failed. ${errors[0] || 'Check console for details.'}`
        );
        logImportDiagnostic('error', {
          successCount,
          failCount,
          firstError: errors[0],
        });
      } else {
        toast.error(`Failed to import photos. ${errors[0] || 'Please check the file format and try again.'}`);
        logImportDiagnostic('error', {
          failCount,
          firstError: errors[0],
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('An error occurred during import. Please try again.');
      
      logImportDiagnostic('error', {
        error: String(err),
      });
    } finally {
      setIsProcessing(false);
      setPendingFiles(null);
      importStartTimeRef.current = 0;
      
      // Clear any pending focus timeout
      if (windowFocusTimeoutRef.current !== null) {
        clearTimeout(windowFocusTimeoutRef.current);
        windowFocusTimeoutRef.current = null;
      }
    }
  };

  const handleTemplateCancel = () => {
    setShowTemplateDialog(false);
    setPendingFiles(null);
    importStartTimeRef.current = 0;
    
    logImportDiagnostic('canceled', {
      message: 'User canceled view template selection',
    });
  };

  return (
    <>
      <Button
        onClick={handleImportClick}
        disabled={disabled || isProcessing || !hasValidContext}
        variant="outline"
        size="sm"
        className="touch-target"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* View template selection dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select View Template</DialogTitle>
            <DialogDescription>
              Choose a view template to apply to all imported photos, or select "None".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-view-template">View Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="import-view-template" className="touch-target">
                  <SelectValue placeholder="Select a view template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {VIEW_TEMPLATES.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleTemplateCancel} className="touch-target">
              Cancel
            </Button>
            <Button onClick={handleTemplateConfirm} className="touch-target">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
