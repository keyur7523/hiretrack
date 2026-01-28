---
name: hiretrack-frontend
description: Frontend conventions for HireTrack - React 18, TypeScript, TailwindCSS, shadcn/ui, React Query. Use when creating or modifying frontend components, pages, or styles.
version: 1.0.0
tags: [react, typescript, tailwind, shadcn, frontend]
---

# HireTrack Frontend Skill

## Tech Stack (DO NOT CHANGE)

| Layer | Technology |
|-------|------------|
| Framework | React 18.3 + TypeScript |
| Build | Vite 5 |
| Styling | TailwindCSS 3.4 + CSS Variables (HSL format) |
| Components | shadcn/ui (Radix primitives) |
| Server State | @tanstack/react-query v5 |
| Client State | React Context (AuthContext, ToastContext) |
| Routing | react-router-dom v6 |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Dates | date-fns |
| Animations | tailwindcss-animate |

## Project Structure

```
src/
├── api/           # API client and endpoint functions
├── auth/          # AuthContext and useAuth hook
├── components/
│   ├── layout/    # AppLayout, Header, Sidebar, MobileNav, PageContainer
│   └── ui/        # shadcn/ui components
├── contexts/      # ToastContext
├── hooks/         # Custom hooks (use-mobile, use-toast)
├── lib/           # Utilities (cn function)
├── pages/
│   ├── admin/     # AdminHealthPage, AdminAuditLogsPage
│   ├── applicant/ # JobsListPage, ApplicationsListPage, etc.
│   ├── common/    # AccountPage, NotFoundPage, UnauthorizedPage
│   ├── employer/  # EmployerJobsListPage, JobCreatePage, etc.
│   └── public/    # LoginPage, RegisterPage, ForgotPasswordPage
├── routes/        # AppRouter, ProtectedRoute, RoleRoute
├── types/         # TypeScript interfaces
└── utils/         # Validators, formatters, uuid
```

## Design System

### Color Palette (HSL Format - REQUIRED)

All colors MUST use HSL format via CSS variables. Never use hex or rgb directly.

```css
/* Light Mode */
--primary: 210 90% 40%;           /* Blue - main actions */
--primary-hover: 210 90% 35%;
--primary-soft: 210 80% 95%;

--destructive: 0 72% 51%;         /* Red - errors, danger */
--success: 142 70% 40%;           /* Green - success states */
--warning: 38 92% 50%;            /* Amber - warnings */
--info: 210 80% 55%;              /* Blue - info states */

--background: 0 0% 100%;          /* White */
--foreground: 220 20% 10%;        /* Near black */
--muted-foreground: 220 10% 45%;  /* Gray text */

--border: 220 13% 91%;            /* Light gray borders */
--surface: 210 20% 98%;           /* Slightly off-white */
```

### Using Colors in Components

```tsx
// ✅ Correct - use semantic color names
<div className="bg-background text-foreground border-border" />
<Button className="bg-primary text-primary-foreground hover:bg-primary-hover" />
<Badge className="bg-success-soft text-success" />

// ❌ Wrong - never use raw colors
<div className="bg-white text-black border-gray-200" />
<div style={{ backgroundColor: '#2563eb' }} />
```

### Status Colors (Application States)

```tsx
const statusVariant = (status: ApplicationStatus) => {
  if (status === 'accepted') return 'default';      // Primary blue
  if (status === 'rejected') return 'destructive';  // Red
  if (status === 'interview') return 'secondary';   // Gray
  return 'outline';                                  // Outlined
};

<Badge variant={statusVariant(application.status)}>
  {formatApplicationStatus(application.status)}
</Badge>
```

## Component Patterns

### Page Structure

Every page MUST use `PageContainer`:

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export function MyPage() {
  return (
    <PageContainer 
      title="Page Title" 
      description="Optional description"
      actions={<Button>Action</Button>}
    >
      {/* Page content */}
    </PageContainer>
  );
}
```

### Loading States (Skeleton Pattern)

ALWAYS use `Skeleton` for loading states. NEVER use spinners for content loading.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// ✅ Correct - skeleton matches content shape
{isLoading && (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={`skeleton-${index}`} className="h-12 w-full" />
    ))}
  </div>
)}

// ✅ Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-2/3" />
    <Skeleton className="h-4 w-1/3" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </CardContent>
</Card>

// ❌ Wrong - spinner for content
{isLoading && <div className="animate-spin" />}
```

### Error States

Use consistent error display pattern:

```tsx
{!isLoading && error && (
  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>{error}</span>
      <Button variant="outline" onClick={fetchData}>Retry</Button>
    </div>
  </div>
)}
```

### Empty States

```tsx
{!isLoading && !error && items.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    <p>No items found.</p>
  </div>
)}
```

### Data Fetching Pattern

```tsx
export function MyListPage() {
  const { showToast } = useToastContext();
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.list({ page, pageSize });
      setItems(response.items);
      setTotal(response.total);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load items.';
      setError(message);
      setItems([]);
      setTotal(0);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, pageSize]);

  return (
    <PageContainer title="Items">
      {/* Loading skeleton */}
      {/* Error state */}
      {/* Empty state */}
      {/* Content */}
      {/* Pagination */}
    </PageContainer>
  );
}
```

