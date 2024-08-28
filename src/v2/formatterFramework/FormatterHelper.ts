import { SyntaxNode } from "web-tree-sitter";
import { FullText } from "../model/FullText";
import { SyntaxNodeType } from "../../model/SyntaxNodeType";

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

    public static collectExpression(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";

        if (node.type === SyntaxNodeType.ParenthesizedExpression) {
            node.children.forEach((child) => {
                resultString = resultString.concat(
                    this.getParenthesizedExpressionString(child, fullText)
                );
            });
            return resultString;
        } else {
            node.children.forEach((child) => {
                resultString = resultString.concat(
                    this.getExpressionString(child, fullText)
                );
            });
            if (node.type === SyntaxNodeType.Assignment) {
                // In this case, we need to trim the spaces at the start of the string as well
                return resultString.trimStart();
            }
            return resultString;
        }
    }

    public static getExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";
        switch (node.type) {
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

    public static getParenthesizedExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        let newString = "";
        switch (node.type) {
            case SyntaxNodeType.LeftParenthesis:
                newString =
                    " " + FormatterHelper.getCurrentText(node, fullText);
                break;
            default:
                newString = FormatterHelper.getCurrentText(
                    node,
                    fullText
                ).trim();
                break;
        }
        return newString;
    }
}
