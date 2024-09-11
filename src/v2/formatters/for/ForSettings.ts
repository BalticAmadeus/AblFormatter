import { ASettings } from "../ASettings";

export class ForSettings extends ASettings {
    // token settings
    public forFormatting() {
        return this.configurationManager.get("forFormatting") ? true : false;
    }
}