import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { Range, TextEdit } from "vscode";
import { FormatterSettings } from "../model/FormatterSettings";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class AblBlockFormatter extends AAblFormatter implements IAblFormatter {
    private currentIndentation = 0;
    private indentationSize = FormatterSettings.tabSize();
    private codeLineIndentations: number[] = []; // Position is equal to line number (starts with 0), IndentationLevel

    parseNode(node: SyntaxNode): void {
        if (!FormatterSettings.blockFormatting()) {
            return;
        }

        if (node.type === SyntaxNodeType.SourceCode) {
            this.codeLineIndentations = Array(node.endPosition.row + 1).fill(0);
        }

        if (this.isCodeBlock(node)) {
            if (node.type === SyntaxNodeType.CaseBody) {
                //Add 1 to case
                this.indentBlock(
                    node.startPosition.row + 1,
                    node.endPosition.row
                );
            } else {
                this.indentBlock(node.startPosition.row, node.endPosition.row);
            }
            return;
        }
    }

    private isCodeBlock(node: SyntaxNode): boolean {
        if (
            node.type === SyntaxNodeType.Body ||
            node.type === SyntaxNodeType.CaseBody ||
            node.type === SyntaxNodeType.ClassBody
        ) {
            const startLine = node.startPosition.row;
            const endLine = node.endPosition.row;

            // Check if the text is the same across the entire range
            //WTF
            // if (this.isTextSameAcrossRange(node.text, startLine, endLine)) {
            //     return true;
            // }
            return true;
        }

        return false;
    }

    private isTextSameAcrossRange(
        text: string,
        startLine: number,
        endLine: number
    ): boolean {
        const lineText = this.ablFormatterRunner
            ?.getDocument()
            .getText(new Range(startLine, 0, endLine, 10000));

        if (lineText === undefined || lineText.trim() !== text.trim()) {
            return false;
        }

        return true;
    }

    private indentBlock(startColumn: number, endColumn: number) {
        const lineArray: number[] = Array.from(
            { length: endColumn - startColumn + 1 },
            (_, index) => startColumn + index
        );

        lineArray.forEach((line) => {
            this.codeLineIndentations[line] += this.indentationSize;
        });
    }

    getSourceChanges(): SourceChanges {
        console.log(this.codeLineIndentations);

        let textEdits: TextEdit[] = [];
        this.codeLineIndentations.forEach((indentationLevel, index) => {
            const range = new Range(index, 0, index, 10000);

            textEdits.push(
                new TextEdit(range, this.getTrimedLine(indentationLevel, range))
            );
        });

        console.log(textEdits);
        return {
            textEdits: textEdits,
        };
    }

    clearSourceChanges(): void {
        let textEdits: TextEdit[] = [];
    }

    private getTrimedLine(indentationLevel: number, range: Range): string {
        const text = this.ablFormatterRunner?.getDocument().getText(range);
        if (text === undefined) {
            return "";
        }

        return " ".repeat(indentationLevel).concat(text.trim());
    }

    protected getSelf(): IAblFormatter {
        return this;
    }
}
