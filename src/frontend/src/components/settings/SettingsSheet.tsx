// Settings sheet with branding, privacy, and treatment types

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandingSettingsPanel } from './BrandingSettingsPanel';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';
import { TreatmentTypesManager } from './TreatmentTypesManager';
import { AboutLocalOnlyNote } from './AboutLocalOnlyNote';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const [activeTab, setActiveTab] = useState('branding');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4 mt-6">
            <BrandingSettingsPanel />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-6">
            <PrivacySettingsPanel />
          </TabsContent>

          <TabsContent value="treatments" className="space-y-4 mt-6">
            <TreatmentTypesManager />
          </TabsContent>

          <TabsContent value="about" className="space-y-4 mt-6">
            <AboutLocalOnlyNote />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
