import { IConfigurationManager } from "../../utils/IConfigurationManager";

export class FormatterSettings {
    private readonly configurationManager: IConfigurationManager;

    public constructor(configurationManager: IConfigurationManager) {
        this.configurationManager = configurationManager;
    }

    public tabSize() {
        return this.configurationManager.get("tabSize");
    }

    public casing() {
        return this.configurationManager.getCasing();
    }

    // assign settings
    public assignFormatting() {
        return this.configurationManager.get("assignFormatting") ? true : false;
    }

    public newLineAfterAssign() {
        return this.configurationManager.get(
            "assignFormattingAssignLocation"
        ) === "New"
            ? true
            : false;
    }

    public alignRightExpression() {
        return this.configurationManager.get(
            "assignFormattingAlignRightExpression"
        ) === "Yes"
            ? true
            : false;
    }

    public endDotLocationNew() {
        return this.configurationManager.get(
            "assignFormattingEndDotLocation"
        ) === "New" ||
            this.configurationManager.get("assignFormattingEndDotLocation") ===
                "New aligned"
            ? true
            : false;
    }

    public endDotAlignment() {
        return this.configurationManager.get(
            "assignFormattingEndDotLocation"
        ) === "New aligned"
            ? true
            : false;
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

    //block settings
    public blockFormatting() {
        return this.configurationManager.get("blockFormatting") ? true : false;
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
