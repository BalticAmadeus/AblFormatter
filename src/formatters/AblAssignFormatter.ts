import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { MyRange } from "../model/MyRange";
import { Range, TextEdit } from "vscode";
import { ConfigurationManager } from "../utils/ConfigurationManager";

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
        if (node.type !== "assign_statement") {
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
                leftValue: this.ablFormatterRunner
                    .getDocument()
                    .getText(new MyRange(leftChild))
                    .trim(),
                rightValue: this.ablFormatterRunner
                    .getDocument()
                    .getText(new MyRange(rightChild))
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
            console.log("SAME");
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

    private getPrettyBlock(assignBlock: AssignBlock): string {
        const block = " "
            .repeat(assignBlock.intendationColumn)
            .concat(ConfigurationManager.getCasing()! ? "ASSIGN" : "assign")
            .concat(this.newLineAfterAssign() ? "\r\n" : " ")
            .concat(this.getAssigns(assignBlock))
            .concat(this.endDotLocationNew() ? "\r\n" : "")
            .concat(
                this.endDotLocationNew()
                    ? " ".repeat(
                          assignBlock.intendationColumn +
                              (this.endDotAlignment()
                                  ? this.newLineAfterAssign()
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
                        this.newLineAfterAssign()
                            ? assignBlock.intendationColumn + 4
                            : assigns === ""
                            ? 0
                            : assignBlock.intendationColumn + 7
                    )
                    .concat(assignLine.leftValue)
                    .concat(
                        this.alignRightExpression()
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

    private newLineAfterAssign() {
        if (
            "New" === ConfigurationManager.get("assignFormattingAssignLocation")
        ) {
            return true;
        }
        return false;
    }

    private alignRightExpression() {
        if (
            "Yes" ===
            ConfigurationManager.get("assignFormattingAlignRightExpression")
        ) {
            return true;
        }
        return false;
    }

    private endDotLocationNew() {
        if (
            "New" ===
                ConfigurationManager.get("assignFormattingEndDotLocation") ||
            "New aligned" ===
                ConfigurationManager.get("assignFormattingEndDotLocation")
        ) {
            return true;
        }
        return false;
    }

    private endDotAlignment() {
        if (
            "New aligned" ===
            ConfigurationManager.get("assignFormattingEndDotLocation")
        ) {
            return true;
        }
        return false;
    }

    private isAssignment(value: SyntaxNode): boolean {
        return value.type === "assignment";
    }

    private isAssign(value: SyntaxNode): boolean {
        return value.type === "ASSIGN";
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