### Pagination Component Pattern

```tsx
{!isLoading && !error && totalPages > 1 && (
  <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
    <div className="text-sm text-muted-foreground">
      Page {page} of {totalPages} · {total} items
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={page >= totalPages}
      >
        Next
      </Button>
      <select
        value={pageSize}
        onChange={(event) => {
          setPageSize(Number(event.target.value));
          setPage(1);
        }}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {[5, 10, 20].map((size) => (
          <option key={size} value={size}>{size} / page</option>
        ))}
      </select>
    </div>
  </div>
)}
```

## Form Patterns

### Form with Validation

```tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function MyForm() {
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await api.create({ title: title.trim() });
      showToast('success', 'Created successfully.');
      navigate('/list');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to create.';
      setApiError(message);
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {apiError}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

## API Client Pattern

### Adding New Endpoints

```typescript
// src/api/myresource.ts
import { api } from './client';
import type { MyResource, MyResourceFilters, PaginatedResponse } from '@/types';

function buildQueryString(params: MyResourceFilters): string {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.pageSize !== undefined) searchParams.append('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const myResourceApi = {
  list: (filters: MyResourceFilters = {}) => {
    const query = buildQueryString(filters);
    return api.get<PaginatedResponse<MyResource>>(`/myresources${query}`);
  },
  
  get: (id: string) =>
    api.get<MyResource>(`/myresources/${id}`),
  
  create: (data: MyResourceFormData) =>
    api.post<MyResource>('/myresources', data),
  
  update: (id: string, data: Partial<MyResourceFormData>) =>
    api.patch<MyResource>(`/myresources/${id}`, data),
};
```

## Routing Pattern

### Adding New Routes

```tsx
// In src/routes/router.tsx

// 1. Import the page
import { MyNewPage } from '@/pages/section/MyNewPage';

// 2. Add route with role protection
<Route
  path="section/mypage"
  element={
    <RoleRoute allowedRoles={['admin', 'employer']}>
      <MyNewPage />
    </RoleRoute>
  }
/>
```

### Navigation Item Pattern

```tsx
// In Sidebar.tsx or MobileNav.tsx
const navItems: NavItem[] = [
  {
    to: '/app/section/mypage',
    label: 'My Page',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M..." />
      </svg>
    ),
  },
];
```

## Type Definitions

### Adding New Types

```typescript
// src/types/index.ts

// 1. Define the status/enum types
export type MyResourceStatus = 'draft' | 'active' | 'archived';

// 2. Define the main interface
export interface MyResource {
  id: string;
  title: string;
  status: MyResourceStatus;
  createdAt: string;
  updatedAt: string;
}

// 3. Define form data (what we send to API)
export interface MyResourceFormData {
  title: string;
  status: MyResourceStatus;
}

// 4. Define filters
export interface MyResourceFilters extends PaginationParams {
  status?: MyResourceStatus;
  query?: string;
}
```

## Utility Functions

### Date Formatting (use date-fns)

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/format';

formatDate('2024-01-15T10:30:00Z');        // "Jan 15, 2024"
formatDateTime('2024-01-15T10:30:00Z');    // "Jan 15, 2024 10:30 AM"
formatRelativeTime('2024-01-15T10:30:00Z'); // "2 days ago"
```

### Status Formatting

```typescript
import { formatApplicationStatus, formatEmploymentType } from '@/utils/format';

formatApplicationStatus('interview');  // "Interview"
formatEmploymentType('full_time');     // "Full-time"
```

## Toast Notifications

Use the custom ToastContext (not sonner):

```tsx
import { useToastContext } from '@/contexts/ToastContext';

function MyComponent() {
  const { showToast } = useToastContext();
  
  const handleSuccess = () => {
    showToast('success', 'Operation completed.');
  };
  
  const handleError = () => {
    showToast('error', 'Something went wrong.');
  };
}
```

Toast types: `'success' | 'error' | 'info' | 'warning'`

## Accessibility Requirements

1. **Form labels**: Every input MUST have a label
2. **Button states**: Disabled buttons must use `disabled:opacity-50`
3. **Focus states**: Interactive elements have visible focus rings (built into shadcn)
4. **Semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3)
5. **Icon buttons**: Must have `aria-label` or visible text

## Quality Checklist

Before submitting frontend changes, verify:

- [ ] Loading states use Skeleton components (not spinners)
- [ ] Error states include retry button
- [ ] Empty states have helpful message
- [ ] Forms validate before submission
- [ ] Forms show field-level errors
- [ ] API errors are displayed to user
- [ ] Toast notifications for success/error
- [ ] Pagination works correctly
- [ ] Mobile layout tested (375px width)
- [ ] All colors use CSS variables (no hex/rgb)
- [ ] New routes protected with RoleRoute
- [ ] Types defined in src/types/index.ts
