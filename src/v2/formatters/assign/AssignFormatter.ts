import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AssignSettings } from "./AssignSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class AssignFormatter extends AFormatter implements IFormatter {
    private startColumn = 0;
    private assignBodyValue = "";

    public static readonly formatterLabel = "assignFormatting";
    private readonly settings: AssignSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new AssignSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        return node.type === SyntaxNodeType.AssignStatement;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectAssignStructure(node, fullText);
        return this.getCodeEdit(
            node,
            FormatterHelper.getCurrentText(node, fullText),
            this.assignBodyValue,
            fullText
        );
    }

    private collectAssignStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        this.startColumn = this.getStartColumn(node);
        this.assignBodyValue = this.getAssignBlock(node, fullText);
    }

    private getAssignBlock(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        let longestLeft = this.getLongestLeft(node.children, fullText);

        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getAssignmentString(child, fullText, longestLeft)
            );
        });

        if (this.settings.endDotAlignment()) {
            resultString +=
                fullText.eolDelimiter +
                " ".repeat(this.startColumn + this.settings.tabSize()) +
                ".";
        } else if (this.settings.endDotLocationNew()) {
            resultString += fullText.eolDelimiter + ".";
        } else resultString += ".";

        return resultString;
    }

    private getAssignmentString(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        longestLeft: number
    ): string {
        switch (node.childCount) {
            case 4:
                return this.handleFourChildren(node, fullText);
            case 3:
                return this.handleThreeChildren(node, fullText, longestLeft);
            case 1:
                return this.handleOneChild(node, fullText);
            case 0:
                return this.handleZeroChildren(node, fullText);
            default:
                return "";
        }
    }

    private handleFourChildren(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        if (this.settings.newLineAfterAssign()) {
            newString =
                fullText.eolDelimiter +
                " ".repeat(this.startColumn + this.settings.tabSize() - 1);
        }

        node.children.forEach((child) => {
            newString +=
                " " + FormatterHelper.getCurrentText(child, fullText).trim();
        });
        return newString;
    }

    private handleThreeChildren(
        node: SyntaxNode,
        fullText: Readonly<FullText>,
        longestLeft: number
    ): string {
        let newString = "";
        const [leftNode, middleNode, rightNode] = node.children;
        if (leftNode && middleNode && rightNode) {
            const leftText = FormatterHelper.getCurrentText(
                leftNode,
                fullText
            ).trim();
            const middleText = FormatterHelper.getCurrentText(
                middleNode,
                fullText
            ).trim();
            const rightText = FormatterHelper.getCurrentText(
                rightNode,
                fullText
            ).trim();

            let paddedLeftText = this.settings.alignRightExpression()
                ? leftText.padEnd(longestLeft)
                : leftText;

            newString = this.settings.newLineAfterAssign()
                ? fullText.eolDelimiter +
                  " ".repeat(this.startColumn + this.settings.tabSize()) +
                  paddedLeftText +
                  " " +
                  middleText +
                  " " +
                  rightText
                : " " + paddedLeftText + " " + middleText + " " + rightText;
        }
        return newString;
    }

    private handleOneChild(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ErrorKeyword:
                newString = this.settings.newLineAfterAssign()
                    ? fullText.eolDelimiter +
                      " ".repeat(this.startColumn + this.settings.tabSize()) +
                      FormatterHelper.getCurrentText(node, fullText).trim()
                    : " " +
                      FormatterHelper.getCurrentText(node, fullText).trim();
                break;
        }
        return newString;
    }

    private handleZeroChildren(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";
        switch (node.type) {
            case SyntaxNodeType.AssignKeyword:
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
            case SyntaxNodeType.NoErrorKeyword:
                const text = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                newString = text.length === 0 ? "" : " " + text;
                break;
        }
        return newString;
    }

    private getLongestLeft(
        assignments: SyntaxNode[],
        fullText: FullText
    ): number {
        let longestLeft = 0;

        assignments.forEach((assignment) => {
            if (assignment.childCount > 3 || assignment.childCount == 1) {
                return;
            }

            const leftChild = assignment.child(0);

            const leftLength = leftChild
                ? FormatterHelper.getCurrentText(leftChild, fullText).trim()
                      .length
                : 0;

            if (leftLength > longestLeft) {
                longestLeft = leftLength;
            }
        });

        return longestLeft;
    }

    private getStartColumn(node: SyntaxNode): number {
        if (node.type === SyntaxNodeType.AssignStatement) {
            return node.startPosition.column;
        } else {
            return this.findParentAssignStatementStartColumn(node);
        }
    }

    private findParentAssignStatementStartColumn(node: SyntaxNode): number {
        if (node.parent === null) {
            return 0;
        }

        return node.type === SyntaxNodeType.CaseStatement
            ? node.startPosition.column
            : this.findParentAssignStatementStartColumn(node.parent);
    }
}
