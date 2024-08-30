import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { ForSettings } from "./ForSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class ForFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private forBodyValue = "";

    public static readonly formatterLabel = "forFormatting";
    private readonly settings: ForSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new ForSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === SyntaxNodeType.ForStatement) {
            return true;
        }

        return false;
    }

    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectForStructure(node, fullText);

        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.forBodyValue,
            fullText
        );
    }

    private collectForStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        this.startColumn = FormatterHelper.getActualStatementIndentation(
            node,
            fullText
        );
        this.forBodyValue = this.getForStatementBlock(node, fullText);
    }

    private getForStatementBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        let alignColumn = 0;

        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.Identifier) {
                alignColumn = this.startColumn + resultString.length;
            }
            resultString = resultString.concat(
                this.getForExpressionString(child, fullText, alignColumn)
            );
        });

        return resultString;
    }

    private getForExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        alignColumn: number
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ForKeyword:
            case SyntaxNodeType.DotKeyword:
            case SyntaxNodeType.ColonKeyword:
            case SyntaxNodeType.CommaKeyword:
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
            case SyntaxNodeType.WhereClause:
                newString = this.getWhereClauseBlock(
                    node,
                    fullText,
                    alignColumn
                );
                break;
            case SyntaxNodeType.EndKeyword:
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.SortClause:
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(alignColumn + 1) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.ForPhrase:
                newString = this.getSortClauseBlock(
                    node,
                    fullText,
                    alignColumn
                );
                break;
            case SyntaxNodeType.Body:
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn + this.settings.tabSize()) +
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

    private getWhereClauseBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        alignColumn: number
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            switch (child.type) {
                case SyntaxNodeType.WhereKeyword:
                    resultString = resultString.concat(
                        " ",
                        FormatterHelper.getCurrentText(child, fullText).trim(),
                        fullText.eolDelimiter,
                        " ".repeat(alignColumn)
                    );
                    break;
                default:
                    const text = FormatterHelper.getCurrentText(
                        child,
                        fullText
                    ).trim();
                    resultString = resultString.concat(
                        text.length === 0 ? "" : " " + text
                    );
                    break;
            }
        });

        return resultString;
    }

    private getSortClauseBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        alignColumn: number
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            switch (child.type) {
                case SyntaxNodeType.EachKeyword:
                    resultString = resultString.concat(
                        fullText.eolDelimiter,
                        " ".repeat(this.startColumn + this.settings.tabSize()),
                        FormatterHelper.getCurrentText(child, fullText).trim()
                    );
                    break;
                case SyntaxNodeType.SortClause:
                    resultString = resultString.concat(
                        fullText.eolDelimiter,
                        " ".repeat(alignColumn + 1),
                        FormatterHelper.getCurrentText(child, fullText).trim()
                    );
                    break;
                default:
                    const text = FormatterHelper.getCurrentText(
                        child,
                        fullText
                    ).trim();
                    resultString = resultString.concat(
                        text.length === 0 ? "" : " " + text
                    );
                    break;
            }
        });

        return resultString;
    }
}
