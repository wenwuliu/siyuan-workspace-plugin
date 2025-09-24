/**
 * 工作区插件类型定义
 */

export interface TabState {
  id: string;
  type: 'doc' | 'search' | 'graph' | 'outline' | 'backlink' | 'file' | 'asset' | 'custom';
  data: any; // 根据类型存储不同的数据
  title: string;
  icon?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  tabs: TabState[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceManager {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  id: string;
  name?: string;
  description?: string;
}
