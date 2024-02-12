import { ConfigurationManager } from "../utils/ConfigurationManager";

export class FormatterSettings {
    public static tabSize() {
        return ConfigurationManager.get("tabSize");
    }

    public static casing() {
        return ConfigurationManager.getCasing();
    }  

    // assign settings
    public static assignFormatting() {
        return ConfigurationManager.get("assignFormatting") ? true : false;
    }

    public static newLineAfterAssign() {
        return ConfigurationManager.get("assignFormattingAssignLocation") === "New" ? true : false;
    }

    public static alignRightExpression() {
        return ConfigurationManager.get("assignFormattingAlignRightExpression") === "Yes" ? true : false;
    }

    public static endDotLocationNew() {
        return ConfigurationManager.get("assignFormattingEndDotLocation") === "New" ||
               ConfigurationManager.get("assignFormattingEndDotLocation") === "New aligned" ? true : false;
    }

    public static endDotAlignment() {
        return ConfigurationManager.get("assignFormattingEndDotLocation") === "New aligned" ? true : false;
    }

    //define settings
    public static defineFormatting() {
        return ConfigurationManager.get("defineFormatting") ? true : false;
    }

    //find settings
    public static findFormatting() {
        return ConfigurationManager.get("findFormatting") ? true : false;
    }

    //for settings
    public static forFormatting() {
        return ConfigurationManager.get("forFormatting") ? true : false;
    }

    //case settings
    public static caseFormatting() {
        return ConfigurationManager.get("caseFormatting") ? true : false;
    }

    //block settings
    public static blockFormatting() {
        return ConfigurationManager.get("blockFormatting") ? true : false;
    }

    //temp-table settings
    public static temptableFormatting() {
        return ConfigurationManager.get("temptableFormatting") ? true : false;
    }

    //logging settings
    public static treeLogging() {
        return ConfigurationManager.get("treeLogging") ? true : false;
    }
}
