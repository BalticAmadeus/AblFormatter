import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { EmptyBlockSettings } from "./EmptyBlockSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class EmptyBlockFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "emptyBlockFormatting";
    private readonly settings: EmptyBlockSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new EmptyBlockSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        // Special case for ON DO block
        if (node.type === SyntaxNodeType.DoBlock) {
            if (
                node.parent !== null &&
                node.parent.type === SyntaxNodeType.OnStatement
            ) {
                return false;
            }
        }

        // If the node is not a block type, do not match
        if (
            node.type !== SyntaxNodeType.DoBlock &&
            node.type !== SyntaxNodeType.ClassStatement &&
            node.type !== SyntaxNodeType.CatchStatement &&
            node.type !== SyntaxNodeType.ConstructorDefinition &&
            node.type !== SyntaxNodeType.DestructorDefinition &&
            node.type !== SyntaxNodeType.ForStatement &&
            node.type !== SyntaxNodeType.FinallyStatement &&
            node.type !== SyntaxNodeType.OnStatement &&
            node.type !== SyntaxNodeType.RepeatStatement &&
            node.type !== SyntaxNodeType.MethodDefinition &&
            node.type !== SyntaxNodeType.FunctionStatement &&
            node.type !== SyntaxNodeType.ProcedureStatement &&
            node.type !== SyntaxNodeType.Getter &&
            node.type !== SyntaxNodeType.Setter
        ) {
            return false;
        }

        // Do not match if there is a body inside the block
        for (let child of node.children) {
            if (
                child.type === SyntaxNodeType.Body ||
                child.type === SyntaxNodeType.CaseBody ||
                child.type === SyntaxNodeType.ClassBody
            ) {
                return false;
            }
        }
        return true;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);

        const statementIndentation =
            FormatterHelper.getActualStatementIndentation(node, fullText);

        const lastLine = FormatterHelper.getCurrentText(node, fullText)
            .split(fullText.eolDelimiter)
            .slice(-1)[0];

        let formattingOnStatement = false;
        // Special case for ON DO block: to find the end keyword, we need to search for it from the start of the DO block
        if (node.type === SyntaxNodeType.OnStatement) {
            const doNode = node.children.find(
                (child) => child.type === SyntaxNodeType.DoBlock
            );
            if (doNode === undefined) {
                return undefined;
            }
            node = doNode;
            formattingOnStatement = true;
        }

        const endNode = node.children.find(
            (child) => child.type === SyntaxNodeType.EndKeyword
        );

        if (endNode === undefined) {
            return undefined;
        }

        if (formattingOnStatement) {
            // REturn back to ON statement from the DO block
            if (node.parent === null) {
                return undefined;
            }
            node = node.parent;
        }

        const endRowDelta =
            statementIndentation -
            FormatterHelper.getActualTextIndentation(lastLine, fullText);

        const indentationEdit: IndentationEdits = {
            line: node.endPosition.row - node.startPosition.row,
            lineChangeDelta: endRowDelta,
        };

        const newText = this.applyIndentationEdit(
            text,
            indentationEdit,
            fullText
        );

        return this.getCodeEdit(node, text, newText, fullText);
    }

    private applyIndentationEdit(
        code: string,
        indentationEdit: IndentationEdits,
        fullText: FullText
    ): string {
        const lines = code.split(fullText.eolDelimiter);

        const currentLeadingSpaces =
            RegExp(/^\s*/).exec(lines[indentationEdit.line])?.[0].length || 0;
        const newLeadingSpaces = Math.max(
            0,
            currentLeadingSpaces + indentationEdit.lineChangeDelta
        );

        lines[indentationEdit.line] =
            " ".repeat(newLeadingSpaces) +
            lines[indentationEdit.line].trimStart();

        return lines.join(fullText.eolDelimiter);
    }
}

interface IndentationEdits {
    line: number;
    lineChangeDelta: number;
}
