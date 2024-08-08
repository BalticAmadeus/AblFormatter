import { IConfigurationManager } from "../../utils/IConfigurationManager";
import { IFormatter } from "./IFormatter";
import { formatterRegistry } from "./formatterDecorator";
import { FormatterSettings } from "../model/FormatterSettings";

export class FormatterFactory {
    public static getFormatterInstances(
        configurationManager: IConfigurationManager,
        formatterSettings: FormatterSettings
    ): IFormatter[] {
        console.log("Getting formatters ... ");
        const instances: IFormatter[] = [];
        for (const formatterClass in formatterRegistry) {
            if (
                FormatterFactory.isEnabled(
                    formatterRegistry[formatterClass].formatterLabel,
                    configurationManager
                )
            ) {
                console.log(
                    "Formatter activated:",
                    formatterRegistry[formatterClass].formatterLabel
                );
                instances.push(
                    new formatterRegistry[formatterClass](formatterSettings)
                );
            } else {
                console.log(
                    "Formatter disabled:",
                    formatterRegistry[formatterClass].formatterLabel
                );
            }
        }
        return instances;
    }

    private static isEnabled(
        formatterName: string,
        configurationManager: IConfigurationManager
    ): boolean {
        if (configurationManager.get(formatterName)!) {
            return true;
        }

        if (formatterName.startsWith("DEBUG-")) {
            return true;
        }
        return false;
    }
}
