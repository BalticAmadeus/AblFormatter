import { ASettings } from "../ASettings";

export class IfFunctionSettings extends ASettings {
    // if function settings
    public ifFunctionFormatting() {
        return !!this.configurationManager.get("ifFunctionFormatting");
    }
}
