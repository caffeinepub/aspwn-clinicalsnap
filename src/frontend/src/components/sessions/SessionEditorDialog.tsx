// Session create/edit dialog with multi-select treatment type support

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { getSessionTreatmentIds } from '@/lib/models';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import type { Session } from '@/lib/models';
import { format } from 'date-fns';

interface SessionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  session?: Session;
  onSave?: (session: Session) => void;
}

export function SessionEditorDialog({
  open,
  onOpenChange,
  patientId,
  session,
  onSave,
}: SessionEditorDialogProps) {
  const { createSession, updateSession, treatmentTypes } = useAppStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (session) {
        setTitle(session.title);
        setDate(session.date);
        setSelectedTreatmentIds(getSessionTreatmentIds(session));
      } else {
        setTitle(`Visit – ${format(new Date(), 'MMM d, yyyy')}`);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setSelectedTreatmentIds([]);
      }
    }
  }, [session, open]);

  const handleToggleTreatment = (treatmentId: string) => {
    setSelectedTreatmentIds((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  const handleClearAll = () => {
    setSelectedTreatmentIds([]);
  };

  const handleSave = async () => {
    if (!title.trim() || !date) return;

    setIsSaving(true);
    setError(null);

    try {
      let savedSession: Session;
      if (session) {
        await updateSession(session.id, {
          title: title.trim(),
          date,
          treatmentTypeIds: selectedTreatmentIds,
        });
        savedSession = {
          ...session,
          title: title.trim(),
          date,
          treatmentTypeIds: selectedTreatmentIds,
          updatedAt: Date.now(),
        };
      } else {
        savedSession = await createSession({
          patientId,
          title: title.trim(),
          date,
          treatmentTypeIds: selectedTreatmentIds,
        });
      }

      onSave?.(savedSession);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save session:', err);
      setError('Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'New Session'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Initial Consultation"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Treatment Types</Label>
              {selectedTreatmentIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isSaving}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            <ScrollArea className="h-48 border rounded-md">
              <div className="p-3 space-y-2">
                {treatmentTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No treatment types available
                  </p>
                ) : (
                  treatmentTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 touch-target"
                    >
                      <Checkbox
                        id={`treatment-${type.id}`}
                        checked={selectedTreatmentIds.includes(type.id)}
                        onCheckedChange={() => handleToggleTreatment(type.id)}
                        disabled={isSaving}
                      />
                      <label
                        htmlFor={`treatment-${type.id}`}
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-sm">{type.name}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {selectedTreatmentIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedTreatmentIds.length} treatment{selectedTreatmentIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !date || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
