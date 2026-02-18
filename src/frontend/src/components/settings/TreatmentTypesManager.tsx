// Treatment types manager

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { TreatmentType } from '@/lib/models';

export function TreatmentTypesManager() {
  const { treatmentTypes, createTreatmentType, updateTreatmentType, deleteTreatmentType } =
    useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<TreatmentType | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0ea5e9');

  const handleCreate = async () => {
    if (!name.trim()) return;

    await createTreatmentType({ name: name.trim(), color });
    setName('');
    setColor('#0ea5e9');
    setIsCreating(false);
    toast.success('Treatment type created');
  };

  const handleUpdate = async () => {
    if (!editingType || !name.trim()) return;

    await updateTreatmentType(editingType.id, { name: name.trim(), color });
    setEditingType(null);
    toast.success('Treatment type updated');
  };

  const handleDelete = async (id: string) => {
    await deleteTreatmentType(id);
    toast.success('Treatment type deleted');
  };

  const openEdit = (type: TreatmentType) => {
    setEditingType(type);
    setName(type.name);
    setColor(type.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Treatment Types</h3>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="touch-target"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-4 space-y-2">
          {treatmentTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="font-medium">{type.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(type)}
                  className="touch-target"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                  className="touch-target text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Create dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Treatment Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Veneer"
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="touch-target h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)} className="touch-target">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()} className="touch-target">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Treatment Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editColor">Color</Label>
              <Input
                id="editColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="touch-target h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)} className="touch-target">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!name.trim()} className="touch-target">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
