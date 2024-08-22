import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IfFunctionSettings } from "./IfFunctionSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class IfFunctionFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "ifFunctionFormatting";
    private readonly settings: IfFunctionSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new IfFunctionSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === SyntaxNodeType.TernaryExpression) {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        let newText = text;
        if (this.settings.addParentheses()) {
            const parent = node.parent;
            if (parent !== null) {
                console.log("parent:" + parent.type);
                console.log(
                    "parent: " +
                        FormatterHelper.getCurrentText(parent, fullText)
                );
            }
            if (
                parent !== null &&
                parent.type !== SyntaxNodeType.ParenthesizedExpression
            ) {
                newText = this.addParenthesesAroundExpression(text);
            }
        }
        return this.getCodeEdit(node, text, newText, fullText);
    }

    private addParenthesesAroundExpression(expression: string): string {
        const trimmedExpression = expression.trim();
        return expression.replace(trimmedExpression, `(${trimmedExpression})`);
    }
}
