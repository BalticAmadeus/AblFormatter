import { ConfigurationManager } from "../utils/ConfigurationManager";

export class FormatterSettings {
    public static tabSize = ConfigurationManager.get("tabSize");
    public static casing  = ConfigurationManager.getCasing();
    // assign settings
    public static assignFormatting     = ConfigurationManager.get("assignFormatting") ? true : false;
    public static newLineAfterAssign   = ConfigurationManager.get("assignFormattingAssignLocation") === "New" ? true : false;
    public static alignRightExpression = ConfigurationManager.get("assignFormattingAlignRightExpression") === "Yes" ? true : false;
    public static endDotLocationNew    = ConfigurationManager.get("assignFormattingEndDotLocation") === "New" ||
                                    ConfigurationManager.get("assignFormattingEndDotLocation") === "New aligned" ? true : false;
    public static endDotAlignment      = ConfigurationManager.get("assignFormattingEndDotLocation") === "New aligned" ? true : false;                                  
    //define settings
    public static defineFormatting = ConfigurationManager.get("defineFormatting") ? true : false;
    //find settings
    public static findFormatting = ConfigurationManager.get("findFormatting") ? true : false;
    //logging settings
    public static treeLogging = ConfigurationManager.get("treeLogging") ? true : false;
}
