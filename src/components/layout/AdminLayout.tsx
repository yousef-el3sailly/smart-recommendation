import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Package, Users, ArrowLeft, ShoppingCart } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useTranslation();

  const adminItems = [
    { title: t('admin.dashboard'), url: '/admin', icon: LayoutDashboard },
    { title: t('admin.products'), url: '/admin/products', icon: Package },
    { title: t('admin.orders'), url: '/admin/orders', icon: ShoppingCart },
    { title: t('admin.users'), url: '/admin/users', icon: Users },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('admin.panel')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="me-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="hover:bg-muted/50">
                    <ArrowLeft className="me-2 h-4 w-4" />
                    {!collapsed && <span>{t('admin.backToStore')}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return <div className="flex items-center justify-center min-h-screen">{t('admin.loading')}</div>;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">{t('admin.accessDenied')}</h1>
        <p className="text-muted-foreground">{t('admin.accessDeniedDesc')}</p>
        <Link to="/" className="text-primary hover:underline">{t('admin.goHome')}</Link>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 gap-2">
            <SidebarTrigger className="me-2" />
            <h1 className="font-semibold flex-1">{t('nav.adminDashboard')}</h1>
            <LanguageSwitcher />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
