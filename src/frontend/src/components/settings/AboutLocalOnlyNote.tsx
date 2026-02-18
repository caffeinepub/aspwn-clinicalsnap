// About and local-only storage note

export function AboutLocalOnlyNote() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Aspen Clinic Snap</h3>
        <p className="text-sm text-muted-foreground">
          Smart clinical photography manager for dental and aesthetic clinics
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-primary/5 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span className="text-primary">🔒</span>
          Local Storage Only
        </h4>
        <p className="text-sm text-muted-foreground">
          All patient photos, sessions, annotations, and voice memos are stored locally in your
          browser's storage. Data never leaves your device unless you explicitly export it.
        </p>
        <p className="text-sm text-muted-foreground">
          This ensures maximum privacy and compliance with patient data protection requirements.
        </p>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Clearing your browser data will permanently delete all stored
          information. Always export important before/after comparisons for backup.
        </p>
      </div>

      <div className="pt-6 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Aspen Clinic Snap</p>
        <p className="mt-2">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.hostname : 'aspen-clinic-snap'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
