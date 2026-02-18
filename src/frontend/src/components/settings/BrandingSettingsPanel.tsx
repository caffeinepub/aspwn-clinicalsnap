// Branding settings panel

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function BrandingSettingsPanel() {
  const { settings, updateSettings } = useAppStore();

  const [clinicName, setClinicName] = useState('');
  const [useDefaultLogo, setUseDefaultLogo] = useState(true);
  const [customLogoFile, setCustomLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      setClinicName(settings.branding.clinicName);
      setUseDefaultLogo(settings.branding.useDefaultLogo);
    }
  }, [settings]);

  const handleSave = async () => {
    let logoData = settings?.branding.logoData;

    if (customLogoFile && !useDefaultLogo) {
      const arrayBuffer = await customLogoFile.arrayBuffer();
      logoData = new Uint8Array(arrayBuffer);
    }

    await updateSettings({
      branding: {
        clinicName,
        useDefaultLogo,
        logoData,
      },
    });

    toast.success('Branding settings saved');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clinicName">Clinic Name</Label>
        <Input
          id="clinicName"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder="Aspen Clinic Snap"
          className="touch-target"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useDefault">Use Default Logo</Label>
          <Switch
            id="useDefault"
            checked={useDefaultLogo}
            onCheckedChange={setUseDefaultLogo}
          />
        </div>

        {!useDefaultLogo && (
          <div className="space-y-2">
            <Label htmlFor="logo">Custom Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => setCustomLogoFile(e.target.files?.[0] || null)}
              className="touch-target"
            />
          </div>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-muted/30">
        <p className="text-sm font-medium mb-2">Preview</p>
        <div className="flex items-center gap-3">
          {useDefaultLogo ? (
            <img
              src="/assets/generated/aspen-clinic-snap-logo.dim_1024x256.png"
              alt="Logo"
              className="h-8"
            />
          ) : customLogoFile ? (
            <img
              src={URL.createObjectURL(customLogoFile)}
              alt="Custom logo"
              className="h-8"
            />
          ) : (
            <div className="h-8 w-32 bg-muted rounded" />
          )}
          <span className="font-semibold">{clinicName || 'Clinic Name'}</span>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full touch-target">
        Save Branding
      </Button>
    </div>
  );
}
