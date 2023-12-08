import { AblAssignFormatter } from "../formatters/AblAssignFormatter";
import { AblFindFormatter } from "../formatters/AblFindFormatter";
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
            new AblTokenFormatter(this.runner),
            new AblAssignFormatter(this.runner),
            new AblFindFormatter(this.runner),
            new TreeLogger(this.runner),
        ];
    }

    public getFormatterRunner(): IAblFormatterRunner {
        this.runner = new AblFormatterRunner();
        return this.runner;
    }
}
