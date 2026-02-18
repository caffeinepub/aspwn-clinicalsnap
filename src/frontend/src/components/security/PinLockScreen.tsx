// PIN lock screen component

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

export function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    const isValid = await onUnlock(pin);
    
    if (!isValid) {
      setError('Incorrect PIN');
      setPin('');
    }
    
    setIsVerifying(false);
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Aspwn ClinicalSnap</h1>
            <p className="text-muted-foreground mt-2">Enter your PIN to unlock</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter PIN"
              className="text-center text-2xl tracking-widest h-16 max-w-xs"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                className="h-16 text-xl touch-target-lg"
                onClick={() => handleNumberClick(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-16 text-xl touch-target-lg"
              onClick={handleBackspace}
            >
              ←
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-16 text-xl touch-target-lg"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              type="submit"
              size="lg"
              className="h-16 text-xl touch-target-lg"
              disabled={pin.length < 4 || isVerifying}
            >
              {isVerifying ? '...' : '✓'}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Local storage only • Data never leaves your device
        </p>
      </div>
    </div>
  );
}
