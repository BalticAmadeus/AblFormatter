import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "./IFormatter";
import { SyntaxNodeType } from "../../model/SyntaxNodeType";
import { CodeEdit } from "../model/CodeEdit";
import { FullText } from "../model/FullText";
import { FormatterHelper } from "../FormatterHelper";
import { AFormatter } from "./AFormatter";
import { RegisterFormatter2 } from "../formatterDecorator";

@RegisterFormatter2
export class AssignFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "assignFormatting";

    public match(node: Readonly<SyntaxNode>): boolean {
        let found: boolean = false;

        if (
            node.type === SyntaxNodeType.Body ||
            node.type === SyntaxNodeType.CaseBody ||
            node.type === SyntaxNodeType.ClassBody
        ) {
            found = true;
        }

        return found;
    }
    public parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        let indentationEdits: IndentationEdits[] = [];

        let parent = this.getParent(node);

        if (parent === null) {
            return undefined;
        }

        const parentIndentation = FormatterHelper.getActualStatementIndentation(
            parent,
            fullText
        );

        const indentationStep = 4;
        const blockStatementsStartRows = node.children.map(
            (node) =>
                node.startPosition.row +
                FormatterHelper.getActualTextRow(
                    FormatterHelper.getCurrentText(node, fullText)
                )
        );

        const codeLines = FormatterHelper.getCurrentText(parent, fullText)
            .split("\n")
            .slice(0, -1);

        let n = 0;
        let lineChangeDelta = 0;
        codeLines.forEach((codeLine, index) => {
            const lineNumber = parent.startPosition.row + index;

            // adjust delta
            if (blockStatementsStartRows[n] === lineNumber) {
                lineChangeDelta =
                    parentIndentation +
                    indentationStep -
                    FormatterHelper.getActualTextIndentation(codeLine);

                n++;
            }

            // add edits
            if (lineChangeDelta !== 0) {
                indentationEdits.push({
                    line: index,
                    lineChangeDelta: lineChangeDelta,
                });
            }
        });

        const lastLine = FormatterHelper.getCurrentText(parent, fullText)
            .split("\n")
            .slice(-1)[0];

        const endNode = parent.children.find(
            (node) => node.type === SyntaxNodeType.EndKeyword
        );

        if (endNode !== undefined) {
            const endRowDelta =
                parentIndentation -
                FormatterHelper.getActualTextIndentation(lastLine);

            if (endRowDelta !== 0) {
                indentationEdits.push({
                    line: parent.endPosition.row - parent.startPosition.row,
                    lineChangeDelta: endRowDelta,
                });
            }
        }

        return this.getCodeEditsFromIndentationEdits(
            parent,
            fullText,
            indentationEdits
        );
    }

    private getCodeEditsFromIndentationEdits(
        node: SyntaxNode,
        fullText: FullText,
        indentationEdits: IndentationEdits[]
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        const newtext = this.applyIndentationEdits(text, indentationEdits);
        const diff = newtext.length - text.length;

        return {
            text: newtext,
            edit: {
                startIndex: node.startIndex,
                oldEndIndex: node.endIndex,
                startPosition: node.startPosition,
                oldEndPosition: node.endPosition,
                newEndIndex: node.endIndex + diff,
                newEndPosition: {
                    column: node.endPosition.column + Math.max(diff, 0),
                    row: node.endPosition.row,
                },
            },
        };
    }

    private applyIndentationEdits(
        code: string,
        edits: IndentationEdits[]
    ): string {
        // Split the code into lines
        const lines = code.split("\n");

        // Apply each edit
        edits.forEach((edit) => {
            const { line, lineChangeDelta } = edit;

            // Ensure the line number is within the range
            if (line >= 0 && line < lines.length) {
                const currentLine = lines[line];
                // Count current leading spaces
                const currentLeadingSpaces =
                    RegExp(/^\s*/).exec(currentLine)?.[0].length || 0;
                // Calculate new indentation

                const newLeadingSpaces = Math.max(
                    0,
                    currentLeadingSpaces + lineChangeDelta
                );

                // Update the line with the new indentation

                lines[line] =
                    " ".repeat(newLeadingSpaces) + currentLine.trimStart();
            }
        });

        // Join the lines back into a single string
        return lines.join("\n");
    }

    // private countLeadingSpaces(str: string): number {
    //     return str.length - str.trimStart().length;
    // }

    private getParent(node: SyntaxNode): SyntaxNode | null {
        let parent = node.parent;

        if (parent === null) {
            return null;
        }

        if (
            parent.type === "do_block" &&
            parent.parent?.type === "if_statement"
        ) {
            return parent.parent;
        }

        return parent;
    }
}

interface IndentationEdits {
    line: number;
    lineChangeDelta: number;
}
