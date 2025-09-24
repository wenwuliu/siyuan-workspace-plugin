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

    const dispatch = createEventDispatcher();

    let workspaces: Workspace[] = [];
    let currentWorkspace: Workspace | undefined;
    let showCreateDialog = false;
    let showSwitchDialog = false;
    let createData: CreateWorkspaceData = { name: '', description: '' };

    onMount(() => {
        loadWorkspaces();
    });

    function loadWorkspaces() {
        workspaces = workspaceManager.getWorkspaces();
        currentWorkspace = workspaceManager.getCurrentWorkspace();
    }

    function openCreateDialog() {
        createData = { name: '', description: '' };
        showCreateDialog = true;
    }

    function openSwitchDialog() {
        showSwitchDialog = true;
    }

    function closeCreateDialog() {
        showCreateDialog = false;
    }

    function closeSwitchDialog() {
        showSwitchDialog = false;
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
        } catch (error) {
            showMessage('创建工作区失败: ' + error.message);
        }
    }

    async function switchToWorkspace(workspace: Workspace) {
        try {
            await workspaceManager.switchToWorkspace(workspace.id);
            loadWorkspaces();
            showMessage(`已切换到工作区 "${workspace.name}"`);
            closeSwitchDialog();
            dispatch('workspace-switched', workspace);
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
        } catch (error) {
            showMessage('保存工作区失败: ' + error.message);
        }
    }
</script>

<div class="workspace-panel">
    <div class="workspace-header">
        <h3>工作区管理</h3>
        <div class="workspace-actions">
            <button class="b3-button b3-button--text" on:click={openCreateDialog}>
                <svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>
                新建工作区
            </button>
            <button class="b3-button b3-button--text" on:click={openSwitchDialog}>
                <svg class="b3-button__icon"><use xlink:href="#iconSwitch"></use></svg>
                切换工作区
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
        <div class="b3-dialog" on:click|stopPropagation>
            <div class="b3-dialog__header">
                <h3>新建工作区</h3>
                <button class="b3-button b3-button--text" on:click={closeCreateDialog}>
                    <svg class="b3-button__icon"><use xlink:href="#iconClose"></use></svg>
                </button>
            </div>
            <div class="b3-dialog__body">
                <div class="b3-form__item">
                    <label class="b3-form__label">工作区名称</label>
                    <input 
                        class="b3-text-field" 
                        type="text" 
                        bind:value={createData.name}
                        placeholder="请输入工作区名称"
                    />
                </div>
                <div class="b3-form__item">
                    <label class="b3-form__label">工作区描述</label>
                    <textarea 
                        class="b3-text-field" 
                        bind:value={createData.description}
                        placeholder="请输入工作区描述（可选）"
                        rows="3"
                    ></textarea>
                </div>
            </div>
            <div class="b3-dialog__footer">
                <button class="b3-button" on:click={closeCreateDialog}>取消</button>
                <button class="b3-button b3-button--primary" on:click={createWorkspace}>创建</button>
            </div>
        </div>
    </div>
{/if}

<!-- 切换工作区对话框 -->
{#if showSwitchDialog}
    <div class="b3-dialog__mask" on:click={closeSwitchDialog}>
        <div class="b3-dialog" on:click|stopPropagation>
            <div class="b3-dialog__header">
                <h3>切换工作区</h3>
                <button class="b3-button b3-button--text" on:click={closeSwitchDialog}>
                    <svg class="b3-button__icon"><use xlink:href="#iconClose"></use></svg>
                </button>
            </div>
            <div class="b3-dialog__body">
                {#if workspaces.length === 0}
                    <div class="empty-state">
                        <p>暂无工作区</p>
                        <button class="b3-button b3-button--primary" on:click={openCreateDialog}>
                            创建第一个工作区
                        </button>
                    </div>
                {:else}
                    <div class="workspace-list">
                        {#each workspaces as workspace}
                            <div class="workspace-item" on:click={() => switchToWorkspace(workspace)}>
                                <div class="workspace-info">
                                    <div class="workspace-name">{workspace.name}</div>
                                    {#if workspace.description}
                                        <div class="workspace-description">{workspace.description}</div>
                                    {/if}
                                    <div class="workspace-meta">
                                        页签数: {workspace.tabs.length}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
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
</style>
