import { useHotkeys } from 'react-hotkeys-hook';
import { useUIStore } from '@/stores/uiStore';

export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleShortcutsHelp = useUIStore((state) => state.toggleShortcutsHelp);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const closeShortcutsHelp = useUIStore((state) => state.closeShortcutsHelp);

  // Cmd+K: Toggle command palette
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    toggleCommandPalette();
  }, { enableOnFormTags: true });

  // Cmd+B: Toggle sidebar
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    toggleSidebar();
  }, { enableOnFormTags: true });

  // Cmd+/: Toggle shortcuts help
  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    toggleShortcutsHelp();
  }, { enableOnFormTags: true });

  // Escape: Close modals
  useHotkeys('escape', () => {
    closeCommandPalette();
    closeShortcutsHelp();
  }, { enableOnFormTags: true });
}

export interface Shortcut {
  keys: string;
  description: string;
}

export const shortcuts: Shortcut[] = [
  { keys: '⌘ K', description: 'Open command palette' },
  { keys: '⌘ B', description: 'Toggle sidebar' },
  { keys: '⌘ /', description: 'Show keyboard shortcuts' },
  { keys: 'Esc', description: 'Close modals' },
  { keys: 'j / k', description: 'Navigate lists' },
  { keys: 'Enter', description: 'Select item' },
];
