import { commands, window, workspace, WorkspaceConfiguration } from "vscode";
import { IConfigurationManager } from "./IConfigurationManager";

export class ConfigurationManager2 implements IConfigurationManager {
    private static instance: ConfigurationManager2;
    private reloadConfig = true;
    private reloadExternalConfig = true;
    private configuration: WorkspaceConfiguration | undefined = undefined;
    private externalConfiguration: WorkspaceConfiguration | undefined =
        undefined;
    private overridingSettings: any | undefined;
    private tabSize: number | undefined; // Add this line to store tabSize

    private constructor() {
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("AblFormatter")) {
                this.reloadConfig = true;
                window.showInformationMessage("ABL Formatter was changed2!");
            }

            if (e.affectsConfiguration("abl.completion")) {
                this.reloadExternalConfig = true;
                window.showInformationMessage("ABL cassing was changed2!");
            }
        });
    }

    public static getInstance(): ConfigurationManager2 {
        if (!ConfigurationManager2.instance) {
            ConfigurationManager2.instance = new ConfigurationManager2();
        }
        return ConfigurationManager2.instance;
    }

    public get(name: string) {
        if (this.reloadConfig) {
            this.reloadConfig = false;
            this.configuration = workspace.getConfiguration("AblFormatter");
        }
        return this.getConfig(name);
    }

    public setTabSize(tabSize: number): void {
        this.tabSize = tabSize;
    }

    public getTabSize(): number {
        return this.tabSize || 4; // Default to 4 if not set
    }

    public getCasing() {
        if (this.reloadExternalConfig) {
            this.reloadExternalConfig = false;
            this.externalConfiguration =
                workspace.getConfiguration("abl.completion");
        }
        return this.getCassingConfig();
    }

    public setOverridingSettings(settings: any): void {
        this.overridingSettings = settings;
    }

    private getCassingConfig(): any {
        const config = this.externalConfiguration?.get("upperCase");

        if (config === undefined || (config !== true && config !== false)) {
            window
                .showErrorMessage(
                    `abl.completion.upperCase setting not set or set incorrectly. Update settings file. Current value - ${config}. Expected values - true or false `,
                    "Settings"
                )
                .then((selection) => {
                    switch (selection) {
                        case "Settings":
                            commands.executeCommand(
                                "workbench.action.openWorkspaceSettingsFile"
                            );
                            return;
                        default:
                            return;
                    }
                });
        }

        if (this.overridingSettings !== undefined) {
            const overridingConfig =
                this.overridingSettings["abl.completion.upperCase"];

            if (overridingConfig !== undefined) {
                window.showInformationMessage("Found overriding settings!");
                return overridingConfig;
            }
        }
        return config;
    }

    private getConfig(name: string): any {
        const config = this.configuration?.get(name);

        if (this.overridingSettings !== undefined) {
            const overridingConfig =
                this.overridingSettings["AblFormatter." + name];

            if (overridingConfig !== undefined) {
                window.showInformationMessage("Found overriding settings!");
                return overridingConfig;
            }
        }
        return config;
    }
}
