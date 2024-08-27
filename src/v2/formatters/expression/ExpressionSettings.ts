import { ASettings } from "../ASettings";

export class ExpressionSettings extends ASettings {
    // expression settings
    public expressionSettings() {
        return !!this.configurationManager.get("expressionFormatting");
    }
}
