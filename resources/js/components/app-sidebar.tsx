import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Shield, Settings, Users, Info, HandHeart, Newspaper, History } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

export function AppSidebar() {


const {auth} = usePage().props;
const userRole = auth?.user?.role || 'guest';
const isGuest = !auth?.user;

const guestNavItems: NavItem[] = [
    {
    title: 'Adoption',
    href: '/adoption',
    icon: HandHeart,
    },
];

const mainNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/profile',
        icon: Users,
    },
    {
        title: 'Adoption',
        href: '/adoption',
        icon: HandHeart,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Manage Users',
        href: '/manage_users',
        icon: Settings,
    },
    {
        title: 'Manage Post',
        href: '/manage_posts',
        icon: Newspaper,
    },
    {
        title: 'Transaction History',
        href: '/transaction_history',
        icon: History,
    },
];

const superAdminNavItems: NavItem[] = [

];

    let roleBasedNavItems = [...mainNavItems];

    if(isGuest) {
        roleBasedNavItems = guestNavItems;
    }
    if(userRole === 'admin') {
        roleBasedNavItems = [...roleBasedNavItems, ...adminNavItems];
    }
    if(userRole === 'superadmin') {
        roleBasedNavItems = [...roleBasedNavItems, ...adminNavItems, ...superAdminNavItems];
    }

const footerNavItems: NavItem[] = [
    {
        title: 'About Us',
        href: '/about',
        icon: Info,
    },
];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isGuest ? '/adoption' : '/profile'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={roleBasedNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
