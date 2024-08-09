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
        const assignments = node.children.filter(this.isAssignment);

        // for now, don't format assign statements with one assignment.
        if (assignments.length === 1) {
            return undefined;
        }

        let assingValues: AssingLine[] = [];
        let longestLeft = 0;
        const intendationColumn = FormatterHelper.getActualStatementIndentation(
            node.children.filter(this.isAssignKeyword)[0],
            fullText
        );

        assignments.forEach((assignment) => {
            const leftChild = assignment.child(0);
            const rightChild = assignment.child(2);

            if (leftChild === null || rightChild === null) {
                return;
            }

            const assignLine: AssingLine = {
                leftValue: FormatterHelper.getCurrentText(
                    leftChild,
                    fullText
                ).trim(),
                rightValue: FormatterHelper.getCurrentText(
                    rightChild,
                    fullText
                ).trim(),
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

        const text = FormatterHelper.getCurrentText(node, fullText);
        const newText = this.getPrettyBlock(assignBlock);
        return this.getCodeEdit(node, text, newText);
    }

    private getPrettyBlock(assignBlock: AssignBlock): string {
        const block = ""
            // .repeat(assignBlock.intendationColumn)
            .concat(
                this.settings.casing!
                    ? SyntaxNodeType.AssignKeyword
                    : SyntaxNodeType.AssignKeyword.toLowerCase()
            )
            .concat(this.settings.newLineAfterAssign() ? "\r\n" : " ")
            .concat(this.getAssigns(assignBlock))
            .concat(this.settings.endDotLocationNew() ? "\r\n" : "")
            .concat(
                this.settings.endDotLocationNew()
                    ? " ".repeat(
                          assignBlock.intendationColumn +
                              (this.settings.endDotAlignment()
                                  ? this.settings.newLineAfterAssign()
                                      ? this.settings.tabSize()
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
                        this.settings.newLineAfterAssign()
                            ? assignBlock.intendationColumn +
                                  this.settings.tabSize()
                            : assigns === ""
                            ? 0
                            : assignBlock.intendationColumn + 7
                    )
                    .concat(assignLine.leftValue)
                    .concat(
                        this.settings.alignRightExpression()
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
        return value.type === SyntaxNodeType.Assignment;
    }

    private isAssignKeyword(value: SyntaxNode): boolean {
        return value.type === SyntaxNodeType.AssignKeyword;
    }
}
