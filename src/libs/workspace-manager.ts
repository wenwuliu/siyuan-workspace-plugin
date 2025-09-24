/**
 * 工作区管理服务
 */
import { Workspace, TabState, WorkspaceManager, CreateWorkspaceData, UpdateWorkspaceData } from '@/types/workspace.d';
import { getAllEditor, openTab } from 'siyuan';

export class WorkspaceManagerService {
  private data: WorkspaceManager;
  private storageKey = 'workspace-manager';
  private app: any;

  constructor(initialData?: WorkspaceManager, app?: any) {
    this.data = initialData || {
      workspaces: [],
      currentWorkspaceId: undefined
    };
    this.app = app;
  }

  /**
   * 获取所有工作区
   */
  getWorkspaces(): Workspace[] {
    return this.data.workspaces;
  }

  /**
   * 获取当前工作区
   */
  getCurrentWorkspace(): Workspace | undefined {
    if (!this.data.currentWorkspaceId) return undefined;
    return this.data.workspaces.find(w => w.id === this.data.currentWorkspaceId);
  }

  /**
   * 创建新工作区
   */
  createWorkspace(data: CreateWorkspaceData): Workspace {
    const workspace: Workspace = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      tabs: this.getCurrentTabs(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.data.workspaces.push(workspace);
    this.data.currentWorkspaceId = workspace.id;
    return workspace;
  }

  /**
   * 更新工作区
   */
  updateWorkspace(data: UpdateWorkspaceData): Workspace | undefined {
    const workspace = this.data.workspaces.find(w => w.id === data.id);
    if (!workspace) return undefined;

    if (data.name !== undefined) workspace.name = data.name;
    if (data.description !== undefined) workspace.description = data.description;
    workspace.updatedAt = Date.now();

    return workspace;
  }

  /**
   * 删除工作区
   */
  deleteWorkspace(id: string): boolean {
    const index = this.data.workspaces.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.data.workspaces.splice(index, 1);
    
    // 如果删除的是当前工作区，清除当前工作区ID
    if (this.data.currentWorkspaceId === id) {
      this.data.currentWorkspaceId = undefined;
    }

    return true;
  }

  /**
   * 切换到指定工作区
   */
  async switchToWorkspace(id: string): Promise<boolean> {
    const workspace = this.data.workspaces.find(w => w.id === id);
    if (!workspace) return false;

    // 保存当前工作区的页签状态
    if (this.data.currentWorkspaceId) {
      const currentWorkspace = this.data.workspaces.find(w => w.id === this.data.currentWorkspaceId);
      if (currentWorkspace) {
        currentWorkspace.tabs = this.getCurrentTabs();
        currentWorkspace.updatedAt = Date.now();
      }
    }

    // 切换到新工作区
    this.data.currentWorkspaceId = id;
    
    // 恢复工作区的页签状态
    await this.restoreTabs(workspace.tabs);
    
    return true;
  }

  /**
   * 保存当前工作区
   */
  saveCurrentWorkspace(): boolean {
    if (!this.data.currentWorkspaceId) return false;

    const workspace = this.data.workspaces.find(w => w.id === this.data.currentWorkspaceId);
    if (!workspace) return false;

    workspace.tabs = this.getCurrentTabs();
    workspace.updatedAt = Date.now();
    
    return true;
  }

  /**
   * 获取当前打开的页签状态
   */
  private getCurrentTabs(): TabState[] {
    const tabs: TabState[] = [];
    
    // 获取所有编辑器
    const editors = getAllEditor();
    
    // 这里需要根据思源笔记的API来获取当前打开的页签
    // 由于思源笔记的页签管理比较复杂，这里先返回一个空数组
    // 后续需要根据实际的API来实现
    
    return tabs;
  }

  /**
   * 恢复页签状态
   */
  private async restoreTabs(tabs: TabState[]): Promise<void> {
    // 关闭所有当前页签
    // 这里需要调用思源笔记的API来关闭当前页签
    
    // 打开保存的页签
    for (const tab of tabs) {
      try {
        await this.openTab(tab);
      } catch (error) {
        console.error('Failed to restore tab:', tab, error);
      }
    }
  }

  /**
   * 打开页签
   */
  private async openTab(tab: TabState): Promise<void> {
    switch (tab.type) {
      case 'doc':
        await openTab({
          app: this.getApp(),
          doc: { id: tab.data.id }
        });
        break;
      case 'search':
        await openTab({
          app: this.getApp(),
          search: { k: tab.data.keyword }
        });
        break;
      case 'graph':
        await openTab({
          app: this.getApp(),
          graph: tab.data
        });
        break;
      case 'outline':
        await openTab({
          app: this.getApp(),
          outline: tab.data
        });
        break;
      case 'backlink':
        await openTab({
          app: this.getApp(),
          backlink: tab.data
        });
        break;
      case 'file':
        await openTab({
          app: this.getApp(),
          file: tab.data
        });
        break;
      case 'asset':
        await openTab({
          app: this.getApp(),
          asset: tab.data
        });
        break;
      case 'custom':
        await openTab({
          app: this.getApp(),
          custom: tab.data
        });
        break;
    }
  }

  /**
   * 获取应用实例
   */
  private getApp(): any {
    return this.app;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 获取数据
   */
  getData(): WorkspaceManager {
    return this.data;
  }

  /**
   * 设置数据
   */
  setData(data: WorkspaceManager): void {
    this.data = data;
  }
}
