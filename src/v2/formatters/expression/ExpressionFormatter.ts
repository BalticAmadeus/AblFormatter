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
    private lastComparisonExpressionColumn = 0;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new ExpressionSettings(configurationManager);
    }
    match(node: Readonly<SyntaxNode>): boolean {
        if (
            node.type === SyntaxNodeType.LogicalExpression ||
            node.type === SyntaxNodeType.ComparisonExpression ||
            node.type === SyntaxNodeType.ParenthesizedExpression ||
            node.type === SyntaxNodeType.AdditiveExpression ||
            node.type === SyntaxNodeType.MultiplicativeExpression ||
            node.type === SyntaxNodeType.Assignment ||
            node.type === SyntaxNodeType.UnaryExpression
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
                if (
                    this.settings.newLineAfterLogical() &&
                    child.type === SyntaxNodeType.ComparisonExpression
                ) {
                    this.lastComparisonExpressionColumn =
                        child.startPosition.column;
                    console.log("lastLine:\n" + resultString);
                    console.log(
                        "lastLineLength: " + this.lastComparisonExpressionColumn
                    );
                }
                resultString = resultString.concat(
                    this.getParenthesizedExpressionString(child, fullText)
                );
            });
            return resultString.trimEnd();
        } else {
            node.children.forEach((child) => {
                console.log("child: " + child.type);
                if (
                    this.settings.newLineAfterLogical() &&
                    child.type === SyntaxNodeType.ComparisonExpression
                ) {
                    this.lastComparisonExpressionColumn =
                        child.startPosition.column;
                    console.log("lastLine:\n" + resultString);
                    console.log(
                        "lastLineLength: " + this.lastComparisonExpressionColumn
                    );
                }
                resultString = resultString.concat(
                    this.getExpressionString(child, fullText)
                );
            });
            console.log("allText:\n" + resultString);
            if (node.type === SyntaxNodeType.Assignment) {
                // In this case, we need to trim the spaces at the start of the string as well
                return resultString.trim();
            }
            return resultString.trimEnd();
        }
    }

    private getExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";
        switch (node.type) {
            case SyntaxNodeType.AndKeyword || SyntaxNodeType.OrKeyword:
                console.log(
                    "lastComparison: " + this.lastComparisonExpressionColumn
                );
                newString = this.settings.newLineAfterLogical()
                    ? " " +
                      FormatterHelper.getCurrentText(node, fullText).trim() +
                      fullText.eolDelimiter +
                      " ".repeat(this.lastComparisonExpressionColumn)
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
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

    private getLengthOfLastLine(text: string): number {
        const lines = text.split("\n");
        return lines[lines.length - 1].length;
    }
}
