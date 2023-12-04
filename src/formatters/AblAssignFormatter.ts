import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { MyRange } from "../model/MyRange";
import { Range, TextEdit } from "vscode";

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
            .concat("ASSIGN")
            .concat("\r\n")
            .concat(this.getAssigns(assignBlock))
            .concat(" ".repeat(assignBlock.intendationColumn))
            .concat(".");
        return block;
    }

    private getAssigns(assignBlock: AssignBlock): string {
        let assigns: string = "";
        assignBlock.assignValues.forEach((assignLine) => {
            assigns = assigns.concat(
                " "
                    .repeat(assignBlock.intendationColumn + 4)
                    .concat(assignLine.leftValue)
                    .concat(
                        " ".repeat(
                            assignBlock.longestLeft -
                                assignLine.leftValue.length
                        )
                    )
                    .concat(" = ")
                    .concat(assignLine.rightValue)
                    .concat("\r\n")
            );
        });

        return assigns;
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
