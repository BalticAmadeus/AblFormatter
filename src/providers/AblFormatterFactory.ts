import { AblAssignFormatter } from "../formatters/AblAssignFormatter";
import { AblFormatterRunner } from "../formatters/AblFormatterRunner";
import { AblTokenFormatter } from "../formatters/AblTokenFormatter";
import { IAblFormatter } from "../formatters/IAblFormatter";
import { IAblFormatterRunner } from "../formatters/IAblFormatterRunner";
import { TreeLogger } from "../formatters/TreeLogger";

export class AblFormatterFactory {
    private runner: IAblFormatterRunner | undefined;

    public getFormatters(): IAblFormatter[] {
        if (this.runner === undefined) {
            return [];
        }

        return [
            new AblTokenFormatter().setRunner(this.runner),
            //new AblAssignFormatter().setRunner(this.runner),
            new TreeLogger().setRunner(this.runner),
        ];
    }

    public getFormatterRunner(): IAblFormatterRunner {
        this.runner = new AblFormatterRunner();
        return this.runner;
    }
}
