import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceSetup from './pages/WorkspaceSetup';
import Dashboard from './pages/Dashboard';
import SupportInbox from './pages/SupportInbox';
import KnowledgeBase from './pages/KnowledgeBase';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Workflows from './pages/Workflows';
import AgentConfig from './pages/AgentConfig';
import TestingPlayground from './pages/TestingPlayground';
import Analytics from './pages/Analytics';
import ConversationMonitoring from './pages/ConversationMonitoring';
import WorkspaceSettings from './pages/WorkspaceSettings';
import WidgetDemo from './pages/WidgetDemo';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Loading ResolveFlow AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/workspace-setup" element={<WorkspaceSetup />} />
            <Route path="/widget-demo" element={<WidgetDemo />} />

            {/* Protected SaaS Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout title="Dashboard Overview" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inbox" element={<SupportInbox />} />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route path="customers" element={<Customers />} />
              <Route path="orders" element={<Orders />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="agent-config" element={<AgentConfig />} />
              <Route path="testing" element={<TestingPlayground />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="monitoring" element={<ConversationMonitoring />} />
              <Route path="settings" element={<WorkspaceSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
