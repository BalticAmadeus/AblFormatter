import { ASettings } from "../ASettings";

export class IfSettings extends ASettings {
    // if settings
    public ifFormatting() {
        return !!this.configurationManager.get("ifFormatting");
    }
}
