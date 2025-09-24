<!--
  工作区管理面板 - 支持极简模式和完整管理模式
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { showMessage, confirm } from 'siyuan';
  import { WorkspaceManagerService } from './libs/workspace-manager';
  import { Workspace, CreateWorkspaceData } from '@/types/workspace.d';
  import WorkspaceDropdown from './workspace-dropdown.svelte';

  export let app: any;
  export let workspaceManager: WorkspaceManagerService;
  export let onDataChange: () => void;

  const dispatch = createEventDispatcher();

  let workspaces: Workspace[] = [];
  let currentWorkspace: Workspace | undefined;
  let showCreateDialog = false;
  let showDeleteDialog = false;
  let workspaceToDelete: Workspace | null = null;
  let createData: CreateWorkspaceData = { name: '', description: '' };
  let showFullManagement = true;
  let editingWorkspaceId: string | null = null;
  let editingName = '';

  onMount(() => {
    loadWorkspaces();
  });

  function loadWorkspaces() {
    try {
      if (workspaceManager) {
        workspaces = workspaceManager.getWorkspaces() || [];
        currentWorkspace = workspaceManager.getCurrentWorkspace();
      } else {
        console.warn('工作区管理器未初始化');
        workspaces = [];
        currentWorkspace = undefined;
      }
    } catch (error) {
      console.error('加载工作区失败:', error);
      workspaces = [];
      currentWorkspace = undefined;
    }
  }

  function openCreateDialog() {
    createData = { name: '', description: '' };
    showCreateDialog = true;
  }

  function closeCreateDialog() {
    showCreateDialog = false;
    createData = { name: '', description: '' };
  }

  async function createWorkspace() {
    if (!createData.name.trim()) {
      showMessage('请输入工作区名称');
      return;
    }

    try {
      const workspace = await workspaceManager.createWorkspace(createData);
      if (workspace) {
        loadWorkspaces();
        onDataChange();
        closeCreateDialog();
        showMessage(`工作区 "${workspace.name}" 创建成功`);
      }
    } catch (error) {
      console.error('创建工作区失败:', error);
      showMessage('创建工作区失败');
    }
  }

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === currentWorkspace?.id) return;

    try {
      const success = await workspaceManager.switchToWorkspace(workspaceId);
      if (success) {
        loadWorkspaces();
        onDataChange();
        showMessage(`已切换到工作区 "${workspaces.find(w => w.id === workspaceId)?.name}"`);
      }
    } catch (error) {
      console.error('切换工作区失败:', error);
      showMessage('切换工作区失败');
    }
  }

  function deleteWorkspace(workspace: Workspace) {
    workspaceToDelete = workspace;
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!workspaceToDelete) return;

    try {
      const success = workspaceManager.deleteWorkspace(workspaceToDelete.id);
      if (success) {
        loadWorkspaces();
        onDataChange();
        showDeleteDialog = false;
        workspaceToDelete = null;
        showMessage(`工作区 "${workspaceToDelete.name}" 已删除`);
      }
    } catch (error) {
      console.error('删除工作区失败:', error);
      showMessage('删除工作区失败');
    }
  }

  function saveCurrentWorkspace() {
    const success = workspaceManager.saveCurrentWorkspace();
    if (success) {
      onDataChange();
      showMessage('当前工作区已保存');
    }
  }

  function handleOpenSettings() {
    showFullManagement = true;
  }

  function handleDataChange(data: any) {
    loadWorkspaces();
    onDataChange();
  }


  function startEditWorkspace(workspace: Workspace) {
    editingWorkspaceId = workspace.id;
    editingName = workspace.name;
  }

  function cancelEdit() {
    editingWorkspaceId = null;
    editingName = '';
  }

  async function saveEdit() {
    if (!editingWorkspaceId || !editingName.trim()) {
      showMessage('请输入有效的工作区名称');
      return;
    }

    try {
      const success = workspaceManager.updateWorkspace({
        id: editingWorkspaceId,
        name: editingName.trim()
      });
      
      if (success) {
        loadWorkspaces();
        onDataChange();
        cancelEdit();
        showMessage('工作区名称已更新');
      }
    } catch (error) {
      console.error('更新工作区名称失败:', error);
      showMessage('更新工作区名称失败');
    }
  }

  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      saveEdit();
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  }
</script>

