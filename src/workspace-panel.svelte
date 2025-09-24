<!--
  工作区管理面板
-->
<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { showMessage, confirm } from 'siyuan';
    import { WorkspaceManagerService } from './libs/workspace-manager';
    import { Workspace, CreateWorkspaceData } from '@/types/workspace.d';

    export let app: any;
    export let workspaceManager: WorkspaceManagerService;
    export let onDataChange: () => void;

    const dispatch = createEventDispatcher();

    let workspaces: Workspace[] = [];
    let currentWorkspace: Workspace | undefined;
    let showCreateDialog = false;
    let createData: CreateWorkspaceData = { name: '', description: '' };

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
            const workspace = workspaceManager.createWorkspace(createData);
            loadWorkspaces();
            showMessage(`工作区 "${workspace.name}" 已创建`);
            closeCreateDialog();
            dispatch('workspace-created', workspace);
            // 通知主插件保存数据
            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            showMessage('创建工作区失败: ' + error.message);
        }
    }

    async function switchToWorkspace(workspace: Workspace) {
        try {
            await workspaceManager.switchToWorkspace(workspace.id);
            loadWorkspaces();
            showMessage(`已切换到工作区 "${workspace.name}"`);
            dispatch('workspace-switched', workspace);
            // 通知主插件保存数据
            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            showMessage('切换工作区失败: ' + error.message);
        }
    }

    function deleteWorkspace(workspace: Workspace) {
        confirm('确认删除', `确认删除工作区 "${workspace.name}" 吗？`, () => {
            try {
                workspaceManager.deleteWorkspace(workspace.id);
                loadWorkspaces();
                showMessage(`工作区 "${workspace.name}" 已删除`);
                dispatch('workspace-deleted', workspace);
                // 通知主插件保存数据
                if (onDataChange) {
                    onDataChange();
                }
            } catch (error) {
                showMessage('删除工作区失败: ' + error.message);
            }
        });
    }

    function saveCurrentWorkspace() {
        if (!currentWorkspace) {
            showMessage('没有当前工作区');
            return;
        }

        try {
            workspaceManager.saveCurrentWorkspace();
            loadWorkspaces();
            showMessage('当前工作区已保存');
            dispatch('workspace-saved', currentWorkspace);
            // 通知主插件保存数据
            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            showMessage('保存工作区失败: ' + error.message);
        }
    }
</script>

