import { workspace } from "vscode";
import { AblAssignFormatter } from "../formatters/AblAssignFormatter";
import { AblFindFormatter } from "../formatters/AblFindFormatter";
import { AblForFormatter } from "../formatters/AblForFormatter";
import { AblFormatterRunner } from "../formatters/AblFormatterRunner";
import { AblTokenFormatter } from "../formatters/AblTokenFormatter";
import { IAblFormatter } from "../formatters/IAblFormatter";
import { IAblFormatterRunner } from "../formatters/IAblFormatterRunner";
import { TreeLogger } from "../formatters/TreeLogger";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblBlockFormatter } from "../formatters/AblBlockFormatter";

export class AblFormatterFactory {
    private runner: IAblFormatterRunner | undefined;

    private readonly formatterNames = [
        "assignFormatting",
        "treeLogging",
        "defineFormatting",
        "findFormatting",
        "forFormatting",
        //"DEBUG-blockFormatting",
    ];

    public getFormatters(): IAblFormatter[] {
        console.log("Getting formatters ... ");
        const formatters = this.formatterNames.map((formatterName) => {
            if (this.enabled(formatterName)) {
                const formatter = this.getFormatter(formatterName);
                if (formatter !== undefined) {
                    console.log("Formatter activated: ", formatterName);
                    return formatter;
                } else {
                    console.log("Formatter disabled: ", formatterName);
                }
            }
        });

        return formatters.filter(
            (formatter): formatter is IAblFormatter => formatter !== undefined
        );
    }

    private enabled(formatterName: string): boolean {
        if (ConfigurationManager.get(formatterName)!) {
            return true;
        }

        if (formatterName.startsWith("DEBUG-")) {
            return true;
        }
        return false;
    }

    private getFormatter(formatterName: string): IAblFormatter | undefined {
        if (this.runner === undefined) {
            return undefined;
        }

        switch (formatterName) {
            case "assignFormatting":
                return new AblAssignFormatter(this.runner);
            case "treeLogging":
                return new TreeLogger(this.runner);
            case "defineFormatting":
                return new AblTokenFormatter(this.runner);
            case "findFormatting":
                return new AblFindFormatter(this.runner);
            case "forFormatting":
                return new AblForFormatter(this.runner);
            case "DEBUG-blockFormatting":
                return new AblBlockFormatter(this.runner);
        }

        return undefined;
    }

    public getFormatterRunner(): IAblFormatterRunner {
        this.runner = new AblFormatterRunner();
        return this.runner;
    }
}
