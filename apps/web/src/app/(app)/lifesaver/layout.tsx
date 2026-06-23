'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Flag, CheckSquare, Sparkles,
  Crosshair, AlertTriangle, ChevronDown, Cpu, Calendar, Bot,
  Menu, X, Bell, Settings, User, PanelLeftClose, PanelLeft, ArrowLeft, Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { agentHubService } from '@/features/lifesaver/services/AgentHubService';

export default function MomentumAILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiCenterExpanded, setAiCenterExpanded] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count on mount and poll
  useEffect(() => {
    let active = true;
    const fetchUnreadCount = async () => {
      try {
        const notifs = await agentHubService.getNotifications();
        if (active) {
          const unread = notifs.filter(n => n.status === 'unread').length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to load notifications count', err);
      }
    };
    void fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null;

  // Sidebar navigation structure definition
  const workspaceItems = [
    { name: 'Dashboard', href: '/lifesaver', icon: LayoutDashboard },
  ];

  const productivityItems = [
    { name: 'Goals', href: '/lifesaver/goals', icon: Flag },
    { name: 'Tasks', href: '/lifesaver/tasks', icon: CheckSquare },
  ];

  const aiCenterItems = [
    { name: 'AI Planner', href: '/lifesaver/planner', icon: Sparkles },
    { name: 'Focus AI', href: '/lifesaver/focus', icon: Crosshair },
    { name: 'Risk Center', href: '/lifesaver/risk', icon: AlertTriangle },
    { name: 'Execution Agent', href: '/lifesaver/execution', icon: Cpu },
    { name: 'Smart Scheduling', href: '/lifesaver/scheduling', icon: Calendar },
    { name: 'Agent Hub', href: '/lifesaver/agent', icon: Bot },
  ];

  const systemItems = [
    { name: 'Settings', href: '/lifesaver/settings', icon: Settings },
    { name: 'Profile', href: '/lifesaver/profile', icon: User },
  ];

  const renderNavGroup = (
    title: string,
    items: typeof workspaceItems,
    isCollapsible = false,
    isExpanded = true,
    onToggle?: () => void
  ) => {
    return (
      <div className="space-y-0.5">
        {/* Section Header */}
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between px-3 py-1 select-none">
            <span className="text-[12.5px] font-medium text-slate-800">
              {title}
            </span>
            {isCollapsible && onToggle && (
              <button
                onClick={onToggle}
                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-sm hover:bg-slate-200/50 cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
            )}
          </div>
        )}

        {/* Section Items */}
        {isExpanded && (
          <nav className="space-y-0.5">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-bold tracking-tight transition-all duration-150 border ${
                    isActive
                      ? 'bg-white text-slate-955 border-slate-200/60'
                      : 'text-slate-655 hover:text-slate-955 hover:bg-[#f4f3f0]/60 border-transparent'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f9f9f8]">
      {/* Sidebar Header: "Back to chat" + Iconic Collapse Button */}
      <div className={`px-4 py-4 flex items-center justify-between border-b border-slate-200 bg-[#f9f9f8] ${sidebarCollapsed ? 'flex-col gap-3.5 justify-center' : ''}`}>
        <Link href="/chat" className="flex items-center gap-1.5 text-slate-650 hover:text-slate-955 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          {!sidebarCollapsed && <span className="text-[11px] font-bold">Back to chat</span>}
        </Link>
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-500 hover:text-slate-955 p-1 rounded-[6px] hover:bg-[#f4f3f0]/80 transition-colors cursor-pointer shrink-0"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Groups - Compacted margins to fit cleanly without scrolling */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3.5 scrollbar-thin">
        {renderNavGroup('Workspace', workspaceItems)}
        {renderNavGroup('Productivity', productivityItems)}
        {renderNavGroup(
          'AI Center',
          aiCenterItems,
          true,
          aiCenterExpanded || sidebarCollapsed, // Expanded when collapsed to show icons
          () => setAiCenterExpanded(!aiCenterExpanded)
        )}
      </div>

      {/* System Settings & Profile */}
      <div className="p-3 border-t border-slate-200 bg-[#f9f9f8]">
        {renderNavGroup('System', systemItems)}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800">
      
      {/* 1. Permanent Responsive Left Sidebar (Desktop/Tablet) */}
      <aside className={`hidden md:flex flex-col border-r border-slate-200 bg-[#f9f9f8] select-none h-full shrink-0 transition-all duration-300 z-20 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}>
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />
          {/* Sidebar Drawer Panel */}
          <div className="relative flex flex-col w-56 max-w-xs bg-[#f9f9f8] border-r border-slate-200 z-50 animate-slide-in-left h-full">
            {/* Close button in Drawer */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-[6px] hover:bg-slate-200/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. Main Page Layout (Header + Scrollable Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#fcfbf9]">
        
        {/* Module Header - Simplified to show only Title, Bell, and Avatar */}
        <header className="h-14 px-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between z-10">
          
          {/* Left: Mobile menu toggle + Slogan */}
          <div className="flex items-center gap-3">
            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-[6px] text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Momentum AI logo and slogan - kept at top main header */}
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[7px] bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </span>
              <div>
                <h1 className="text-[13px] font-bold text-slate-955 tracking-tight leading-none">
                  Momentum AI
                </h1>
                <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">Never Miss What Matters</p>
              </div>
            </div>
          </div>

          {/* Right: Notification Bell + Profile Avatar */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              href="/lifesaver/agent"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-[6px] text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Agent Hub Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Avatar */}
            <Link
              href="/lifesaver/profile"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-slate-900 text-white text-[10px] font-bold tracking-wide border border-slate-300 shrink-0 hover:ring-2 hover:ring-slate-400 hover:ring-offset-1 transition-all cursor-pointer select-none"
              title="Momentum AI Profile"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span>{initials}</span>
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 w-full overflow-y-auto relative">
          {children}
        </main>
      </div>

    </div>
  );
}

export const dynamic = 'force-dynamic';