<div class="workspace-panel">
    <div class="workspace-header">
        <h3>工作区管理</h3>
        <div class="workspace-actions">
            <button class="b3-button b3-button--primary" on:click={openCreateDialog}>
                <svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>
                新建工作区
            </button>
        </div>
    </div>

    <div class="workspace-content">
        {#if currentWorkspace}
            <div class="current-workspace">
                <h4>当前工作区</h4>
                <div class="workspace-item current">
                    <div class="workspace-info">
                        <div class="workspace-name">{currentWorkspace.name}</div>
                        {#if currentWorkspace.description}
                            <div class="workspace-description">{currentWorkspace.description}</div>
                        {/if}
                        <div class="workspace-meta">
                            页签数: {currentWorkspace.tabs.length} | 
                            更新于: {new Date(currentWorkspace.updatedAt).toLocaleString()}
                        </div>
                    </div>
                    <div class="workspace-actions">
                        <button class="b3-button b3-button--text" on:click={saveCurrentWorkspace}>
                            保存
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <div class="workspace-list">
            <h4>所有工作区</h4>
            {#if workspaces.length === 0}
                <div class="empty-state">
                    <p>暂无工作区</p>
                    <button class="b3-button b3-button--primary" on:click={openCreateDialog}>
                        创建第一个工作区
                    </button>
                </div>
            {:else}
                {#each workspaces as workspace}
                    <div class="workspace-item" class:current={workspace.id === currentWorkspace?.id}>
                        <div class="workspace-info">
                            <div class="workspace-name">{workspace.name}</div>
                            {#if workspace.description}
                                <div class="workspace-description">{workspace.description}</div>
                            {/if}
                            <div class="workspace-meta">
                                页签数: {workspace.tabs.length} | 
                                创建于: {new Date(workspace.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div class="workspace-actions">
                            <button class="b3-button b3-button--text" on:click={() => switchToWorkspace(workspace)}>
                                切换
                            </button>
                            <button class="b3-button b3-button--text" on:click={() => deleteWorkspace(workspace)}>
                                删除
                            </button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>

<!-- 创建工作区对话框 -->
{#if showCreateDialog}
    <div class="b3-dialog__mask" on:click={closeCreateDialog}>
        <div class="b3-dialog workspace-create-dialog" on:click|stopPropagation>
            <div class="b3-dialog__header">
                <div class="b3-dialog__header-title">
                    <svg class="b3-dialog__header-icon"><use xlink:href="#iconAdd"></use></svg>
                    <h3>新建工作区</h3>
                </div>
                <button class="b3-button b3-button--text b3-button--small" on:click={closeCreateDialog}>
                    <svg class="b3-button__icon"><use xlink:href="#iconClose"></use></svg>
                </button>
            </div>
            <div class="b3-dialog__body">
                <div class="workspace-create-form">
                    <div class="b3-form__item">
                        <label class="b3-form__label" for="workspace-name">工作区名称 *</label>
                        <input 
                            id="workspace-name"
                            class="b3-text-field b3-text-field--full" 
                            type="text" 
                            bind:value={createData.name}
                            placeholder="请输入工作区名称"
                            maxlength="50"
                        />
                        <div class="b3-form__help">为工作区起一个有意义的名字</div>
                    </div>
                    <div class="b3-form__item">
                        <label class="b3-form__label" for="workspace-description">工作区描述</label>
                        <textarea 
                            id="workspace-description"
                            class="b3-text-field b3-text-field--full" 
                            bind:value={createData.description}
                            placeholder="描述这个工作区的用途（可选）"
                            rows="3"
                            maxlength="200"
                        ></textarea>
                        <div class="b3-form__help">可选，用于描述工作区的用途</div>
                    </div>
                    <div class="workspace-create-info">
                        <div class="workspace-create-info__icon">
                            <svg><use xlink:href="#iconInfo"></use></svg>
                        </div>
                        <div class="workspace-create-info__text">
                            <strong>提示：</strong>新建工作区将保存当前打开的所有页签状态，包括文档、搜索、图谱等。
                        </div>
                    </div>
                </div>
            </div>
            <div class="b3-dialog__footer">
                <button class="b3-button b3-button--text" on:click={closeCreateDialog}>取消</button>
                <button class="b3-button b3-button--primary" on:click={createWorkspace} disabled={!createData.name.trim()}>
                    <svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>
                    创建工作区
                </button>
            </div>
        </div>
    </div>
{/if}


<style>
    .workspace-panel {
        padding: 16px;
        height: 100%;
        overflow-y: auto;
    }

    .workspace-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .workspace-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .workspace-actions {
        display: flex;
        gap: 8px;
    }

    .workspace-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .current-workspace h4,
    .workspace-list h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
    }

    .workspace-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .workspace-item:hover {
        background-color: var(--b3-theme-surface-hover);
    }

    .workspace-item.current {
        border-color: var(--b3-theme-primary);
        background-color: var(--b3-theme-primary-light);
    }

    .workspace-info {
        flex: 1;
    }

    .workspace-name {
        font-weight: 600;
        margin-bottom: 4px;
    }

    .workspace-description {
        color: var(--b3-theme-on-surface-variant);
        font-size: 12px;
        margin-bottom: 4px;
    }

    .workspace-meta {
        color: var(--b3-theme-on-surface-variant);
        font-size: 11px;
    }

    .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--b3-theme-on-surface-variant);
    }

    .empty-state p {
        margin: 0 0 16px 0;
    }

    .b3-dialog__mask {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .b3-dialog {
        background-color: var(--b3-theme-surface);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 400px;
        max-width: 500px;
    }

    .b3-dialog__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .b3-dialog__header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .b3-dialog__body {
        padding: 16px;
    }

    .b3-dialog__footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid var(--b3-border-color);
    }

    .b3-form__item {
        margin-bottom: 16px;
    }

    .b3-form__label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
    }

    .b3-text-field {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--b3-border-color);
        border-radius: 4px;
        background-color: var(--b3-theme-surface);
        color: var(--b3-theme-on-surface);
    }

    .b3-text-field:focus {
        outline: none;
        border-color: var(--b3-theme-primary);
    }

    /* 新建工作区对话框样式 */
    .workspace-create-dialog {
        max-width: 500px;
        width: 90vw;
    }

    .b3-dialog__header-title {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .b3-dialog__header-icon {
        width: 20px;
        height: 20px;
        color: var(--b3-theme-primary);
    }

    .workspace-create-form {
        padding: 8px 0;
    }

    .b3-form__help {
        font-size: 12px;
        color: var(--b3-theme-on-surface-variant);
        margin-top: 4px;
        line-height: 1.4;
    }

    .b3-text-field--full {
        width: 100%;
        box-sizing: border-box;
    }

    .workspace-create-info {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background-color: var(--b3-theme-surface-variant);
        border-radius: 6px;
        margin-top: 16px;
    }

    .workspace-create-info__icon {
        flex-shrink: 0;
        margin-top: 2px;
    }

    .workspace-create-info__icon svg {
        width: 16px;
        height: 16px;
        color: var(--b3-theme-primary);
    }

    .workspace-create-info__text {
        flex: 1;
        font-size: 13px;
        line-height: 1.5;
        color: var(--b3-theme-on-surface);
    }

    .workspace-create-info__text strong {
        color: var(--b3-theme-primary);
    }

    .b3-button--small {
        padding: 4px 8px;
        font-size: 12px;
    }

    .b3-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
