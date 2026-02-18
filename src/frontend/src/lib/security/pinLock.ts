// PIN lock security utilities

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin);
  return pinHash === hash;
}

export class AutoLockManager {
  private timeout: NodeJS.Timeout | null = null;
  private onLock: () => void;
  private timeoutMinutes: number;

  constructor(timeoutMinutes: number, onLock: () => void) {
    this.timeoutMinutes = timeoutMinutes;
    this.onLock = onLock;
  }

  start() {
    this.reset();
    // Listen for user activity
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((event) => {
      document.addEventListener(event, this.reset.bind(this), true);
    });
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((event) => {
      document.removeEventListener(event, this.reset.bind(this), true);
    });
  }

  reset() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.timeoutMinutes > 0) {
      this.timeout = setTimeout(() => {
        this.onLock();
      }, this.timeoutMinutes * 60 * 1000);
    }
  }

  updateTimeout(minutes: number) {
    this.timeoutMinutes = minutes;
    this.reset();
  }
}
