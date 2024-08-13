import { ASettings } from "../ASettings";

export class TokenSettings extends ASettings {
    // token settings
    public tokenFormatting() {
        return this.configurationManager.get("defineFormatting") ? true : false;
    }
}
