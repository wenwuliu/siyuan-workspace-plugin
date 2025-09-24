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
        const name = prompt("请输入工作区名称:");
        if (!name || !name.trim()) return;

        const description = prompt("请输入工作区描述（可选）:");
        
        try {
            const workspace = this.workspaceManager.createWorkspace({
                name: name.trim(),
                description: description?.trim()
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
                
                showMessage(`已切换到工作区 "${workspaces[selectedIndex].name}"`);
            } catch (error) {
                showMessage('切换工作区失败: ' + error.message);
            }
        }
    }
}
