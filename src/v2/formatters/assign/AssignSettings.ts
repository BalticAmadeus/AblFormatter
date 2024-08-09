import { ASettings } from "../ASettings";

export class AssignSettings extends ASettings {
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
}
