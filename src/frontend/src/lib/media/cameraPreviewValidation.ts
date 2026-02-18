// Camera preview validation helper with enhanced iPad Safari detection for black/blank preview scenarios, checking both readyState and actual frame advancement.

export interface PreviewValidationResult {
  isReady: boolean;
  reason?: string;
}

export async function validateVideoPreview(
  video: HTMLVideoElement,
  timeoutMs: number = 5000
): Promise<PreviewValidationResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let checkCount = 0;
    let lastVideoTime = -1;

    const checkPreview = () => {
      checkCount++;
      const elapsed = Date.now() - startTime;

      // Timeout check
      if (elapsed > timeoutMs) {
        resolve({
          isReady: false,
          reason: `Validation timeout after ${timeoutMs}ms (${checkCount} checks)`,
        });
        return;
      }

      // Check 1: Video dimensions must be present
      if (!video.videoWidth || !video.videoHeight) {
        setTimeout(checkPreview, 200);
        return;
      }

      // Check 2: ReadyState should be at least HAVE_CURRENT_DATA (2)
      // Note: iOS Safari may not reach HAVE_ENOUGH_DATA (4), so we accept 2+
      if (video.readyState < 2) {
        setTimeout(checkPreview, 200);
        return;
      }

      // Check 3: Verify video is actually playing (frames advancing)
      // This catches iPad Safari black screen where dimensions exist but no frames
      const currentTime = video.currentTime;
      
      if (lastVideoTime === -1) {
        // First check - record time and check again
        lastVideoTime = currentTime;
        setTimeout(checkPreview, 300);
        return;
      }

      // If currentTime hasn't changed, video might be stuck
      if (currentTime === lastVideoTime && currentTime === 0) {
        // Video is stuck at 0 - try to trigger play
        video.play().catch(() => {
          // Ignore play errors, will retry
        });
        setTimeout(checkPreview, 300);
        return;
      }

      // Check 4: Verify video element is visible and has non-zero size
      const rect = video.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(checkPreview, 200);
        return;
      }

      // All checks passed
      resolve({
        isReady: true,
      });
    };

    // Start checking
    checkPreview();
  });
}
