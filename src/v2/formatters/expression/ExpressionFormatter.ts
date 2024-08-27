import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { ExpressionSettings } from "./ExpressionSettings";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class ExpressionFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "expressionFormatting";
    private readonly settings: ExpressionSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new ExpressionSettings(configurationManager);
    }
    match(node: Readonly<SyntaxNode>): boolean {
        if (
            node.type === SyntaxNodeType.LogicalExpression ||
            node.type === SyntaxNodeType.ComparisonExpression ||
            node.type === SyntaxNodeType.ParenthesizedExpression
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
        const newText = this.collectExpression(node, fullText);
        return this.getCodeEdit(node, text, newText, fullText);
    }

    private collectExpression(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        if (node.type === SyntaxNodeType.ParenthesizedExpression) {
            node.children.forEach((child) => {
                resultString = resultString.concat(
                    this.getParenthesizedExpressionString(child, fullText)
                );
            });
            return resultString;
        } else {
            node.children.forEach((child) => {
                resultString = resultString.concat(
                    this.getExpressionString(child, fullText)
                );
            });
            console.log("allText:\n" + resultString);
            return resultString.trimEnd();
        }
    }

    private getExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";
        switch (node.type) {
            default:
                const text = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                newString = text.length === 0 ? "" : " " + text;
                break;
        }
        return newString;
    }

    private getParenthesizedExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        let newString = "";
        switch (node.type) {
            case SyntaxNodeType.LeftParenthesis:
                newString =
                    " " + FormatterHelper.getCurrentText(node, fullText);
                break;
            default:
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
        }
        return newString;
    }
}
