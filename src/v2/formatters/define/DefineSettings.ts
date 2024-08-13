import { ASettings } from "../ASettings";

export class DefineSettings extends ASettings {
    // token settings
    public defineFormatting() {
        return this.configurationManager.get("defineFormatting") ? true : false;
    }
}
