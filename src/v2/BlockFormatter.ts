import { SyntaxNode } from "web-tree-sitter";
import { AFormatter } from "./AFormatter";
import { FullText, CodeEdit } from "./FormattingEngine";
import { IFormatter } from "./IFormatter";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class BlockFormater extends AFormatter implements IFormatter {
    match(node: Readonly<SyntaxNode>): boolean {
        let found: boolean = false;

        if (
            node.type === SyntaxNodeType.Body ||
            node.type === SyntaxNodeType.CaseBody
        ) {
            found = true;
        }

        if (node.parent?.type === "method_definition") {
            found = false;
        }

        return found;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        let indentationEdits: IndentationEdits[] = [];

        const parent = node.parent;

        if (parent === null) {
            return undefined;
        }

        const parentIndentation = parent.startPosition.column;
        const indentationStep = 4;
        const blockStatementsStartRows = node.children.map(
            (node) => node.startPosition.row
        );

        const codeLines = this.getCurrentText(parent, fullText)
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
                    this.countLeadingSpaces(codeLine);

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

        const lastLine = this.getCurrentText(parent, fullText)
            .split("\n")
            .slice(-1)[0];

        const endNode = parent.children.find(
            (node) => node.type === SyntaxNodeType.EndKeyword
        );

        if (endNode !== undefined) {
            const endRowDelta =
                parentIndentation - this.countLeadingSpaces(lastLine);

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
        const text = this.getCurrentText(node, fullText);
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

    private countLeadingSpaces(str: string): number {
        return str.length - str.trimStart().length;
    }
}

interface IndentationEdits {
    line: number;
    lineChangeDelta: number;
}
