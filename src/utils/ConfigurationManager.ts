import { WorkspaceConfiguration, window, workspace, commands } from "vscode";

export class ConfigurationManager {
    private static reloadConfig = true;
    private static reloadExternalConfig = true;
    private static configuration: WorkspaceConfiguration;
    private static externalConfiguration: WorkspaceConfiguration;
    private static overridingSettings: any | undefined;

    public static _ = workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("AblFormatter")) {
            ConfigurationManager.reloadConfig = true;
            window.showInformationMessage("ABL Formatter was changed!");
        }

        if (e.affectsConfiguration("abl.completion")) {
            ConfigurationManager.reloadExternalConfig = true;
            window.showInformationMessage("ABL cassing was changed!");
        }
    });

    public static get(name: string): any {
        if (ConfigurationManager.reloadConfig) {
            ConfigurationManager.reloadConfig = false;
            ConfigurationManager.configuration =
                workspace.getConfiguration("AblFormatter");
        }

        return this.getConfig(name);
    }

    public static getCasing(): any {
        if (ConfigurationManager.reloadExternalConfig) {
            ConfigurationManager.externalConfiguration =
                workspace.getConfiguration("abl.completion");
        }
        ConfigurationManager.externalConfiguration =
            workspace.getConfiguration("abl.completion");
        window.showInformationMessage(
            `Config Value ${ConfigurationManager.externalConfiguration.get(
                "upperCase"
            )}`
        );
        return ConfigurationManager.externalConfiguration.get("upperCase");
    }

    public static setOverridingSettings(settings: any) {
        this.overridingSettings = settings;
    }

    private static getCassingConfig(): any {
        window.showInformationMessage(
            `Config Value 0 ${ConfigurationManager.externalConfiguration.get(
                "upperCase"
            )}
            SPACE
            ${this.get("upperCase")} SPACE
            ${this.externalConfiguration.get("upperCase")}`
        );

        let config =
            ConfigurationManager.externalConfiguration.get("upperCase");

        window.showInformationMessage(`Config Value ${config}`);

        if (config === undefined || (config !== true && config !== false)) {
            window
                .showErrorMessage(
                    "abl.completion.upperCase setting not set or set incorrectly. Update settings file. Current value - " +
                        config,
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

    private static getConfig(name: string): any {
        const config = ConfigurationManager.configuration.get(name);
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
