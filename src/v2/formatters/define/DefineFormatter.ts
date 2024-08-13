import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { DefineSettings } from "./DefineSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class DefineFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "defineFormatting";
    private readonly settings: DefineSettings;

    private targetIsLong = true;
    private longDefine = "DEFINE";
    private shortDefine = "DEF";

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new DefineSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (
            node.type === "DEFINE" ||
            node.type === "define" ||
            node.type === "DEFI" ||
            node.type === "defi" ||
            node.type === "DEF" ||
            node.type === "def"
        ) {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        console.log(text);
        const newText = this.getPrettyToken(text);
        return this.getCodeEdit(node, text, newText, fullText);
    }

    private getPrettyToken(text: string): string {
        const token = this.settings.casing()
            ? (this.targetIsLong
                  ? this.longDefine
                  : this.shortDefine
              ).toUpperCase()
            : (this.targetIsLong
                  ? this.longDefine
                  : this.shortDefine
              ).toLowerCase();

        return token;
    }
}
