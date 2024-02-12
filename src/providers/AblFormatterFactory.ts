import { AblAssignFormatter } from "../formatters/AblAssignFormatter";
import { AblFindFormatter } from "../formatters/AblFindFormatter";
import { AblForFormatter } from "../formatters/AblForFormatter";
import { AblCaseFormatter } from "../formatters/AblCaseFormatter";
import { AblFormatterRunner } from "../formatters/AblFormatterRunner";
import { AblTokenFormatter } from "../formatters/AblTokenFormatter";
import { IAblFormatter } from "../formatters/IAblFormatter";
import { IAblFormatterRunner } from "../formatters/IAblFormatterRunner";
import { TreeLogger } from "../formatters/TreeLogger";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblBlockFormatter } from "../formatters/AblBlockFormatter";
import { AblTemptableFormatter } from "../formatters/AblTemptableFormatter";

export class AblFormatterFactory {
    private runner: IAblFormatterRunner | undefined;

    private readonly baseFormatterNames = [
        "blockFormatting",
    ];

    private readonly formatterNames = [
        "assignFormatting",
        "treeLogging",
        "defineFormatting",
        "findFormatting",
        "forFormatting",
        "caseFormatting",
        "temptableFormatting",
    ];

    public getBaseFormatters(): IAblFormatter[] {
        console.log("Getting base formatters ... ");
        const formatters = this.baseFormatterNames.map((formatterName) => {
            if (this.enabled(formatterName)) {
                const formatter = this.getFormatter(formatterName);
                if (formatter !== undefined) {
                    console.log("Base formatter activated: ", formatterName);
                    return formatter;
                } else {
                    console.log("Base formatter disabled: ", formatterName);
                }
            }
        });

        return formatters.filter(
            (formatter): formatter is IAblFormatter => formatter !== undefined
        );
    }

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
            case "caseFormatting":
                return new AblCaseFormatter(this.runner);
            case "blockFormatting":
                return new AblBlockFormatter(this.runner);
            case "temptableFormatting":
                return new AblTemptableFormatter(this.runner);
        }

        return undefined;
    }

    public getFormatterRunner(): IAblFormatterRunner {
        this.runner = new AblFormatterRunner(this);
        return this.runner;
    }
}
