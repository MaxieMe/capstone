// resources/js/layouts/app-layout.tsx
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import FlashToast from '@/components1/flash-toast';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
      {children}

      {/* Global flash/toast */}
      <FlashToast />
    </AppLayoutTemplate>
  );
}
