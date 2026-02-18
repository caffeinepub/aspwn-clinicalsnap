// Privacy settings panel

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { hashPin } from '@/lib/security/pinLock';
import { toast } from 'sonner';

export function PrivacySettingsPanel() {
  const { settings, updateSettings } = useAppStore();

  const [pinEnabled, setPinEnabled] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);

  useEffect(() => {
    if (settings) {
      setPinEnabled(settings.privacy.pinEnabled);
      setAutoLockTimeout(settings.privacy.autoLockTimeout);
    }
  }, [settings]);

  const handleSave = async () => {
    if (pinEnabled && newPin) {
      if (newPin.length < 4) {
        toast.error('PIN must be at least 4 digits');
        return;
      }
      if (newPin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }

      const pinHash = await hashPin(newPin);
      await updateSettings({
        privacy: {
          pinEnabled: true,
          pinHash,
          autoLockTimeout,
        },
      });

      setNewPin('');
      setConfirmPin('');
      toast.success('PIN set successfully');
    } else {
      await updateSettings({
        privacy: {
          pinEnabled,
          pinHash: settings?.privacy.pinHash,
          autoLockTimeout,
        },
      });
      toast.success('Privacy settings saved');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="pinEnabled">PIN Lock</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Require PIN to access the app
          </p>
        </div>
        <Switch
          id="pinEnabled"
          checked={pinEnabled}
          onCheckedChange={setPinEnabled}
        />
      </div>

      {pinEnabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="newPin">
              {settings?.privacy.pinHash ? 'Change PIN' : 'Set PIN'}
            </Label>
            <Input
              id="newPin"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 4-6 digit PIN"
              className="touch-target"
            />
          </div>

          {newPin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirm PIN"
                className="touch-target"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="timeout">Auto-Lock Timeout</Label>
            <Select
              value={autoLockTimeout.toString()}
              onValueChange={(v) => setAutoLockTimeout(parseInt(v))}
            >
              <SelectTrigger className="touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Never</SelectItem>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button onClick={handleSave} className="w-full touch-target">
        Save Privacy Settings
      </Button>
    </div>
  );
}
