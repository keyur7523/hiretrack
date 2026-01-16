import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
  };
  return map[type] || type;
}

export function formatApplicationStatus(status: string): string {
  const map: Record<string, string> = {
    applied: 'Applied',
    reviewed: 'Reviewed',
    interview: 'Interview',
    rejected: 'Rejected',
    accepted: 'Accepted',
  };
  return map[status] || status;
}
