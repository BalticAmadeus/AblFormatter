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
        this.startColumn = node.startPosition.column;
        console.log("startColumn");
        console.log(this.startColumn);
        this.forBodyValue = this.getForStatementBlock(node, fullText);
    }

    private getForStatementBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        let alignColumn = 0;

        console.log("Node Type:", node.type);
        console.log("Node Start Position:", node.startIndex);
        console.log("Node End Position:", node.endIndex);

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

        console.log("Node Type:", node.type);
        console.log("Node Start Position:", node.startIndex);
        console.log("Node End Position:", node.endIndex);

        switch (node.type) {
            case SyntaxNodeType.ForKeyword:
                console.log("ForKeyword");
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
            case SyntaxNodeType.WhereClause:
                console.log("WhereClause");
                newString = this.getWhereClauseBlock(
                    node,
                    fullText,
                    alignColumn
                );
                break;
            default:
                console.log("default");
                const text = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                newString = text.length === 0 ? "" : " " + text;
                console.log("Default Case - Text:", newString);
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
                    console.log("WhereKeyword");
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
                    console.log("default getWhereClauseBlock");
                    resultString = resultString.concat(
                        text.length === 0 ? "" : " " + text
                    );
                    break;
            }
        });

        return resultString;
    }
}
