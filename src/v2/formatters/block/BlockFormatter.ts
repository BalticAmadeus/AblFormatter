import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import {
    bodyBlockKeywords,
    SyntaxNodeType,
} from "../../../model/SyntaxNodeType";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { BlockSettings } from "./BlockSettings";

@RegisterFormatter
export class BlockFormater extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "blockFormatting";
    private readonly settings: BlockSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new BlockSettings(configurationManager);
    }

    public match(node: Readonly<SyntaxNode>): boolean {
        let found: boolean = false;

        if (bodyBlockKeywords.hasFancy(node.type, "")) {
            found = true;
        }

        return found;
    }
    public parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        let indentationEdits: IndentationEdits[] = [];

        let parent = node.parent;

        if (parent === null) {
            return undefined;
        }

        let formattingOnStatement = false;
        if (parent.type === SyntaxNodeType.DoBlock) {
            const grandParent = parent.parent;
            if (
                grandParent !== null &&
                grandParent.type === SyntaxNodeType.OnStatement
            ) {
                parent = grandParent;
                formattingOnStatement = true;
            }
        }

        const parentIndentation = FormatterHelper.getActualStatementIndentation(
            this.getParentIndentationSourceNode(parent),
            fullText
        );

        const indentationStep = this.settings.tabSize();
        const blockStatementsStartRows = node.children.map(
            (node) =>
                node.startPosition.row +
                FormatterHelper.getActualTextRow(
                    FormatterHelper.getCurrentText(node, fullText),
                    fullText
                )
        );

        const codeLines = FormatterHelper.getCurrentText(parent, fullText)
            .split(fullText.eolDelimiter)
            .slice(1, -1);

        let n = 0;
        let lineChangeDelta = 0;
        codeLines.forEach((codeLine, index) => {
            // the first line was removed, so index needs to be incremented
            index++;
            const lineNumber = parent.startPosition.row + index;

            // adjust delta
            if (blockStatementsStartRows[n] === lineNumber) {
                lineChangeDelta =
                    parentIndentation +
                    indentationStep -
                    FormatterHelper.getActualTextIndentation(
                        codeLine,
                        fullText
                    );

                n++;
            }

            if (lineChangeDelta !== 0) {
                indentationEdits.push({
                    line: index,
                    lineChangeDelta: lineChangeDelta,
                });
                console.log("change line: " + index);
            }
        });

        const lastLine = FormatterHelper.getCurrentText(parent, fullText)
            .split(fullText.eolDelimiter)
            .slice(-1)[0];

        if (this.matchEndPattern(lastLine)) {
            const parentOfEndNode = formattingOnStatement
                ? node.parent
                : parent;
            if (parentOfEndNode !== null) {
                const endNode = parentOfEndNode.children.find(
                    (node) => node.type === SyntaxNodeType.EndKeyword
                );

                if (endNode !== undefined) {
                    const endRowDelta =
                        parentIndentation -
                        FormatterHelper.getActualStatementIndentation(
                            endNode,
                            fullText
                        );

                    if (endRowDelta !== 0) {
                        indentationEdits.push({
                            line:
                                parent.endPosition.row -
                                parent.startPosition.row,
                            lineChangeDelta: endRowDelta,
                        });
                        console.log(
                            "change lineEnd: " +
                                (parent.endPosition.row -
                                    parent.startPosition.row)
                        );
                    }
                }
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
        const newText = this.applyIndentationEdits(
            text,
            indentationEdits,
            fullText
        );

        return this.getCodeEdit(node, text, newText, fullText);
    }

    private applyIndentationEdits(
        code: string,
        edits: IndentationEdits[],
        fullText: FullText
    ): string {
        // Split the code into lines
        const lines = code.split(fullText.eolDelimiter);

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
        return lines.join(fullText.eolDelimiter);
    }

    //refactor
    private getParentIndentationSourceNode(node: SyntaxNode): SyntaxNode {
        if (
            node.type === SyntaxNodeType.DoBlock &&
            node.parent?.type === SyntaxNodeType.IfStatement
        ) {
            return node.parent;
        } else if (
            node.type === SyntaxNodeType.DoBlock &&
            (node.parent?.type === SyntaxNodeType.CaseWhenBranch ||
                node.parent?.type === SyntaxNodeType.CaseOtherwiseBranch)
        ) {
            return node.parent;
        } else if (
            node.type === SyntaxNodeType.DoBlock &&
            (node.parent?.type === SyntaxNodeType.ElseIfStatement ||
                node.parent?.type === SyntaxNodeType.ElseStatement)
        ) {
            if (node.parent.parent === null) {
                return node.parent;
            }

            return node.parent.parent;
        }
        return node;
    }

    private matchEndPattern(str: string): boolean {
        /* Returns true if string matches the pattern: (any characters)end(any characters that do not include a dot).(any characters)
           In essence, it returns true on the case when on a line there is nothing but an end statement.
        */
        const pattern = /^.*end[^.]*\..*$/;
        return pattern.test(str);
    }
}

interface IndentationEdits {
    line: number;
    lineChangeDelta: number;
}
