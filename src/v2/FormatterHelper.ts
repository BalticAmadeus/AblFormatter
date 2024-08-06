import { SyntaxNode } from "web-tree-sitter";
import { FullText } from "./model/FullText";

export class FormatterHelper {
    public static getActualTextIndentation(input: string): number {
        // Use a regular expression to match leading whitespace and new lines
        const match = input.match(/^\s*\n\s*/);
        console.log(input, match);
        if (match) {
            // Get the last part of the match after the last new line
            const lastNewLineIndex = match[0].lastIndexOf("\n");
            const leadingSpaces = match[0].slice(lastNewLineIndex + 1);
            // Return the number of spaces after the last new line
            return leadingSpaces.length;
        }
        // Return 0 if there are no leading spaces and new lines before text starts
        return input.length - input.trimStart().length;
    }

    public static getActualTextRow(input: string): number {
        let newLineCount = 0;
        let encounteredNonWhitespace = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (char === "\n") {
                newLineCount++;
            } else if (!/\s/.test(char)) {
                encounteredNonWhitespace = true;
                break;
            }
        }

        console.log(input, encounteredNonWhitespace, newLineCount);
        return encounteredNonWhitespace ? newLineCount : 0;
    }

    public static getActualStatementIndentation(
        node: SyntaxNode,
        fullText: FullText
    ): number {
        const nodeText = FormatterHelper.getCurrentText(node, fullText);

        if (nodeText.match(/^[^\s]/)) {
            return node.startPosition.column;
        }

        // Use a regular expression to match leading whitespace and new lines
        const match = nodeText.match(/^\s*\n\s*/);
        if (match) {
            // Get the last part of the match after the last new line
            const lastNewLineIndex = match[0].lastIndexOf("\n");
            const leadingSpaces = match[0].slice(lastNewLineIndex + 1);
            // Return the number of spaces after the last new line
            return leadingSpaces.length;
        }
        // Return 0 if there are no leading spaces and new lines before text starts
        return nodeText.length - nodeText.trimStart().length;
    }

    public static getCurrentText(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): string {
        if (node !== undefined && fullText !== undefined) {
            return fullText.text.substring(node.startIndex, node.endIndex);
        }
        return "";
    }
}
