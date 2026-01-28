import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useUIStore } from '@/stores/uiStore';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LogsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const KeyboardIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

export function CommandPalette() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const openShortcutsHelp = useUIStore((state) => state.openShortcutsHelp);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const runAction = useCallback((action: () => void) => {
    closeCommandPalette();
    action();
  }, [closeCommandPalette]);

  const applicantActions: CommandAction[] = [
    {
      id: 'browse-jobs',
      label: 'Browse Jobs',
      icon: <BriefcaseIcon />,
      action: () => navigate('/app/jobs'),
      keywords: ['find', 'search', 'work'],
    },
    {
      id: 'my-applications',
      label: 'My Applications',
      icon: <DocumentIcon />,
      action: () => navigate('/app/applications'),
      keywords: ['applied', 'status'],
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: <UserIcon />,
      action: () => navigate('/app/account'),
      keywords: ['profile', 'settings'],
    },
  ];

  const employerActions: CommandAction[] = [
    {
      id: 'my-jobs',
      label: 'My Job Postings',
      icon: <BriefcaseIcon />,
      action: () => navigate('/app/employer/jobs'),
      keywords: ['listings', 'postings'],
    },
    {
      id: 'create-job',
      label: 'Create New Job',
      icon: <PlusIcon />,
      action: () => navigate('/app/employer/jobs/create'),
      keywords: ['post', 'new', 'add'],
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: <UserIcon />,
      action: () => navigate('/app/account'),
      keywords: ['profile', 'settings'],
    },
  ];

  const adminActions: CommandAction[] = [
    {
      id: 'health',
      label: 'System Health',
      icon: <ChartIcon />,
      action: () => navigate('/app/admin/health'),
      keywords: ['status', 'monitoring'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <LogsIcon />,
      action: () => navigate('/app/admin/audit-logs'),
      keywords: ['history', 'events'],
    },
    {
      id: 'account',
      label: 'Account Settings',
      icon: <UserIcon />,
      action: () => navigate('/app/account'),
      keywords: ['profile', 'settings'],
    },
  ];

  const navigationActions =
    user?.role === 'admin'
      ? adminActions
      : user?.role === 'employer'
      ? employerActions
      : applicantActions;

  const quickActions: CommandAction[] = [
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      icon: <SearchIcon />,
      action: toggleSidebar,
      keywords: ['collapse', 'expand', 'menu'],
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <KeyboardIcon />,
      action: openShortcutsHelp,
      keywords: ['help', 'hotkeys'],
    },
  ];

  return (
    <CommandDialog open={isOpen} onOpenChange={closeCommandPalette}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationActions.map((action) => (
            <CommandItem
              key={action.id}
              onSelect={() => runAction(action.action)}
              keywords={action.keywords}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.id}
              onSelect={() => runAction(action.action)}
              keywords={action.keywords}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
