'use client';

import AdminHeader from '@/components/layout/AdminHeader';
import './Admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminHeader>{children}</AdminHeader>;
}

