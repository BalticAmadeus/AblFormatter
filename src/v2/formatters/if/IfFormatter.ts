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

        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.ifBodyValue
        );
    }

    private collectIfStructure(node: SyntaxNode, fullText: Readonly<FullText>) {
        this.startColumn = this.getStartColumn(node);
        this.ifBodyValue = this.getCaseBodyBranchBlock(node, fullText);
    }

    private getCaseBodyBranchBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getIfExpressionString(child, fullText)
            );
        });

        return resultString.trim();
    }

    private getIfExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ThenKeyword:
                newString = this.settings.newLineBeforeThen()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.DoBlock:
                newString = this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.ReturnStatement:
            case SyntaxNodeType.AblStatement:
                newString = this.settings.newLineBeforeStatement()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      " ".repeat(this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.ElseIfStatement:
                newString = node.children
                    .map((child) =>
                        this.getElseIfStatementPart(child, fullText)
                    )
                    .join("");
                break;
            case SyntaxNodeType.ElseStatement:
                newString = node.children
                    .map((child) => this.getElseStatementPart(child, fullText))
                    .join("");
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

    private getElseStatementPart(node: SyntaxNode, fullText: FullText): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ElseKeyword:
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.DoBlock:
                newString = this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.ReturnStatement:
            case SyntaxNodeType.AblStatement:
                newString = this.settings.newLineBeforeStatement()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      " ".repeat(this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
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

    private getElseIfStatementPart(
        node: SyntaxNode,
        fullText: FullText
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ElseKeyword:
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                break;
            case SyntaxNodeType.DoBlock:
                newString = this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
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

    private getStartColumn(node: SyntaxNode): number {
        if (node.type === SyntaxNodeType.IfStatement) {
            return node.startPosition.column;
        } else {
            return this.findParentIfStatementStartColumn(node);
        }
    }

    private findParentIfStatementStartColumn(node: SyntaxNode): number {
        if (node.parent === null) {
            return 0;
        }

        return node.type === SyntaxNodeType.IfStatement
            ? node.startPosition.column
            : this.findParentIfStatementStartColumn(node.parent);
    }
}
