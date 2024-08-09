import { IConfigurationManager } from "../../utils/IConfigurationManager";

export class FormatterSettings {
    private readonly configurationManager: IConfigurationManager;

    public constructor(configurationManager: IConfigurationManager) {
        this.configurationManager = configurationManager;
    }

    //define settings
    public defineFormatting() {
        return this.configurationManager.get("defineFormatting") ? true : false;
    }

    //find settings
    public findFormatting() {
        return this.configurationManager.get("findFormatting") ? true : false;
    }

    //for settings
    public forFormatting() {
        return this.configurationManager.get("forFormatting") ? true : false;
    }

    //case settings
    public caseFormatting() {
        return this.configurationManager.get("caseFormatting") ? true : false;
    }

    //if settings
    public ifFormatting() {
        return this.configurationManager.get("ifFormatting") ? true : false;
    }

    //temp-table settings
    public temptableFormatting() {
        return this.configurationManager.get("temptableFormatting")
            ? true
            : false;
    }

    //logging settings
    public treeLogging() {
        return this.configurationManager.get("treeLogging") ? true : false;
    }
}