<div class="workspace-panel">
  {#if !showFullManagement}
    <!-- 极简下拉框模式 -->
    <div class="simple-mode">
      <WorkspaceDropdown 
        {app} 
        {workspaceManager} 
        onDataChange={handleDataChange}
        on:openSettings={handleOpenSettings}
      />
    </div>
  {:else}
    <!-- 完整管理模式 -->
    <div class="full-management-mode">
      <div class="header">
        <h3>工作区管理</h3>
      </div>

      <div class="workspace-list">
        {#each workspaces as workspace}
          <div class="workspace-item {workspace.id === currentWorkspace?.id ? 'active' : ''}">
            <div class="workspace-info">
              <div class="workspace-name">
                {#if editingWorkspaceId === workspace.id}
                  <input 
                    type="text" 
                    bind:value={editingName}
                    on:keydown={handleEditKeydown}
                    on:blur={saveEdit}
                    class="edit-input"
                    placeholder="工作区名称"
                    maxlength="50"
                    autofocus
                  />
                {:else}
                  <span class="name-text">{workspace.name}</span>
                  <button 
                    class="edit-button" 
                    on:click={() => startEditWorkspace(workspace)}
                    title="编辑名称"
                  >
                    ✏️
                  </button>
                {/if}
                {#if workspace.id === currentWorkspace?.id}
                  <span class="active-badge">当前</span>
                {/if}
              </div>
              {#if workspace.description}
                <div class="workspace-description">{workspace.description}</div>
              {/if}
              <div class="workspace-meta">
                页签数量: {workspace.tabs?.length || 0} | 
                创建时间: {new Date(workspace.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div class="workspace-actions">
              {#if editingWorkspaceId === workspace.id}
                <button class="save-edit-button" on:click={saveEdit}>保存</button>
                <button class="cancel-edit-button" on:click={cancelEdit}>取消</button>
              {:else}
                {#if workspace.id !== currentWorkspace?.id}
                  <button 
                    class="switch-button" 
                    on:click={() => switchWorkspace(workspace.id)}
                  >
                    切换
                  </button>
                {/if}
                <button 
                  class="delete-button" 
                  on:click={() => deleteWorkspace(workspace)}
                >
                  删除
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="actions">
        <button class="create-button" on:click={openCreateDialog}>
          + 新建工作区
        </button>
        <button class="save-button" on:click={saveCurrentWorkspace}>
          保存当前工作区
        </button>
      </div>
    </div>
  {/if}

  <!-- 创建对话框 -->
  {#if showCreateDialog}
    <div class="dialog-overlay" on:click={closeCreateDialog}>
      <div class="dialog" on:click|stopPropagation>
        <div class="dialog-header">
          <h3>新建工作区</h3>
          <button class="close-button" on:click={closeCreateDialog}>×</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label for="workspace-name">工作区名称 *</label>
            <input 
              id="workspace-name"
              type="text" 
              bind:value={createData.name}
              placeholder="请输入工作区名称"
              maxlength="50"
            />
          </div>
          <div class="form-group">
            <label for="workspace-description">描述</label>
            <textarea 
              id="workspace-description"
              bind:value={createData.description}
              placeholder="请输入工作区描述（可选）"
              maxlength="200"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-button" on:click={closeCreateDialog}>取消</button>
          <button class="confirm-button" on:click={createWorkspace}>创建</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 删除确认对话框 -->
  {#if showDeleteDialog && workspaceToDelete}
    <div class="dialog-overlay" on:click={() => showDeleteDialog = false}>
      <div class="dialog" on:click|stopPropagation>
        <div class="dialog-header">
          <h3>确认删除</h3>
        </div>
        <div class="dialog-content">
          <p>确定要删除工作区 "<strong>{workspaceToDelete.name}</strong>" 吗？</p>
          <p class="warning-text">此操作不可撤销，工作区中的所有页签状态将丢失。</p>
        </div>
        <div class="dialog-footer">
          <button class="cancel-button" on:click={() => showDeleteDialog = false}>取消</button>
          <button class="delete-button" on:click={confirmDelete}>删除</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .workspace-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .simple-mode {
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .full-management-mode {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .header h3 {
    margin: 0;
    color: var(--b3-theme-text);
    font-size: 18px;
    font-weight: 600;
  }

  .back-button {
    padding: 6px 12px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    color: var(--b3-theme-text);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: var(--b3-theme-hover);
    border-color: var(--b3-theme-primary);
  }

  .workspace-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .workspace-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .workspace-item:hover {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .workspace-item.active {
    border-color: var(--b3-theme-primary);
    background: var(--b3-theme-primary-light);
  }

  .workspace-info {
    flex: 1;
  }

  .workspace-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--b3-theme-text);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .name-text {
    flex: 1;
  }

  .edit-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 12px;
    opacity: 0.6;
    transition: all 0.2s ease;
  }

  .edit-button:hover {
    opacity: 1;
    background: var(--b3-theme-hover);
  }

  .edit-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-primary);
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    color: var(--b3-theme-text);
    background: var(--b3-theme-background);
    outline: none;
  }

  .edit-input:focus {
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px rgba(var(--b3-theme-primary-rgb), 0.2);
  }

  .active-badge {
    background: var(--b3-theme-primary);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .workspace-description {
    font-size: 14px;
    color: var(--b3-theme-text-light);
    margin-bottom: 4px;
  }

  .workspace-meta {
    font-size: 12px;
    color: var(--b3-theme-text-light);
  }

  .workspace-actions {
    display: flex;
    gap: 8px;
  }

  .switch-button, .delete-button, .create-button, .save-button, .save-edit-button, .cancel-edit-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .save-edit-button {
    background: var(--b3-theme-success);
    color: white;
  }

  .save-edit-button:hover {
    background: var(--b3-theme-success-dark);
  }

  .cancel-edit-button {
    background: var(--b3-theme-background);
    color: var(--b3-theme-text);
    border: 1px solid var(--b3-border-color);
  }

  .cancel-edit-button:hover {
    background: var(--b3-theme-hover);
  }

  .switch-button {
    background: var(--b3-theme-primary);
    color: white;
  }

  .switch-button:hover {
    background: var(--b3-theme-primary-dark);
  }

  .delete-button {
    background: var(--b3-theme-error);
    color: white;
  }

  .delete-button:hover {
    background: var(--b3-theme-error-dark);
  }

  .actions {
    display: flex;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--b3-border-color);
  }

  .create-button {
    background: var(--b3-theme-primary);
    color: white;
    padding: 10px 16px;
    font-weight: 500;
  }

  .create-button:hover {
    background: var(--b3-theme-primary-dark);
  }

  .save-button {
    background: var(--b3-theme-success);
    color: white;
    padding: 10px 16px;
  }

  .save-button:hover {
    background: var(--b3-theme-success-dark);
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--b3-theme-background);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    min-width: 400px;
    max-width: 500px;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--b3-border-color);
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--b3-theme-text);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--b3-theme-text-light);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    color: var(--b3-theme-text);
  }

  .dialog-content {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--b3-theme-text);
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    max-width: 280px;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color);
    border-radius: 4px;
    font-size: 14px;
    color: var(--b3-theme-text);
    background: var(--b3-theme-background);
    transition: border-color 0.2s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--b3-border-color);
  }

  .cancel-button, .confirm-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .cancel-button {
    background: var(--b3-theme-background);
    color: var(--b3-theme-text);
    border: 1px solid var(--b3-border-color);
  }

  .cancel-button:hover {
    background: var(--b3-theme-hover);
  }

  .confirm-button {
    background: var(--b3-theme-primary);
    color: white;
  }

  .confirm-button:hover {
    background: var(--b3-theme-primary-dark);
  }

  .warning-text {
    color: var(--b3-theme-warning);
    font-size: 14px;
    margin-top: 8px;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .dialog {
      min-width: 320px;
      margin: 16px;
    }
    
    .workspace-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .workspace-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>