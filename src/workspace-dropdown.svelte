<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { WorkspaceManagerService } from "./libs/workspace-manager";
  import { Workspace } from "@/types/workspace.d";

  export let app: any;
  export let workspaceManager: WorkspaceManagerService;
  export let onDataChange: (data: any) => void;

  const dispatch = createEventDispatcher();

  let workspaces: Workspace[] = [];
  let currentWorkspaceId: string = '';

  onMount(() => {
    loadWorkspaces();
  });

  function loadWorkspaces() {
    workspaces = workspaceManager.getWorkspaces();
    currentWorkspaceId = workspaceManager.getCurrentWorkspaceId();
  }

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === currentWorkspaceId) {
      return;
    }

    try {
      const success = await workspaceManager.switchToWorkspace(workspaceId);
      if (success) {
        currentWorkspaceId = workspaceId;
        onDataChange(workspaceManager.getData());
      }
    } catch (error) {
      console.error('切换工作区失败:', error);
    }
  }

  function openSettings() {
    dispatch('openSettings');
  }
</script>

<div class="workspace-tabs">
  <div class="workspace-tabs-container">
    {#each workspaces as workspace}
      <button
        class="workspace-tab {workspace.id === currentWorkspaceId ? 'active' : ''}"
        on:click={() => switchWorkspace(workspace.id)}
        on:keydown={(e) => e.key === 'Enter' && switchWorkspace(workspace.id)}
        role="tab"
        tabindex="0"
        title={workspace.description || workspace.name}
      >
        <div class="workspace-tab-content">
          <div class="workspace-header">
            <span class="workspace-icon">📁</span>
            <span class="workspace-name">{workspace.name}</span>
            {#if workspace.id === currentWorkspaceId}
              <span class="active-indicator">●</span>
            {/if}
          </div>
          <div class="workspace-info">
            <span class="tab-count">{workspace.tabs?.length || 0} 页签</span>
            <span class="workspace-time">{new Date(workspace.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </button>
    {/each}
    
    <button 
      class="settings-tab"
      on:click={openSettings}
      on:keydown={(e) => e.key === 'Enter' && openSettings()}
      role="button"
      tabindex="0"
      title="工作区设置"
    >
      <span class="settings-icon">⚙️</span>
      <span class="settings-text">设置</span>
    </button>
  </div>
</div>

<style>
  .workspace-tabs {
    width: 100%;
    padding: 8px;
  }

  .workspace-tabs-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: flex-start;
    align-items: stretch;
  }

  .workspace-tab {
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: var(--b3-theme-text);
    min-width: 180px;
    max-width: 220px;
    min-height: 60px;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .workspace-tab:hover {
    background: var(--b3-theme-hover);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .workspace-tab:focus {
    outline: 2px solid var(--b3-theme-primary);
    outline-offset: 2px;
  }

  .workspace-tab.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .workspace-tab.active:hover {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
  }

  .workspace-tab-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .workspace-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  .workspace-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .workspace-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .active-indicator {
    font-size: 8px;
    margin-left: 4px;
    flex-shrink: 0;
  }

  .workspace-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--b3-theme-text-light);
    margin-top: 2px;
  }

  .tab-count {
    font-weight: 500;
    color: var(--b3-theme-primary);
  }

  .workspace-time {
    font-size: 10px;
    opacity: 0.8;
  }

  .settings-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: var(--b3-theme-text);
    white-space: nowrap;
    min-height: 60px;
    margin-left: auto;
    align-self: flex-start;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
  }

  .settings-tab:hover {
    background: var(--b3-theme-hover);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .settings-tab:focus {
    outline: 2px solid var(--b3-theme-primary);
    outline-offset: 2px;
  }

  .settings-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .settings-text {
    flex-shrink: 0;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .workspace-tabs-container {
      gap: 6px;
    }
    
    .workspace-tab {
      padding: 10px 12px;
      font-size: 12px;
      min-height: 50px;
      min-width: 150px;
      max-width: 180px;
    }
    
    .workspace-info {
      font-size: 10px;
    }
    
    .settings-tab {
      padding: 10px 12px;
      font-size: 12px;
      min-height: 50px;
    }
  }

  @media (max-width: 480px) {
    .workspace-tabs {
      padding: 6px;
    }
    
    .workspace-tabs-container {
      justify-content: center;
      gap: 4px;
    }
    
    .workspace-tab {
      min-width: 120px;
      max-width: 150px;
      min-height: 45px;
      padding: 8px 10px;
    }
    
    .workspace-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    
    .settings-tab {
      min-height: 45px;
      padding: 8px 10px;
    }
  }
</style>
