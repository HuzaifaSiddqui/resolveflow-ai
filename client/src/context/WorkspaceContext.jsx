import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [listRes, currentRes] = await Promise.all([
        api.get('/workspaces'),
        api.get('/workspaces/current').catch(() => ({ data: { workspace: null } })),
      ]);

      if (listRes.data.success) {
        setWorkspaces(listRes.data.workspaces);
      }
      if (currentRes.data.success && currentRes.data.workspace) {
        setCurrentWorkspace(currentRes.data.workspace);
        localStorage.setItem('rf_active_workspace', currentRes.data.workspace._id);
      } else if (listRes.data.workspaces?.length > 0) {
        setCurrentWorkspace(listRes.data.workspaces[0]);
        localStorage.setItem('rf_active_workspace', listRes.data.workspaces[0]._id);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const switchWorkspace = async (workspaceId) => {
    try {
      const { data } = await api.post(`/workspaces/switch/${workspaceId}`);
      if (data.success) {
        setCurrentWorkspace(data.workspace);
        localStorage.setItem('rf_active_workspace', data.workspace._id);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  };

  const createWorkspace = async (name) => {
    const { data } = await api.post('/workspaces', { name });
    if (data.success) {
      setWorkspaces((prev) => [...prev, data.workspace]);
      setCurrentWorkspace(data.workspace);
      localStorage.setItem('rf_active_workspace', data.workspace._id);
      return data.workspace;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        setCurrentWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
