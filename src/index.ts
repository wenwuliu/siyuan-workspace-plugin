import {
    Plugin,
    showMessage,
    Dialog,
    Menu,
    openTab,
    getFrontend,
    getAllEditor,
    openSetting,
    saveLayout
} from "siyuan";
import "./index.scss";

import WorkspacePanel from "@/workspace-panel.svelte";
import { WorkspaceManagerService } from "./libs/workspace-manager";

const STORAGE_NAME = "workspace-manager";
const DOCK_TYPE = "workspace_dock";

export default class WorkspacePlugin extends Plugin {
    private isMobile: boolean;
    private workspaceManager: WorkspaceManagerService;

    async onload() {
        console.log("loading workspace-plugin");

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 初始化工作区管理器
        this.workspaceManager = new WorkspaceManagerService(undefined, this.app);
        
        // 加载工作区数据
        try {
            console.log("=== 开始加载工作区数据 ===");
            console.log("STORAGE_NAME:", STORAGE_NAME);
            console.log("this.data 初始状态:", this.data);
            
            // 先尝试从 this.data 中获取数据
            let savedData = this.data[STORAGE_NAME];
            console.log("从 this.data 中获取的数据:", savedData);
            
            // 如果 this.data 中没有数据，尝试从持久化存储中加载
            if (!savedData) {
                console.log("this.data 中没有数据，尝试从持久化存储加载...");
                savedData = await this.loadData(STORAGE_NAME);
                console.log("从持久化存储加载的数据:", savedData);
                
                // 检查是否是字符串 "undefined" 或真正的 undefined
                if (savedData === "undefined" || savedData === undefined || savedData === null) {
                    console.log("检测到无效数据，设置为 null");
                    savedData = null;
                }
            }
            
            if (savedData) {
                console.log("找到保存的数据，开始验证数据结构...");
                console.log("savedData 类型:", typeof savedData);
                console.log("savedData 内容:", JSON.stringify(savedData, null, 2));
                
                // 验证数据结构
                if (savedData.workspaces && Array.isArray(savedData.workspaces)) {
                    console.log("数据结构验证通过，设置到工作区管理器");
                    this.workspaceManager.setData(savedData);
                    console.log("工作区数据已加载:", savedData);
                } else {
                    console.warn("加载的数据结构不正确，使用默认数据");
                    console.warn("savedData.workspaces:", savedData.workspaces);
                    console.warn("Array.isArray(savedData.workspaces):", Array.isArray(savedData.workspaces));
                    
                    // 如果数据结构不正确，使用默认数据
                    const defaultData = {
                        workspaces: [],
                        currentWorkspaceId: undefined
                    };
                    this.workspaceManager.setData(defaultData);
                    // 保存默认数据
                    await this.saveData(STORAGE_NAME, defaultData);
                    console.log("已保存默认数据");
                }
            } else {
                console.log("没有找到保存的工作区数据，使用默认数据");
                // 初始化默认数据
                const defaultData = {
                    workspaces: [],
                    currentWorkspaceId: undefined
                };
                this.workspaceManager.setData(defaultData);
                // 保存默认数据
                await this.saveData(STORAGE_NAME, defaultData);
                console.log("已初始化并保存默认数据");
            }
            console.log("=== 工作区数据加载完成 ===");
        } catch (error) {
            console.error("加载工作区数据失败:", error);
            // 出错时使用默认数据
            const defaultData = {
                workspaces: [],
                currentWorkspaceId: undefined
            };
            this.workspaceManager.setData(defaultData);
            console.log("出错时使用默认数据");
        }

        // 添加dock
        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 300, height: 0 },
                icon: "iconFolder",
                title: "工作区管理",
                hotkey: "⌥⌘W",
            },
            data: {
                workspaceManager: this.workspaceManager
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                const dockDiv = document.createElement("div");
                dockDiv.style.height = "100%";
                dockDiv.style.overflow = "auto";
                
                const workspacePanel = new WorkspacePanel({
                    target: dockDiv,
                    props: {
                        app: this.app,
                        workspaceManager: this.workspaceManager,
                        onDataChange: async () => {
                            try {
                                console.log("=== 开始保存工作区数据 ===");
                                const data = this.workspaceManager.getData();
                                console.log("要保存的数据:", JSON.stringify(data, null, 2));
                                
                                await this.saveData(STORAGE_NAME, data);
                                console.log("数据已保存到持久化存储");
                                console.log("=== 工作区数据保存完成 ===");
                            } catch (error) {
                                console.error("保存工作区数据失败:", error);
                            }
                        }
                    }
                });
                
                dock.element.appendChild(dockDiv);
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });

        // 添加命令
        this.addCommand({
            langKey: "showWorkspaceDialog",
            hotkey: "⇧⌘O",
            callback: () => {
                this.showWorkspaceDialog();
            },
        });

        this.addCommand({
            langKey: "createWorkspace",
            hotkey: "⇧⌘N",
            callback: () => {
                this.createWorkspace();
            },
        });

        this.addCommand({
            langKey: "switchWorkspace",
            hotkey: "⇧⌘W",
            callback: () => {
                this.switchWorkspace();
            },
        });

        // 添加自定义图标
        this.addIcons(`
<symbol id="iconWorkspace" viewBox="0 0 24 24">
<path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="currentColor"/>
<path d="M6 8h12v8H6V8zm2 2v4h8v-4H8z" fill="currentColor"/>
<circle cx="12" cy="12" r="1" fill="currentColor"/>
</symbol>
`);

        // 添加顶栏按钮
        this.addTopBar({
            icon: "iconWorkspace",
            title: "工作区管理器",
            position: "right",
            callback: (event: MouseEvent) => {
                this.showWorkspaceMenu(event);
            }
        });

        console.log("workspace plugin loaded");
    }

    onLayoutReady() {
        console.log("workspace plugin layout ready");
    }

    async onunload() {
        console.log("workspace plugin unloaded");
    }

    private showWorkspaceMenu(event: MouseEvent) {
        const workspaces = this.workspaceManager.getWorkspaces();
        const currentWorkspaceId = this.workspaceManager.getCurrentWorkspaceId();
        
        const menu = new Menu("workspaceMenu", () => {
            console.log("工作区菜单关闭");
        });

        // 添加工作区列表
        workspaces.forEach(workspace => {
            const isCurrent = workspace.id === currentWorkspaceId;
            menu.addItem({
                icon: isCurrent ? "iconCheck" : "iconFolder",
                label: `${workspace.name} (${workspace.tabs?.length || 0} 页签)`,
                current: isCurrent,
                click: async () => {
                    if (!isCurrent) {
                        try {
                            const success = await this.workspaceManager.switchToWorkspace(workspace.id);
                            if (success) {
                                // 保存数据
                                const data = this.workspaceManager.getData();
                                await this.saveData(STORAGE_NAME, data);
                                console.log("工作区切换成功:", workspace.name);
                            }
                        } catch (error) {
                            console.error("切换工作区失败:", error);
                        }
                    }
                }
            });
        });

        // 添加分隔符
        if (workspaces.length > 0) {
            menu.addItem({
                type: "separator"
            });
        }

        // 添加管理功能
        menu.addItem({
            icon: "iconAdd",
            label: "新建工作区",
            click: () => {
                this.createWorkspace();
            }
        });

        menu.addItem({
            icon: "iconSettings",
            label: "工作区设置",
            click: () => {
                this.showWorkspaceManagement();
            }
        });

        // 显示菜单
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        menu.open({
            x: rect.left,
            y: rect.bottom + 4
        });
    }

    private showWorkspaceManagement() {
        const dialog = new Dialog({
            title: "工作区管理",
            content: `<div id="workspace-management" style="height: 100%;"></div>`,
            width: this.isMobile ? "92vw" : "800px",
            destroyCallback: (options) => {
                console.log("工作区管理对话框关闭", options);
            }
        });

        const workspacePanel = new WorkspacePanel({
            target: dialog.element.querySelector("#workspace-management"),
            props: {
                app: this.app,
                workspaceManager: this.workspaceManager,
                onDataChange: async () => {
                    try {
                        const data = this.workspaceManager.getData();
                        await this.saveData(STORAGE_NAME, data);
                        console.log("工作区数据已保存:", data);
                    } catch (error) {
                        console.error("保存工作区数据失败:", error);
                    }
                }
            }
        });
    }

    private showWorkspaceDialog() {
        const dialog = new Dialog({
            title: "工作区管理",
            content: `<div id="workspace-dialog" style="height: 100%;"></div>`,
            width: this.isMobile ? "92vw" : "800px",
            destroyCallback: (options) => {
                console.log("workspace dialog destroyed", options);
            }
        });

        const workspacePanel = new WorkspacePanel({
            target: dialog.element.querySelector("#workspace-dialog"),
            props: {
                app: this.app,
                workspaceManager: this.workspaceManager,
                onDataChange: async () => {
                    try {
                        const data = this.workspaceManager.getData();
                        await this.saveData(STORAGE_NAME, data);
                        console.log("工作区数据已保存:", data);
                    } catch (error) {
                        console.error("保存工作区数据失败:", error);
                    }
                }
            }
        });
    }

    private async createWorkspace() {
        const dialog = new Dialog({
            title: "新建工作区",
            content: `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label for="workspace-name" style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--b3-theme-text);">工作区名称 *</label>
                        <input id="workspace-name" type="text" placeholder="请输入工作区名称" maxlength="50" 
                               style="width: 100%; max-width: 280px; padding: 10px 12px; border: 1px solid var(--b3-border-color); border-radius: 6px; font-size: 14px; background: var(--b3-theme-background); color: var(--b3-theme-text);">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label for="workspace-description" style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--b3-theme-text);">描述</label>
                        <textarea id="workspace-description" placeholder="请输入工作区描述（可选）" maxlength="200" rows="3"
                                  style="width: 100%; max-width: 280px; padding: 10px 12px; border: 1px solid var(--b3-border-color); border-radius: 6px; font-size: 14px; resize: vertical; background: var(--b3-theme-background); color: var(--b3-theme-text);"></textarea>
                    </div>
                </div>
            `,
            width: "360px",
            destroyCallback: (options) => {
                console.log("新建工作区对话框关闭", options);
            }
        });

        // 添加确认和取消按钮
        const confirmButton = dialog.element.querySelector('.b3-dialog__action--confirm') as HTMLButtonElement;
        const cancelButton = dialog.element.querySelector('.b3-dialog__action--cancel') as HTMLButtonElement;
        
        if (confirmButton) {
            confirmButton.textContent = "创建";
            confirmButton.onclick = async () => {
                const nameInput = dialog.element.querySelector('#workspace-name') as HTMLInputElement;
                const descriptionInput = dialog.element.querySelector('#workspace-description') as HTMLTextAreaElement;
                
                const name = nameInput?.value?.trim();
                const description = descriptionInput?.value?.trim();
                
                if (!name) {
                    showMessage("请输入工作区名称");
                    return;
                }
                
                try {
                    const workspace = await this.workspaceManager.createWorkspace({
                        name: name,
                        description: description
                    });
                    
                    // 保存数据
                    try {
                        console.log("=== 创建命令保存工作区数据 ===");
                        const data = this.workspaceManager.getData();
                        console.log("要保存的数据:", JSON.stringify(data, null, 2));
                        
                        await this.saveData(STORAGE_NAME, data);
                        console.log("数据已保存到持久化存储");
                        console.log("=== 创建命令数据保存完成 ===");
                    } catch (error) {
                        console.error("保存工作区数据失败:", error);
                    }
                    
                    showMessage(`工作区 "${workspace.name}" 已创建`);
                    dialog.destroy();
                } catch (error) {
                    showMessage('创建工作区失败: ' + error.message);
                }
            };
        }
        
        if (cancelButton) {
            cancelButton.textContent = "取消";
            cancelButton.onclick = () => {
                dialog.destroy();
            };
        }

        // 自动聚焦到名称输入框
        setTimeout(() => {
            const nameInput = dialog.element.querySelector('#workspace-name') as HTMLInputElement;
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    }

    private async switchWorkspace() {
        const workspaces = this.workspaceManager.getWorkspaces();
        if (workspaces.length === 0) {
            showMessage('暂无工作区，请先创建工作区');
            return;
        }

        if (workspaces.length === 1) {
            // 只有一个工作区，直接切换
            try {
                await this.workspaceManager.switchToWorkspace(workspaces[0].id);
                
                // 保存数据
                try {
                    console.log("=== 切换命令保存工作区数据 ===");
                    const data = this.workspaceManager.getData();
                    console.log("要保存的数据:", JSON.stringify(data, null, 2));
                    
                    await this.saveData(STORAGE_NAME, data);
                    console.log("数据已保存到持久化存储");
                    console.log("=== 切换命令数据保存完成 ===");
                } catch (error) {
                    console.error("保存工作区数据失败:", error);
                }
                
                showMessage(`已切换到工作区 "${workspaces[0].name}"`);
            } catch (error) {
                showMessage('切换工作区失败: ' + error.message);
            }
            return;
        }

        // 多个工作区，显示菜单选择
        const currentWorkspaceId = this.workspaceManager.getCurrentWorkspaceId();
        const menu = new Menu("switchWorkspaceMenu", () => {
            console.log("切换工作区菜单关闭");
        });

        workspaces.forEach(workspace => {
            const isCurrent = workspace.id === currentWorkspaceId;
            menu.addItem({
                icon: isCurrent ? "iconCheck" : "iconFolder",
                label: `${workspace.name} (${workspace.tabs?.length || 0} 页签)`,
                current: isCurrent,
                click: async () => {
                    if (!isCurrent) {
                        try {
                            await this.workspaceManager.switchToWorkspace(workspace.id);
                            
                            // 保存数据
                            try {
                                console.log("=== 切换命令保存工作区数据 ===");
                                const data = this.workspaceManager.getData();
                                console.log("要保存的数据:", JSON.stringify(data, null, 2));
                                
                                await this.saveData(STORAGE_NAME, data);
                                console.log("数据已保存到持久化存储");
                                console.log("=== 切换命令数据保存完成 ===");
                            } catch (error) {
                                console.error("保存工作区数据失败:", error);
                            }
                            
                            showMessage(`已切换到工作区 "${workspace.name}"`);
                        } catch (error) {
                            showMessage('切换工作区失败: ' + error.message);
                        }
                    }
                }
            });
        });

        // 显示菜单
        menu.open({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
    }
}
