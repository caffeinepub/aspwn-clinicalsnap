// Audio recording utilities for voice memos

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stop(): Promise<{ audioData: Uint8Array; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      const startTime = Date.now();

      this.mediaRecorder.onstop = async () => {
        const duration = (Date.now() - startTime) / 1000;
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const audioData = new Uint8Array(await blob.arrayBuffer());
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        resolve({ audioData, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

export function uint8ArrayToAudioURL(data: Uint8Array): string {
  // Create a new Uint8Array to ensure proper ArrayBuffer type
  const newData = new Uint8Array(data);
  const blob = new Blob([newData], { type: 'audio/webm' });
  return URL.createObjectURL(blob);
}
