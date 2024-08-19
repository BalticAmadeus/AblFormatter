import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { CaseSettings } from "./CaseSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class CaseFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private caseBodyValue = "";

    public static readonly formatterLabel = "caseFormatting";
    private readonly settings: CaseSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new CaseSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        return node.type === SyntaxNodeType.CaseStatement;
    }

    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectCaseStructure(node, fullText);
        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.caseBodyValue
        );
    }

    private collectCaseStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        this.startColumn = this.getStartColumn(node);
        this.caseBodyValue = this.getCaseBodyBranchBlock(node, fullText);
    }

    private getCaseBodyBranchBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getCaseExpressionString(child, fullText)
            );
        });

        return resultString.trim();
    }

    private getCaseExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        console.log(`//////////////////////////////////////////`);
        console.log(`Processing node of type: ${node.type}`);

        switch (node.type) {
            case SyntaxNodeType.CaseBody:
                console.log(`Case: CaseBody`);
                if (this.settings.newLineBeforeWhen()) {
                    newString = newString.concat(
                        fullText.eolDelimiter +
                            " ".repeat(
                                this.startColumn + this.settings.tabSize()
                            )
                    );
                }
                newString = newString.concat(
                    this.getWhenBranchBlock(node, fullText)
                );
                break;

            case SyntaxNodeType.AblStatement:
                console.log(`Case: AblStatement`);
                newString = this.settings.newLineBeforeStatement()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn + this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            case SyntaxNodeType.EndKeyword:
                console.log(`Case: EndKeyword`);
                newString =
                    fullText.eolDelimiter +
                    " ".repeat(this.startColumn) +
                    FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            default:
                console.log(`Case: Default`);
                const text = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                newString = text.length === 0 ? "" : " " + text;
                console.log(`Formatted string: ${newString}`);
                break;
        }

        return newString;
    }

    private getWhenBranchBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        node.children.forEach((child) => {
            console.log(`//////////////////////////////////////////`);
            console.log(`getWhenBranchBlock: ${node.type}`);
            child.children.forEach((grandchild) => {
                resultString = resultString.concat(
                    this.getCaseBodyExpressionString(grandchild, fullText)
                );
            });
        });

        return resultString.trim();
    }

    private getCaseBodyExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        console.log(`//////////////////////////////////////////`);
        console.log(`getCaseBodyExpressionString: ${node.type}`);

        switch (node.type) {
            case SyntaxNodeType.WhenKeyword:
                console.log(`Case: WhenKeyword`);
                newString = this.settings.newLineBeforeWhen()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn + this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            case SyntaxNodeType.ThenKeyword:
                console.log(`Case: ThenKeyword`);
                newString = this.settings.newLineBeforeThen()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            case SyntaxNodeType.OtherwiseKeyword:
                console.log(`Case: OtherwiseKeyword`);
                newString = this.settings.newLineBeforeWhen()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn + this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            case SyntaxNodeType.DoBlock:
                console.log(`Case: DoBlock`);
                newString = this.settings.newLineBeforeDo()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            case SyntaxNodeType.AblStatement:
                console.log(`Case: AblStatement`);
                newString = this.settings.newLineBeforeStatement()
                    ? fullText.eolDelimiter +
                      " ".repeat(
                          this.startColumn +
                              this.settings.tabSize() +
                              this.settings.tabSize()
                      ) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                console.log(`Formatted string: ${newString}`);
                break;

            default:
                console.log(`Case: Default`);
                const text = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                newString = text.length === 0 ? "" : " " + text;
                console.log(`Formatted string: ${newString}`);
                break;
        }

        return newString;
    }

    private getStartColumn(node: SyntaxNode): number {
        if (node.type === SyntaxNodeType.CaseStatement) {
            return node.startPosition.column;
        } else {
            return this.findParentCaseStatementStartColumn(node);
        }
    }

    private findParentCaseStatementStartColumn(node: SyntaxNode): number {
        if (node.parent === null) {
            return 0;
        }

        return node.type === SyntaxNodeType.CaseStatement
            ? node.startPosition.column
            : this.findParentCaseStatementStartColumn(node.parent);
    }
}
