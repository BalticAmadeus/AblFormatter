import { SyntaxNode } from "web-tree-sitter";
import { FullText } from "../model/FullText";

export class FormatterHelper {
    public static getActualTextIndentation(
        input: string,
        fullText: FullText
    ): number {
        // Use a regular expression to match leading whitespace and new lines
        const regex = new RegExp(`^\\s*${fullText.eolDelimiter}\\s*`);
        const match = input.match(regex);

        if (match) {
            // Get the last part of the match after the last new line
            const lastNewLineIndex = match[0].lastIndexOf(
                fullText.eolDelimiter
            );
            const leadingSpaces = match[0].slice(lastNewLineIndex + 1);
            // Return the number of spaces after the last new line
            return leadingSpaces.length;
        }
        // Return 0 if there are no leading spaces and new lines before text starts
        return input.length - input.trimStart().length;
    }

    public static getActualTextRow(input: string, fullText: FullText): number {
        let newLineCount = 0;
        let encounteredNonWhitespace = false;
        const eolDelimiter = fullText.eolDelimiter;

        for (let i = 0; i < input.length; i++) {
            if (input.substr(i, eolDelimiter.length) === eolDelimiter) {
                newLineCount++;
                i += eolDelimiter.length - 1;
            } else if (!/\s/.test(input[i])) {
                encounteredNonWhitespace = true;
                break;
            }
        }

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
        const regex = new RegExp(`^\\s*${fullText.eolDelimiter}\\s*`);
        const match = nodeText.match(regex);
        if (match) {
            // Get the last part of the match after the last new line
            const lastNewLineIndex = match[0].lastIndexOf(
                fullText.eolDelimiter
            );
            const leadingSpaces = match[0].slice(
                lastNewLineIndex + fullText.eolDelimiter.length
            );
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
