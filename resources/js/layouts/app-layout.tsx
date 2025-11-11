import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import FlashToast from '@/components1/flash-toast'; // 🔥 import toast
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}

        {/* 🔥 Global flash/toast (success/error) */}
        <FlashToast />
    </AppLayoutTemplate>
);
