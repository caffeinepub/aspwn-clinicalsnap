// Session create/edit dialog with error handling and proper treatment type selection

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Session } from '@/lib/models';
import { format } from 'date-fns';

interface SessionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  session?: Session;
  onSave?: (session: Session) => void;
}

const NONE_VALUE = '__none__';

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
  const [treatmentTypeId, setTreatmentTypeId] = useState<string>(NONE_VALUE);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (session) {
        setTitle(session.title);
        setDate(session.date);
        setTreatmentTypeId(session.treatmentTypeId || NONE_VALUE);
      } else {
        setTitle(`Visit – ${format(new Date(), 'MMM d, yyyy')}`);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTreatmentTypeId(NONE_VALUE);
      }
    }
  }, [session, open]);

  const handleSave = async () => {
    if (!title.trim() || !date) return;

    setIsSaving(true);
    setError(null);

    try {
      const treatmentTypeValue = treatmentTypeId === NONE_VALUE ? undefined : treatmentTypeId;

      let savedSession: Session;
      if (session) {
        await updateSession(session.id, {
          title: title.trim(),
          date,
          treatmentTypeId: treatmentTypeValue,
        });
        savedSession = {
          ...session,
          title: title.trim(),
          date,
          treatmentTypeId: treatmentTypeValue,
          updatedAt: Date.now(),
        };
      } else {
        savedSession = await createSession({
          patientId,
          title: title.trim(),
          date,
          treatmentTypeId: treatmentTypeValue,
        });
      }

      onSave?.(savedSession);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save session:', err);
      setError('Could not save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Visit – Feb 18, 2026"
              className="touch-target"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="touch-target"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment">Treatment Type</Label>
            <Select
              value={treatmentTypeId}
              onValueChange={setTreatmentTypeId}
              disabled={isSaving}
            >
              <SelectTrigger className="touch-target">
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="touch-target"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !date || isSaving}
            className="touch-target"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
