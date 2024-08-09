import { IConfigurationManager } from "../../utils/IConfigurationManager";

export abstract class ASettings {
    public constructor(
        protected readonly configurationManager: IConfigurationManager
    ) {}

    public tabSize() {
        return this.configurationManager.get("tabSize");
    }

    public casing() {
        return this.configurationManager.getCasing();
    }
}
