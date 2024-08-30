import { ASettings } from "../ASettings";

export class EmptyBlockSettings extends ASettings {
    //empty block settings
    public emptyBlockFormatting() {
        return !!this.configurationManager.get("emptyBlockFormatting");
    }
}
