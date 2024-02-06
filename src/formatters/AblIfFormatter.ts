import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { Range, TextEdit } from "vscode";
import { FormatterSettings } from "../model/FormatterSettings";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class AblIfFormatter extends AAblFormatter implements IAblFormatter {
    private startColumn = 0;
    private ifBlockValueColumn = 0;
    private ifBodyValue = "";

    private textEdit: TextEdit[] = [];
    
    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (!FormatterSettings.ifFormatting()) {
            return;
        }

        if (node.type !== SyntaxNodeType.IfStatement) {
            return;
        }

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        this.collectIfStructure(node);

        const newBlock = this.getPrettyBlock();

        console.log("newBlock", newBlock);
        console.log("pos", node.startPosition);
        console.log("pos", node.endPosition);

        if (
            this.ablFormatterRunner
                .getDocument()
                .getText(
                    new Range(
                        node.startPosition.row,
                        node.startPosition.column,
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
                    node.startPosition.column,
                    node.endPosition.row,
                    node.endPosition.column
                ),
                newBlock
            )
        );
    }

    getSourceChanges(): SourceChanges {
        return {
            textEdits: this.textEdit,
        };
    }

    private collectIfStructure(node: SyntaxNode) {
        this.startColumn        = node.startPosition.column;
        this.ifBlockValueColumn = this.startColumn + FormatterSettings.tabSize();
        this.ifBodyValue        = this.getCaseBodyBranchBlock(node);
    }

    private getCaseBodyBranchBlock(node: SyntaxNode): string {
        let resultString = "";
        let doBlock = false;

        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.DoBlock) {
                doBlock = true;
            }
        });
        
        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getIfExpressionString(child, "\r\n".concat(" ".repeat(this.ifBlockValueColumn)), doBlock)
            );
        });

        return resultString.trim();
    }

    private getIfExpressionString(node: SyntaxNode, separator: string, doBlock: boolean): string {
        switch (node.type.trim()) {
            case SyntaxNodeType.ThenKeyword:
                if (doBlock) {
                    return node.text;
                } else {
                    return ` ${node.text.trim()}${separator}`;
                }
            case SyntaxNodeType.ElseKeyword:
                if (doBlock) {
                    return node.text;
                } else {
                    return `${node.text.trim()}${separator}`;
                }
            case SyntaxNodeType.DoBlock:
                let resultString = "";

                node.children.forEach((child) => {
                    if (child.type === SyntaxNodeType.Body) {
                        resultString = (FormatterSettings.casing() ? " DO:" : " do:") + 
                                       "\r\n".concat(" ".repeat(this.ifBlockValueColumn)) + 
                                       child.text + 
                                       "\r\n".concat(" ".repeat(this.startColumn)) + 
                                       (FormatterSettings.casing() ? "END." : "end.") + 
                                       "\r\n".concat(" ".repeat(this.startColumn));
                    }
                });

                return resultString;
            case SyntaxNodeType.AblStatement:
                return node.text + "\r\n".concat(" ".repeat(this.startColumn));
            case SyntaxNodeType.ElseStatement:
                let resultElseString = "";
                let doElseBlock = false;

                node.children.forEach((child) => {
                    if (child.type === SyntaxNodeType.DoBlock) {
                        doElseBlock = true;
                    }
                });

                node.children.forEach((child) => {
                    resultElseString = resultElseString.concat(
                        this.getIfExpressionString(child, "\r\n".concat(" ".repeat(this.ifBlockValueColumn)), doElseBlock)
                    );
                });

                return resultElseString;
            case SyntaxNodeType.LogicalExpression:
                let resultLogicalExString = "";

                node.children.forEach((child) => {
                    resultLogicalExString = resultLogicalExString.concat(
                        this.getIfExpressionString(child, "\r\n".concat(" ".repeat(this.startColumn + 3)), false)
                    );
                });

                return resultLogicalExString;
            case SyntaxNodeType.AndKeyword:
            case SyntaxNodeType.OrKeyword:
                return node.text + separator;
            default:
                return node.text;
        }
    }

    private getPrettyBlock(): string {
        return "".concat(this.ifBodyValue.trim());
    }
}
