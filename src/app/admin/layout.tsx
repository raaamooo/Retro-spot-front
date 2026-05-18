'use client';

import AdminHeader from '@/components/layout/AdminHeader';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import './Admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AdminHeader>{children}</AdminHeader>
      </NotificationProvider>
    </AuthProvider>
  );
}
