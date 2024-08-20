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

type AssingLine = {
    leftValue: string;
    rightValue: string;
};

type AssignBlock = {
    assignValues: AssingLine[];
    intendationColumn: number;
    longestLeft: number;
};

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
        if (node.type === SyntaxNodeType.AssignStatement) {
            return true;
        }
        return false;
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

        console.log(this.getLongestLeft(node.children, fullText));

        node.children.forEach((child) => {
            console.log("-----------------");
            console.log(node.type);
            const childCount = this.getAssignmentChildCount(child);
            console.log("NUMBER OF CHILDS:");
            console.log(childCount);
            // resultString = resultString.concat(
            //     this.getAssignmentString(child, fullText)
            // );
        });

        return resultString;
    }

    private getAssignmentString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";

        switch (node.type) {
            case SyntaxNodeType.ReturnStatement:
            case SyntaxNodeType.AblStatement:
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

    private getAssignmentChildCount(assignment: SyntaxNode): number {
        for (let i = 0; i < assignment.childCount; i++) {
            const childNode = assignment.child(i);
            console.log(`Child ${i} type: ${childNode?.type}`);
        }
        return assignment.childCount;
    }

    private getLongestLeft(
        assignments: SyntaxNode[],
        fullText: FullText
    ): number {
        let longestLeft = 0;

        assignments.forEach((assignment) => {
            const childCount = this.getAssignmentChildCount(assignment);

            if (childCount > 3) {
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

    // private isAssignment(value: SyntaxNode): boolean {
    //     return value.type === SyntaxNodeType.Assignment;
    // }

    // private isAssignKeyword(value: SyntaxNode): boolean {
    //     return value.type === SyntaxNodeType.AssignKeyword;
    // }

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
