// Patient create/edit dialog

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
import { Textarea } from '@/components/ui/textarea';
import type { Patient } from '@/lib/models';

interface PatientEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  onSave?: () => void;
}

export function PatientEditorDialog({
  open,
  onOpenChange,
  patient,
  onSave,
}: PatientEditorDialogProps) {
  const { createPatient, updatePatient } = useAppStore();

  const [name, setName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [treatmentHistory, setTreatmentHistory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setPatientId(patient.patientId);
      setDateOfBirth(patient.dateOfBirth);
      setTreatmentHistory(patient.treatmentHistory);
    } else {
      setName('');
      setPatientId('');
      setDateOfBirth('');
      setTreatmentHistory('');
    }
  }, [patient, open]);

  const handleSave = async () => {
    if (!name.trim() || !patientId.trim()) return;

    setIsSaving(true);
    try {
      if (patient) {
        await updatePatient(patient.id, {
          name: name.trim(),
          patientId: patientId.trim(),
          dateOfBirth,
          treatmentHistory,
        });
      } else {
        await createPatient({
          name: name.trim(),
          patientId: patientId.trim(),
          dateOfBirth,
          treatmentHistory,
        });
      }
      onSave?.();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{patient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID *</Label>
            <Input
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="P-12345"
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history">Treatment History</Label>
            <Textarea
              id="history"
              value={treatmentHistory}
              onChange={(e) => setTreatmentHistory(e.target.value)}
              placeholder="Previous treatments, notes..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="touch-target"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !patientId.trim() || isSaving}
            className="touch-target"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
