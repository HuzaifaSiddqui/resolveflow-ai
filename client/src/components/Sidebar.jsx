import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  Users,
  ShoppingBag,
  Zap,
  Bot,
  FlaskConical,
  BarChart3,
  Activity,
  Settings,
  MessageSquare,
  LogOut,
  ChevronDown,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Support Inbox', path: '/inbox', icon: Inbox },
    { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Workflows', path: '/workflows', icon: Zap },
    { name: 'Agent Config', path: '/agent-config', icon: Bot },
    { name: 'Testing Playground', path: '/testing', icon: FlaskConical },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight tracking-tight">ResolveFlow</div>
            <div className="text-[11px] text-indigo-400 font-medium">AI Support SaaS</div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="mt-4 px-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Workspace</label>
          <div className="relative mt-1">
            <select
              value={currentWorkspace?._id || ''}
              onChange={(e) => switchWorkspace(e.target.value)}
              className="w-full bg-slate-800/90 text-white text-xs rounded-lg px-2.5 py-2 pr-7 border border-slate-700/80 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws._id} value={ws._id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-2">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Public Channel</div>
          <NavLink
            to="/widget-demo"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Customer Chat Widget</span>
          </NavLink>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-500/30">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
