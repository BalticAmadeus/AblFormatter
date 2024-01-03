import { WorkspaceConfiguration, window, workspace } from "vscode";

export class ConfigurationManager {
    private static reloadConfig = true;
    private static reloadExternalConfig = true;
    private static configuration: WorkspaceConfiguration;
    private static externalConfiguration: WorkspaceConfiguration;
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

        return ConfigurationManager.configuration.get(name);
    }

    public static getCasing(): any {
        if (ConfigurationManager.reloadExternalConfig) {
            ConfigurationManager.reloadExternalConfig = false;
            ConfigurationManager.externalConfiguration =
                workspace.getConfiguration("abl.completion");
        }

        return ConfigurationManager.externalConfiguration.get("upperCase");
    }
}
