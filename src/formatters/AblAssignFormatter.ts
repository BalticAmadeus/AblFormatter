import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { Range, TextEdit } from "vscode";
import { FormatterSettings } from "../model/FormatterSettings";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

type AssingLine = {
    leftValue: string;
    rightValue: string;
};

type AssignBlock = {
    assignValues: AssingLine[];
    intendationColumn: number;
    longestLeft: number;
};

export class AblAssignFormatter extends AAblFormatter implements IAblFormatter {
    // Possible settings strcuture:
    // Currently hardcoded configuration in UPPERCASE
    // New line after assign        YES      |   no
    // assignments intendation      NEW TAB* |   no  |   by first line
    // Align right expression       YES      |   no
    // Put ending dot in new line   YES      |   no
    // Format one line statements   YES      |   no
    // * Tab width should be inherited from global VSC setting

    private textEdit: TextEdit[] = [];

    parseNode(node: SyntaxNode): void {
        if (node.type !== SyntaxNodeType.AssignStatement) {
            return;
        }
        const assignments = node.children.filter(this.isAssignment);

        let assingValues: AssingLine[] = [];
        let longestLeft = 0;
        const intendationColumn = node.children.filter(this.isAssign)[0]
            .startPosition.column;

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        assignments.forEach((assignment) => {
            const leftChild = assignment.child(0);
            const rightChild = assignment.child(2);

            if (leftChild === null || rightChild === null) {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return;
            }

            const assignLine: AssingLine = {
                leftValue: leftChild.text
                    .trim(),
                rightValue: rightChild.text
                    .trim(),
            };

            assingValues.push(assignLine);

            if (assignLine.leftValue.length > longestLeft) {
                longestLeft = assignLine.leftValue.length;
            }
        });

        const assignBlock: AssignBlock = {
            assignValues: assingValues,
            longestLeft: longestLeft,
            intendationColumn: intendationColumn,
        };

        const newBlock = this.getPrettyBlock(assignBlock);

        console.log("newBlock", newBlock);

        if (
            this.ablFormatterRunner
                .getDocument()
                .getText(
                    new Range(
                        node.startPosition.row,
                        0,
                        node.endPosition.row,
                        node.endPosition.column
                    )
                ) === newBlock
        ) {
            return;
        }
        this.textEdit?.push(
            new TextEdit(
                new Range(
                    node.startPosition.row,
                    0,
                    node.endPosition.row,
                    node.endPosition.column
                ),
                newBlock
            )
        );
    }

    public getSourceChanges(): SourceChanges {
        return {
            textEdits: this.textEdit,
        };
    }

    clearSourceChanges(): void {
        this.textEdit.length = 0;
    }

    private getPrettyBlock(assignBlock: AssignBlock): string {
        const block = " "
            .repeat(assignBlock.intendationColumn)
            .concat(FormatterSettings.casing! ? SyntaxNodeType.AssignKeyword : "assign")
            .concat(FormatterSettings.newLineAfterAssign() ? "\r\n" : " ")
            .concat(this.getAssigns(assignBlock))
            .concat(FormatterSettings.endDotLocationNew() ? "\r\n" : "")
            .concat(
                FormatterSettings.endDotLocationNew()
                    ? " ".repeat(
                          assignBlock.intendationColumn +
                              (FormatterSettings.endDotAlignment()
                                  ? FormatterSettings.newLineAfterAssign()
                                      ? 4
                                      : 7
                                  : 0)
                      )
                    : ""
            )
            .concat(".");
        return block;
    }

    private getAssigns(assignBlock: AssignBlock): string {
        let assigns: string = "";
        assignBlock.assignValues.forEach((assignLine) => {
            assigns = assigns.concat(
                " "
                    .repeat(
                        FormatterSettings.newLineAfterAssign()
                            ? assignBlock.intendationColumn + 4
                            : assigns === ""
                            ? 0
                            : assignBlock.intendationColumn + 7
                    )
                    .concat(assignLine.leftValue)
                    .concat(
                        FormatterSettings.alignRightExpression()
                            ? " ".repeat(
                                  assignBlock.longestLeft -
                                      assignLine.leftValue.length
                              )
                            : ""
                    )
                    .concat(" = ")
                    .concat(assignLine.rightValue)
                    .concat("\r\n")
            );
        });

        return assigns.trimEnd();
    }

    private isAssignment(value: SyntaxNode): boolean {
        return value.type === "assignment";
    }

    private isAssign(value: SyntaxNode): boolean {
        return value.type === SyntaxNodeType.AssignKeyword;
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
