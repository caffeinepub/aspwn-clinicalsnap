// Audio recording utilities with robust error handling, MIME type detection, and accurate duration tracking

export interface RecordingError {
  type: 'permission' | 'not-supported' | 'not-found' | 'unknown';
  message: string;
}

export interface RecordingResult {
  audioData: Uint8Array;
  duration: number;
  mimeType: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private recordingMimeType: string = 'audio/webm'; // Default, will be detected

  // Preflight check for recording support
  static async checkSupport(): Promise<{ supported: boolean; error?: RecordingError }> {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: {
          type: 'not-supported',
          message: 'Audio recording is not supported on this browser. Please try a different browser.',
        },
      };
    }

    // Check if MediaRecorder is available
    if (typeof MediaRecorder === 'undefined') {
      return {
        supported: false,
        error: {
          type: 'not-supported',
          message: 'Audio recording is not supported on this device. Please try a different browser.',
        },
      };
    }

    return { supported: true };
  }

  // Detect best supported MIME type
  private detectSupportedMimeType(): string | null {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    return null;
  }

  async start(): Promise<{ success: boolean; error?: RecordingError }> {
    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detect supported MIME type
      const supportedMimeType = this.detectSupportedMimeType();
      
      if (!supportedMimeType) {
        this.cleanup();
        return {
          success: false,
          error: {
            type: 'not-supported',
            message: 'No supported audio format found on this device. Recording is not available.',
          },
        };
      }

      this.recordingMimeType = supportedMimeType;
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: supportedMimeType });
      this.chunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      return { success: true };
    } catch (error: any) {
      this.cleanup();
      
      // Categorize the error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          success: false,
          error: {
            type: 'permission',
            message: 'Microphone access denied. Please enable microphone permissions in your browser settings and try again.',
          },
        };
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return {
          success: false,
          error: {
            type: 'not-found',
            message: 'No microphone found. Please connect a microphone and try again.',
          },
        };
      } else if (error.name === 'NotSupportedError') {
        return {
          success: false,
          error: {
            type: 'not-supported',
            message: 'Audio recording is not supported on this device or browser.',
          },
        };
      } else {
        return {
          success: false,
          error: {
            type: 'unknown',
            message: 'Failed to start recording. Please try again or use the fallback option.',
          },
        };
      }
    }
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      // Calculate duration from start time (more accurate than stop-time)
      const duration = (Date.now() - this.startTime) / 1000;
      const mimeType = this.recordingMimeType;

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: mimeType });
          const audioData = new Uint8Array(await blob.arrayBuffer());
          
          this.cleanup();
          resolve({ audioData, duration, mimeType });
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = 0;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

// Helper to detect MIME type from audio data
export function detectAudioMimeType(data: Uint8Array): string {
  // Check magic bytes for common audio formats
  if (data.length < 12) return 'audio/mpeg'; // Default fallback

  // WebM: starts with 0x1A 0x45 0xDF 0xA3
  if (data[0] === 0x1A && data[1] === 0x45 && data[2] === 0xDF && data[3] === 0xA3) {
    return 'audio/webm';
  }

  // MP4/M4A: contains 'ftyp' at bytes 4-7
  if (data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70) {
    return 'audio/mp4';
  }

  // MP3: starts with 0xFF 0xFB or 0xFF 0xF3 or 0xFF 0xF2 or ID3
  if ((data[0] === 0xFF && (data[1] & 0xE0) === 0xE0) || 
      (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33)) {
    return 'audio/mpeg';
  }

  // OGG: starts with 'OggS'
  if (data[0] === 0x4F && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53) {
    return 'audio/ogg';
  }

  // WAV: starts with 'RIFF' and contains 'WAVE'
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x41 && data[10] === 0x56 && data[11] === 0x45) {
    return 'audio/wav';
  }

  // Default fallback
  return 'audio/mpeg';
}
