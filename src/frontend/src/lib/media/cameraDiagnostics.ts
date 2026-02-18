// Structured camera and import diagnostics logging helper that categorizes errors (permission, not-found, constraint, timeout, etc.), supports both camera, import, and fallback-capture operations, logs to console with appropriate severity levels, and explicitly prohibits logging of patient/session IDs or media content.

import type { CameraError } from '@/camera/useCamera';

export type DiagnosticCategory =
  | 'permission'
  | 'not-found'
  | 'not-supported'
  | 'constraint'
  | 'timeout'
  | 'unknown';

export type DiagnosticOperation =
  | 'start'
  | 'stop'
  | 'switch'
  | 'capture'
  | 'validation'
  | 'import'
  | 'fallback-capture';

export interface DiagnosticDetails {
  [key: string]: string | number | boolean | undefined | object;
}

export interface CameraDiagnostic {
  category: DiagnosticCategory;
  operation: DiagnosticOperation;
  message: string;
  details?: DiagnosticDetails;
}

/**
 * Log a structured camera or import diagnostic event.
 * 
 * CRITICAL: Do NOT log patient/session IDs, patient names, or media content (image data, audio data).
 * Only log technical metadata such as operation stage, error strings, file mime type/size, and counts.
 */
export function logCameraDiagnostic(diagnostic: CameraDiagnostic): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Camera Diagnostic ${timestamp}]`;

  // Determine log level based on category
  const isError = ['permission', 'not-found', 'not-supported', 'timeout'].includes(diagnostic.category);
  const logFn = isError ? console.error : console.log;

  // Format the log message
  const logMessage = `${prefix} [${diagnostic.category.toUpperCase()}] [${diagnostic.operation}] ${diagnostic.message}`;

  if (diagnostic.details) {
    logFn(logMessage, diagnostic.details);
  } else {
    logFn(logMessage);
  }
}

/**
 * Categorize a camera error for diagnostic purposes.
 * Note: CameraError type only supports 'permission' | 'not-found' | 'not-supported' | 'unknown'
 * Other error types like 'timeout' are handled separately in the diagnostic system.
 */
export function categorizeCameraError(error: CameraError): DiagnosticCategory {
  switch (error.type) {
    case 'permission':
      return 'permission';
    case 'not-found':
      return 'not-found';
    case 'not-supported':
      return 'not-supported';
    case 'unknown':
    default:
      return 'unknown';
  }
}

/**
 * Log an import diagnostic event.
 * 
 * CRITICAL: Do NOT log patient/session IDs, patient names, or media content.
 * Only log technical metadata such as file type, size, error strings, and counts.
 */
export function logImportDiagnostic(
  stage: 'initiated' | 'canceled' | 'success' | 'error',
  details?: DiagnosticDetails
): void {
  logCameraDiagnostic({
    category: 'unknown',
    operation: 'import',
    message: `Import ${stage}`,
    details,
  });
}
