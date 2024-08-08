import { formatterRegistry } from "../formatterFramework/formatterDecorator";
import { FormatterSettings } from "../model/FormatterSettings";

export abstract class AFormatter {
    private readonly formatterSettings: FormatterSettings;

    public constructor(formatterSettings: FormatterSettings) {
        this.formatterSettings = formatterSettings;
    }
}
