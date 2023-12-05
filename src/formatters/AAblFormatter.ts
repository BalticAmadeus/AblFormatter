import { Range } from "vscode";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { IAblFormatter } from "./IAblFormatter";

export abstract class AAblFormatter {
    protected ablFormatterRunner: IAblFormatterRunner | undefined;

    protected ranges: Range[] = [];

    public constructor(ablFormatterRunner: IAblFormatterRunner) {
        this.ablFormatterRunner = ablFormatterRunner;
    }

    protected abstract getSelf(): IAblFormatter;
}
