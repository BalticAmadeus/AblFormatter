import { Range } from "vscode";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { IAblFormatter } from "./IAblFormatter";

export abstract class AAblFormatter {
    protected ablFormatterRunner: IAblFormatterRunner | undefined = undefined;

    protected ranges: Range[] = [];

    public setRunner(ablFormatterRunner: IAblFormatterRunner): IAblFormatter {
        this.ablFormatterRunner = ablFormatterRunner;
        return this.getSelf();
    }

    protected abstract getSelf(): IAblFormatter;
}
