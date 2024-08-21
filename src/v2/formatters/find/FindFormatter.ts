import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { FindSettings } from "./FindSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

/**
 * Note: The WHERE clause block with multiple LogicalExpressions does not align correctly 
 * during the first formatting if there are spaces before the WHERE clause.
 * 
 * Question: Should QueryTuning also be formatted in a similar manner to LogicalExpressions, 
 * with aligned spacing and line breaks? 
 */

@RegisterFormatter
export class FindFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private findBodyValue = "";

    public static readonly formatterLabel = "findFormatting";
    private readonly settings: FindSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new FindSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        return node.type === SyntaxNodeType.FindStatement;
    }

    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectCaseStructure(node, fullText);
        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.findBodyValue,
            fullText
        );
    }

    private collectCaseStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        this.startColumn = this.getStartColumn(node);
        this.findBodyValue = this.getFindStatementBlock(node, fullText);
    }

    private getFindStatementBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getFindExpressionString(child, fullText)
            );
        });

        resultString = resultString.concat(".");
        return resultString;
    }

    private getFindExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.FindKeyword:
                newString =
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.WhereClause:
                newString = this.getWhereClauseBlock(node, fullText);
                break;
            case SyntaxNodeType.QueryTuning:
                newString =
                    " " + FormatterHelper.getCurrentText(node, fullText).trim();
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

    private getWhereClauseBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            switch (child.type) {
                case SyntaxNodeType.LogicalExpression:
                    resultString = resultString.concat(
                        this.getLogicalExpressionBlock(
                            child,
                            fullText,
                            child.startPosition.column
                        )
                    );
                    break;
                case SyntaxNodeType.WhereKeyword:
                    resultString = resultString.concat(
                        " ",
                        FormatterHelper.getCurrentText(child, fullText).trim()
                    );
                    break;
                case SyntaxNodeType.ComparisonExpression:
                    resultString = resultString.concat(
                        this.getComparisonExpressionBlock(child, fullText)
                    );
                    break;
                default:
                    const text = FormatterHelper.getCurrentText(
                        node,
                        fullText
                    ).trim();
                    resultString = text.length === 0 ? "" : " " + text;
                    break;
            }
        });

        return resultString;
    }

    private getComparisonExpressionBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                " ",
                FormatterHelper.getCurrentText(child, fullText).trim()
            );
        });

        return resultString;
    }

    private getLogicalExpressionBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        LogicalExpressionStartColumn: number
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getLogicalExpressionString(
                    child,
                    fullText,
                    LogicalExpressionStartColumn
                )
            );
        });

        return resultString;
    }

    private getLogicalExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        LogicalExpressionStartColumn: number
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.OrKeyword:
            case SyntaxNodeType.AndKeyword:
                newString =
                    " " +
                    FormatterHelper.getCurrentText(node, fullText).trim() +
                    fullText.eolDelimiter +
                    " ".repeat(LogicalExpressionStartColumn);
                break;
            case SyntaxNodeType.LogicalExpression:
                newString = this.getLogicalExpressionBlock(
                    node,
                    fullText,
                    LogicalExpressionStartColumn
                );
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

    private getStartColumn(node: SyntaxNode): number {
        if (node.type === SyntaxNodeType.FindKeyword) {
            return node.startPosition.column;
        } else {
            return this.findParentFindStatementStartColumn(node);
        }
    }

    private findParentFindStatementStartColumn(node: SyntaxNode): number {
        if (node.parent === null) {
            return 0;
        }

        return node.type === SyntaxNodeType.FindKeyword
            ? node.startPosition.column
            : this.findParentFindStatementStartColumn(node.parent);
    }
}
