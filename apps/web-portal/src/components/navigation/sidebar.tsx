'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import type { SystemRole } from '@gacp-erp/shared-schemas';
import {
  LayoutDashboard,
  Sprout,
  Layers,
  ShieldCheck,
  FileText,
  ClipboardList,
  AlertTriangle,
  FlaskConical,
  CalendarCheck,
  Landmark,
  BookOpen,
  DollarSign,
  Truck,
  ShoppingCart,
  Package,
  Users,
  ListTodo,
  Clock,
  GraduationCap,
  Award,
  Thermometer,
  BarChart3,
  TrendingUp,
  FileBarChart,
  Map,
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: SystemRole[];
}

interface NavGroup {
  title: string;
  icon: LucideIcon;
  roles?: SystemRole[];
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/*  Navigation definition                                              */
/* ------------------------------------------------------------------ */

const ALL_ROLES: SystemRole[] = [
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
  'OPERATOR',
  'AUDITOR',
  'READONLY',
];

const navGroups: NavGroup[] = [
  {
    title: 'Cultivation',
    icon: Sprout,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER', 'OPERATOR'],
    items: [
      { label: 'Facilities', href: '/facilities', icon: Building2 },
      { label: 'Plants', href: '/plants', icon: Sprout },
      { label: 'Batches', href: '/batches', icon: Layers },
    ],
  },
  {
    title: 'Quality',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'],
    items: [
      { label: 'Overview', href: '/quality', icon: ShieldCheck },
      { label: 'Change Controls', href: '/quality/change-controls', icon: FileText },
      { label: 'CAPAs', href: '/quality/capas', icon: ClipboardList },
      { label: 'Deviations', href: '/quality/deviations', icon: AlertTriangle },
      { label: 'Validation', href: '/quality/validation-protocols', icon: FlaskConical },
      { label: 'Quality Events', href: '/quality/quality-events', icon: CalendarCheck },
    ],
  },
  {
    title: 'Finance',
    icon: Landmark,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER'],
    items: [
      { label: 'Accounts', href: '/finance/accounts', icon: BookOpen },
      { label: 'Journal Entries', href: '/finance/journal-entries', icon: DollarSign },
      { label: 'Biological Assets', href: '/finance/biological-assets', icon: Sprout },
      { label: 'Payroll', href: '/finance/payroll', icon: Landmark },
    ],
  },
  {
    title: 'Procurement',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER'],
    items: [
      { label: 'Suppliers', href: '/procurement/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/procurement/purchase-orders', icon: ShoppingCart },
      { label: 'Receiving', href: '/procurement/receiving', icon: Package },
    ],
  },
  {
    title: 'Workforce',
    icon: Users,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER'],
    items: [
      { label: 'Employees', href: '/workforce/employees', icon: Users },
      { label: 'Tasks', href: '/workforce/tasks', icon: ListTodo },
      { label: 'Time Entries', href: '/workforce/time-entries', icon: Clock },
    ],
  },
  {
    title: 'Training',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER'],
    items: [
      { label: 'Courses', href: '/training/courses', icon: GraduationCap },
      { label: 'Executions', href: '/training/executions', icon: CalendarCheck },
      { label: 'Certifications', href: '/training/certifications', icon: Award },
    ],
  },
  {
    title: 'IoT & Environment',
    icon: Thermometer,
    roles: ALL_ROLES,
    items: [
      { label: 'Dashboard', href: '/iot', icon: Thermometer },
      { label: 'Alerts', href: '/iot/alerts', icon: AlertTriangle },
    ],
  },
  {
    title: 'Spatial',
    icon: Map,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER'],
    items: [
      { label: 'Zones', href: '/spatial', icon: Map },
      { label: '3D Facility', href: '/spatial/3d', icon: Box },
    ],
  },
  {
    title: 'Analytics & Reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'],
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Trends', href: '/analytics/trends', icon: TrendingUp },
      { label: 'Reports', href: '/reports', icon: FileBarChart },
      { label: 'Audit Trail', href: '/reports/audit-trail', icon: FileText },
    ],
  },
  {
    title: 'Compliance',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'],
    items: [
      { label: 'Dashboard', href: '/compliance', icon: ShieldCheck },
      { label: 'Training Status', href: '/compliance/training', icon: GraduationCap },
      { label: 'Reports', href: '/compliance/reports', icon: FileBarChart },
    ],
  },
  {
    title: 'Documents',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'],
    items: [
      { label: 'All Documents', href: '/documents', icon: FileText },
      { label: 'Upload', href: '/documents/upload', icon: FileText },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function NavGroupSection({
  group,
  collapsed,
}: {
  readonly group: NavGroup;
  readonly collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  );
  const [open, setOpen] = useState(isActive);

  if (collapsed) {
    // In collapsed mode show only the group icon, linking to the first item
    const firstHref = group.items[0]?.href ?? '/';
    return (
      <Link
        href={firstHref}
        title={group.title}
        className={`flex items-center justify-center rounded-lg p-2.5 transition-colors
          ${isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
      >
        <group.icon className="h-5 w-5 shrink-0" />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
          ${isActive ? 'text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        <group.icon className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 text-left">{group.title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l border-gray-200 pl-3">
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors
                  ${active ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main sidebar                                                        */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const { hasAnyRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleGroups = navGroups.filter((g) => !g.roles || hasAnyRole(g.roles));

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        {collapsed ? (
          <span className="mx-auto text-lg font-bold text-brand-600">G</span>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-600">GACP-ERP</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Dashboard link */}
        <div className="mb-3">
          <DashboardLink collapsed={collapsed} />
        </div>

        <div className="space-y-1">
          {visibleGroups.map((group) => (
            <NavGroupSection key={group.title} group={group} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}

function DashboardLink({ collapsed }: { readonly collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === '/';

  if (collapsed) {
    return (
      <Link
        href="/"
        title="Dashboard"
        className={`flex items-center justify-center rounded-lg p-2.5 transition-colors
          ${active ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
      Dashboard
    </Link>
  );
}
