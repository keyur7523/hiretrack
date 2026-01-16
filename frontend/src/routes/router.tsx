import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Public pages
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';

// Applicant pages
import { JobsListPage } from '@/pages/applicant/JobsListPage';
import { JobDetailPage } from '@/pages/applicant/JobDetailPage';
import { ApplicationsListPage } from '@/pages/applicant/ApplicationsListPage';
import { ApplicationDetailPage } from '@/pages/applicant/ApplicationDetailPage';

// Employer pages
import { EmployerJobsListPage } from '@/pages/employer/EmployerJobsListPage';
import { JobCreatePage } from '@/pages/employer/JobCreatePage';
import { JobEditPage } from '@/pages/employer/JobEditPage';
import { JobApplicationsListPage } from '@/pages/employer/JobApplicationsListPage';
import { EmployerApplicationDetailPage } from '@/pages/employer/EmployerApplicationDetailPage';

// Admin pages
import { AdminHealthPage } from '@/pages/admin/AdminHealthPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';

// Common pages
import { AccountPage } from '@/pages/common/AccountPage';
import { UnauthorizedPage } from '@/pages/common/UnauthorizedPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';

// Role-based home redirect
import { AppHome } from '@/pages/AppHome';

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Role-based home redirect */}
        <Route index element={<AppHome />} />

        {/* Applicant routes */}
        <Route
          path="jobs"
          element={
            <RoleRoute allowedRoles={['applicant']}>
              <JobsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="jobs/:jobId"
          element={
            <RoleRoute allowedRoles={['applicant']}>
              <JobDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="applications"
          element={
            <RoleRoute allowedRoles={['applicant']}>
              <ApplicationsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="applications/:applicationId"
          element={
            <RoleRoute allowedRoles={['applicant']}>
              <ApplicationDetailPage />
            </RoleRoute>
          }
        />

        {/* Employer routes */}
        <Route
          path="employer/jobs"
          element={
            <RoleRoute allowedRoles={['employer']}>
              <EmployerJobsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="employer/jobs/new"
          element={
            <RoleRoute allowedRoles={['employer']}>
              <JobCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="employer/jobs/:jobId/edit"
          element={
            <RoleRoute allowedRoles={['employer']}>
              <JobEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="employer/jobs/:jobId/applications"
          element={
            <RoleRoute allowedRoles={['employer']}>
              <JobApplicationsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="employer/applications/:applicationId"
          element={
            <RoleRoute allowedRoles={['employer']}>
              <EmployerApplicationDetailPage />
            </RoleRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="admin/health"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminHealthPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminAuditLogsPage />
            </RoleRoute>
          }
        />

        {/* Common routes */}
        <Route path="account" element={<AccountPage />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Redirect root to login or app */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
