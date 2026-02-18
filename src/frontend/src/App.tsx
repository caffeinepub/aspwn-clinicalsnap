// Main app component with PIN lock and initialization

import { useEffect, useState } from 'react';
import { useAppStore } from './lib/state/useAppStore';
import { runMigrations } from './lib/storage/migrations';
import { ClinicalSnapShell } from './components/layout/ClinicalSnapShell';
import { PinLockScreen } from './components/security/PinLockScreen';
import { verifyPin } from './lib/security/pinLock';
import { AutoLockManager } from './lib/security/pinLock';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function App() {
  const { loadData, isInitialized, settings } = useAppStore();
  const [isLocked, setIsLocked] = useState(false);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  const [autoLockManager, setAutoLockManager] = useState<AutoLockManager | null>(null);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      await runMigrations();
      await loadData();
    };
    init();
  }, [loadData]);

  // Check PIN lock on mount
  useEffect(() => {
    if (isInitialized && settings) {
      setIsLocked(settings.privacy.pinEnabled);
      setIsCheckingLock(false);

      // Setup auto-lock
      if (settings.privacy.pinEnabled && settings.privacy.autoLockTimeout > 0) {
        const manager = new AutoLockManager(settings.privacy.autoLockTimeout, () => {
          setIsLocked(true);
        });
        manager.start();
        setAutoLockManager(manager);

        return () => {
          manager.stop();
        };
      }
    }
  }, [isInitialized, settings]);

  // Update auto-lock timeout when settings change
  useEffect(() => {
    if (autoLockManager && settings?.privacy.autoLockTimeout) {
      autoLockManager.updateTimeout(settings.privacy.autoLockTimeout);
    }
  }, [autoLockManager, settings?.privacy.autoLockTimeout]);

  const handleUnlock = async (pin: string): Promise<boolean> => {
    if (!settings?.privacy.pinHash) return false;
    const isValid = await verifyPin(pin, settings.privacy.pinHash);
    if (isValid) {
      setIsLocked(false);
      autoLockManager?.reset();
    }
    return isValid;
  };

  if (isCheckingLock || !isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Aspen Clinic Snap...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <PinLockScreen onUnlock={handleUnlock} />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ClinicalSnapShell />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
