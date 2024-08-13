import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IfSettings } from "./IfSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class IfFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private nextLineOfComparison = 3; // "IF "
    private ifBlockValueColumn = 0;
    private ifBodyValue = "";

    public static readonly formatterLabel = "ifFormatting";
    private readonly settings: IfSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new IfSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (
            node.type === SyntaxNodeType.IfStatement ||
            node.type === SyntaxNodeType.ElseIfStatement
        ) {
            return true;
        }

        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectIfStructure(node, fullText);

        console.log("aaa", this.ifBodyValue);

        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.ifBodyValue
        );
    }

    private collectIfStructure(node: SyntaxNode, fullText: Readonly<FullText>) {
        this.startColumn = this.getStartColumn(node);
        this.ifBlockValueColumn = this.startColumn + this.settings.tabSize();
        this.ifBodyValue = this.getCaseBodyBranchBlock(node, fullText);
    }

    private getCaseBodyBranchBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        let doBlock = false;

        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.DoBlock) {
                doBlock = true;
            }
        });

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getIfExpressionString(
                    child,
                    fullText.eolDelimiter.concat(
                        " ".repeat(this.ifBlockValueColumn)
                    ),
                    doBlock,
                    fullText
                )
            );
        });

        return resultString.trim();
    }

    private getIfExpressionString(
        node: SyntaxNode,
        separator: string,
        doBlock: boolean,
        fullText: Readonly<FullText>
    ): string {
        console.log(
            node.type,
            separator,
            doBlock,
            node.startIndex,
            node.endIndex,
            FormatterHelper.getCurrentText(node, fullText).trim()
        );

        switch (node.type) {
            case SyntaxNodeType.ThenKeyword:
                return this.settings.newLineBeforeThen()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            case SyntaxNodeType.DoBlock:
                return this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            case SyntaxNodeType.ReturnStatement:
            case SyntaxNodeType.AblStatement:
                return this.settings.newLineBeforeStatement()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          " ".repeat(this.settings.tabSize()) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            case SyntaxNodeType.ElseIfStatement:
            case SyntaxNodeType.ElseStatement:
                return node.children
                    .map((child) => this.getElseStatementPart(child, fullText))
                    .join("");
            default:
                return (
                    " " + FormatterHelper.getCurrentText(node, fullText).trim()
                );
        }
    }

    private getElseStatementPart(node: SyntaxNode, fullText: FullText): string {
        switch (node.type) {
            case SyntaxNodeType.ElseKeyword:
                return (
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim()
                );
            case SyntaxNodeType.DoBlock:
                return this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                          " ".repeat(this.startColumn) +
                          FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                          FormatterHelper.getCurrentText(node, fullText).trim();
            default:
                return (
                    " " + FormatterHelper.getCurrentText(node, fullText).trim()
                );
        }
    }

    private getStartColumn(node: SyntaxNode): number {
        if (node.type === SyntaxNodeType.IfStatement) {
            console.log("st:  ", node.startPosition.column);
            return node.startPosition.column;
        } else {
            return this.findParentIfStatementStartColumn(node);
        }
    }

    private findParentIfStatementStartColumn(node: SyntaxNode): number {
        if (node.parent === null) {
            return 0;
        }
        console.log("st11:  ", node.startPosition.column, node.type);
        return node.type === SyntaxNodeType.IfStatement
            ? node.startPosition.column
            : this.findParentIfStatementStartColumn(node.parent);
    }
}
