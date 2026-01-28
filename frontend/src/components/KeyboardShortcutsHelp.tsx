import { useUIStore } from '@/stores/uiStore';
import { shortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function KeyboardShortcutsHelp() {
  const isOpen = useUIStore((state) => state.isShortcutsHelpOpen);
  const closeShortcutsHelp = useUIStore((state) => state.closeShortcutsHelp);

  return (
    <Dialog open={isOpen} onOpenChange={closeShortcutsHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Press <kbd className="px-1 rounded bg-muted">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
