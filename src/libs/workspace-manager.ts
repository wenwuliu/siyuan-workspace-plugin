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
    
    // 确保数据结构正确
    if (!this.data.workspaces) {
      this.data.workspaces = [];
    }
    if (this.data.currentWorkspaceId === undefined) {
      this.data.currentWorkspaceId = undefined;
    }
  }

  /**
   * 获取所有工作区
   */
  getWorkspaces(): Workspace[] {
    return this.data.workspaces || [];
  }

  /**
   * 获取当前工作区
   */
  getCurrentWorkspace(): Workspace | undefined {
    if (!this.data.currentWorkspaceId || !this.data.workspaces) return undefined;
    return this.data.workspaces.find(w => w.id === this.data.currentWorkspaceId);
  }

  /**
   * 获取当前工作区ID
   */
  getCurrentWorkspaceId(): string | undefined {
    return this.data.currentWorkspaceId;
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    // 确保 workspaces 数组存在
    if (!this.data.workspaces) {
      this.data.workspaces = [];
    }

    // 使用布局API关闭所有页签
    await this.closeAllTabsWithLayoutAPI();

    const workspace: Workspace = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      tabs: [], // 新建工作区时页签为空
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
    if (!this.data.workspaces) return false;
    
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
    if (!this.data.workspaces) return false;

    const workspace = this.data.workspaces.find(w => w.id === id);
    if (!workspace) return false;

    // 1. 先保存当前工作区的页签状态
    if (this.data.currentWorkspaceId) {
      const currentWorkspace = this.data.workspaces.find(w => w.id === this.data.currentWorkspaceId);
      if (currentWorkspace) {
        const currentTabs = this.getCurrentTabs();
        currentWorkspace.tabs = currentTabs;
        currentWorkspace.updatedAt = Date.now();
      }
    }

    // 2. 使用布局API关闭所有页签
    await this.closeAllTabsWithLayoutAPI();

    // 3. 切换到新工作区
    this.data.currentWorkspaceId = id;

    // 4. 恢复工作区的页签状态
    await this.restoreTabs(workspace.tabs);

    return true;
  }

  /**
   * 保存当前工作区
   */
  saveCurrentWorkspace(): boolean {
    if (!this.data.currentWorkspaceId || !this.data.workspaces) return false;

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

    try {
      // 使用思源笔记的API获取页签信息
      if (this.app && this.app.plugins && this.app.plugins.plugins) {
        // 通过插件API获取页签信息
        const openedTabs = this.app.plugins.plugins.getOpenedTab();
        
        // 遍历所有页签类型
        Object.keys(openedTabs).forEach(tabType => {
          const tabList = openedTabs[tabType];
          if (Array.isArray(tabList)) {
            tabList.forEach((tab: any) => {
              const tabState: TabState = {
                id: tab.id || this.generateId(),
                type: this.getTabTypeFromString(tabType),
                data: this.getTabDataFromTab(tab),
                title: tab.title || tab.name || '未命名页签',
                icon: tab.icon
              };
              tabs.push(tabState);
            });
          }
        });
      }
      
      // 如果插件API不可用，尝试使用getAllEditor
      if (tabs.length === 0) {
        try {
          const editors = getAllEditor();
          
          if (editors && Array.isArray(editors)) {
            editors.forEach((editor: any, index: number) => {
              // 尝试从编辑器的各种属性中获取块ID
              let blockId = editor.blockId || editor.id || editor.root?.id;
              
              // 如果还是没有找到，尝试从编辑器的其他属性中获取
              if (!blockId && editor.protyle) {
                blockId = editor.protyle.block?.id || editor.protyle.blockId;
              }
              
              // 如果仍然没有找到，尝试从编辑器的DOM元素中获取
              if (!blockId && editor.element) {
                const blockElement = editor.element.querySelector('[data-node-id]');
                if (blockElement) {
                  blockId = blockElement.getAttribute('data-node-id');
                }
              }
              
              const tabState: TabState = {
                id: editor.id || `editor_${index}`,
                type: 'doc',
                data: { blockId: blockId },
                title: editor.title || `文档 ${index + 1}`,
                icon: 'iconFile'
              };
              tabs.push(tabState);
            });
          }
        } catch (error) {
          console.error('通过getAllEditor获取页签失败:', error);
        }
      }
    } catch (error) {
      console.error('获取页签失败:', error);
    }

    return tabs;
  }

  /**
   * 根据页签类型字符串确定页签类型
   */
  private getTabTypeFromString(tabType: string): TabState['type'] {
    switch (tabType) {
      case 'doc':
      case 'document':
        return 'doc';
      case 'search':
        return 'search';
      case 'graph':
        return 'graph';
      case 'outline':
        return 'outline';
      case 'backlink':
        return 'backlink';
      case 'file':
        return 'file';
      case 'asset':
        return 'asset';
      default:
        return 'custom';
    }
  }

  /**
   * 根据页签布局信息确定页签类型
   */
  private getTabType(layout: any): TabState['type'] {
    // 根据页签的URL或其他属性判断类型
    if (layout.url) {
      if (layout.url.startsWith('siyuan://blocks/')) {
        return 'doc';
      } else if (layout.url.includes('search')) {
        return 'search';
      } else if (layout.url.includes('graph')) {
        return 'graph';
      } else if (layout.url.includes('outline')) {
        return 'outline';
      } else if (layout.url.includes('backlink')) {
        return 'backlink';
      } else if (layout.url.includes('file')) {
        return 'file';
      } else if (layout.url.includes('asset')) {
        return 'asset';
      }
    }
    return 'custom';
  }

  /**
   * 从页签对象提取数据
   */
  private getTabDataFromTab(tab: any): any {
    if (tab.blockId) {
      return { blockId: tab.blockId };
    } else if (tab.id) {
      return { blockId: tab.id };
    } else if (tab.url) {
      return { url: tab.url };
    } else if (tab.data) {
      return tab.data;
    }
    return {};
  }

  /**
   * 根据页签类型提取相关数据
   */
  private getTabData(layout: any): any {
    if (layout.url) {
      if (layout.url.startsWith('siyuan://blocks/')) {
        // 文档页签，提取块ID
        const blockId = layout.url.replace('siyuan://blocks/', '');
        return { blockId };
      } else {
        // 其他类型页签，保存URL
        return { url: layout.url };
      }
    }
    return {};
  }

  /**
   * 恢复页签状态
   */
  private async restoreTabs(tabs: TabState[]): Promise<void> {
    try {
      // 关闭所有当前页签
      await this.closeAllTabs();
      
      // 打开保存的页签
      for (const tab of tabs) {
        try {
          await this.openTab(tab);
        } catch (error) {
          console.error(`恢复页签失败 (类型: ${tab.type}, 数据: ${JSON.stringify(tab.data)}):`, error);
        }
      }
    } catch (error) {
      console.error('恢复页签状态失败:', error);
    }
  }


  /**
   * 使用思源笔记布局API关闭所有页签
   */
  private async closeAllTabsWithLayoutAPI(): Promise<void> {
    try {
      
      // 检查思源笔记布局对象是否可用
      if (typeof window !== 'undefined' && window.siyuan && window.siyuan.layout && window.siyuan.layout.centerLayout) {
        // 获取所有页签ID（根据实际结构分析）
        const getAllTabIds = (layout: any): string[] => {
          let ids: string[] = [];
          
          // 检查是否有 children 数组
          if (layout.children && Array.isArray(layout.children)) {
            layout.children.forEach((child: any) => {
              // 如果子元素有 children 数组，说明是页签容器
              if (child.children && Array.isArray(child.children)) {
                child.children.forEach((tab: any) => {
                  if (tab.id && tab.title) {
                    ids.push(tab.id);
                  }
                });
              }
              // 递归检查更深层的嵌套
              ids.push(...getAllTabIds(child));
            });
          }
          
          return ids;
        };

        const tabIds = getAllTabIds(window.siyuan.layout.centerLayout);

        if (tabIds.length > 0) {
          // 找到包含 removeTabAction 的容器对象
          let tabContainer = null;
          const findTabContainer = (layout: any) => {
            if (layout.children && Array.isArray(layout.children)) {
              layout.children.forEach((child: any) => {
                if (child.removeTabAction) {
                  tabContainer = child;
                }
                findTabContainer(child);
              });
            }
          };
          findTabContainer(window.siyuan.layout.centerLayout);

          if (tabContainer && tabContainer.removeTabAction) {
            // 倒序关闭（避免删除前面的ID导致后面的ID失效）
            for (let i = tabIds.length - 1; i >= 0; i--) {
              await new Promise(resolve => {
                setTimeout(() => {
                  try {
                    tabContainer.removeTabAction(tabIds[i]);
                  } catch (error) {
                    console.error(`关闭页签失败:`, tabIds[i], error);
                  }
                  resolve(undefined);
                }, 50); // 间隔50ms，确保UI同步
              });
            }
          }
        }
      }
      
    } catch (error) {
      console.error('关闭页签失败:', error);
    }
  }


  /**
   * 关闭所有页签（已弃用，使用 closeAllTabsWithLayoutAPI 替代）
   */
  private async closeAllTabs(): Promise<void> {
    // 直接调用布局API方法
    await this.closeAllTabsWithLayoutAPI();
  }

  /**
   * 从布局对象获取所有页签
   */
  private getAllTabsFromLayout(): any[] {
    const tabs: any[] = [];
    
    if (typeof window !== 'undefined' && window.siyuan && window.siyuan.layout && window.siyuan.layout.centerLayout) {
      const traverseLayout = (layout: any) => {
        // 检查是否有 children 数组
        if (layout.children && Array.isArray(layout.children)) {
          layout.children.forEach((child: any) => {
            // 如果子元素有 children 数组，说明是页签容器
            if (child.children && Array.isArray(child.children)) {
              child.children.forEach((tab: any) => {
                if (tab.id && tab.title) {
                  tabs.push({
                    id: tab.id,
                    title: tab.title,
                    active: tab.active || false
                  });
                }
              });
            }
            // 递归检查更深层的嵌套
            traverseLayout(child);
          });
        }
      };
      traverseLayout(window.siyuan.layout.centerLayout);
    }
    
    return tabs;
  }

  /**
   * 打开页签
   */
  private async openTab(tab: TabState): Promise<void> {
    try {
      if (tab.type === 'doc' && tab.data.blockId) {
        // 打开文档页签
        // 方法1: 尝试使用思源笔记的openTab API
        try {
          await openTab({
            app: this.getApp(),
            doc: { id: tab.data.blockId }
          });
          return;
        } catch (error) {
          console.error('通过openTab API打开失败:', error);
        }
        
        // 方法2: 尝试使用window.openFileByUrl
        if (typeof window !== 'undefined' && window.openFileByUrl) {
          const url = `siyuan://blocks/${tab.data.blockId}`;
          window.openFileByUrl(url);
        }
        
        // 方法3: 尝试使用思源笔记的全局方法
        if (typeof window !== 'undefined' && window.siyuan && window.siyuan.openFileByUrl) {
          const url = `siyuan://blocks/${tab.data.blockId}`;
          window.siyuan.openFileByUrl(url);
        }
        
      } else if (tab.data.url) {
        // 打开其他类型页签
        // 方法1: 尝试使用window.openFileByUrl
        if (typeof window !== 'undefined' && window.openFileByUrl) {
          window.openFileByUrl(tab.data.url);
        }
        
        // 方法2: 尝试使用思源笔记的全局方法
        if (typeof window !== 'undefined' && window.siyuan && window.siyuan.openFileByUrl) {
          window.siyuan.openFileByUrl(tab.data.url);
        }
        
      } else {
        console.warn('无法打开页签，缺少必要数据:', tab);
      }
    } catch (error) {
      console.error('打开页签失败:', error);
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
    
    // 确保数据结构正确
    if (!this.data.workspaces) {
      this.data.workspaces = [];
    }
    if (this.data.currentWorkspaceId === undefined) {
      this.data.currentWorkspaceId = undefined;
    }
    
    console.log("工作区数据已设置:", this.data);
  }
}
