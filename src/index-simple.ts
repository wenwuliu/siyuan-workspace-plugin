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
        if (this.data[STORAGE_NAME]) {
            this.workspaceManager.setData(this.data[STORAGE_NAME]);
        } else {
            this.data[STORAGE_NAME] = this.workspaceManager.getData();
        }

        // 添加dock
        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 300, height: 0 },
                icon: "iconSaving",
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
                        workspaceManager: this.workspaceManager
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

        // 添加顶栏按钮
        this.addTopBar({
            icon: "iconSaving",
            title: "工作区管理器",
            position: "right",
            callback: () => {
                this.showWorkspaceDialog();
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
                workspaceManager: this.workspaceManager
            }
        });
    }

    private createWorkspace() {
        const name = prompt("请输入工作区名称:");
        if (!name || !name.trim()) return;

        const description = prompt("请输入工作区描述（可选）:");
        
        try {
            const workspace = this.workspaceManager.createWorkspace({
                name: name.trim(),
                description: description?.trim()
            });
            
            // 保存数据
            this.data[STORAGE_NAME] = this.workspaceManager.getData();
            this.saveData(STORAGE_NAME);
            
            showMessage(`工作区 "${workspace.name}" 已创建`);
        } catch (error) {
            showMessage('创建工作区失败: ' + error.message);
        }
    }

    private async switchWorkspace() {
        const workspaces = this.workspaceManager.getWorkspaces();
        if (workspaces.length === 0) {
            showMessage('暂无工作区，请先创建工作区');
            return;
        }

        const workspaceNames = workspaces.map(w => w.name);
        const selectedIndex = workspaceNames.length > 1 
            ? workspaceNames.indexOf(prompt("请选择要切换的工作区:\n" + workspaceNames.map((name, i) => `${i + 1}. ${name}`).join('\n')) || '')
            : 0;

        if (selectedIndex >= 0 && selectedIndex < workspaces.length) {
            try {
                await this.workspaceManager.switchToWorkspace(workspaces[selectedIndex].id);
                
                // 保存数据
                this.data[STORAGE_NAME] = this.workspaceManager.getData();
                this.saveData(STORAGE_NAME);
                
                showMessage(`已切换到工作区 "${workspaces[selectedIndex].name}"`);
            } catch (error) {
                showMessage('切换工作区失败: ' + error.message);
            }
        }
    }
}
