import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { AblFormatterCommon } from "./AblFormatterCommon";
import { Range, TextEdit } from "vscode";
import { FormatterSettings } from "../model/FormatterSettings";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class AblCaseFormatter extends AAblFormatter implements IAblFormatter {
    private startColumn = 0;
    private caseBlockValueColumn = 0;
    private caseBlockWhenValueColumn = 0;
    private caseKey = ""; // CASE
    private recordValue = "";
    private caseBodyValue = "";

    private textEdit: TextEdit[] = [];

    private ablFormatterCommon: AblFormatterCommon = new AblFormatterCommon();
    

    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (!FormatterSettings.caseFormatting()) {
            return;
        }

        if (node.type !== SyntaxNodeType.CaseStatement) {
            return;
        }

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        this.collectCaseStructure(node);

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

    private collectCaseStructure(node: SyntaxNode) {
        this.startColumn = node.startPosition.column;
        this.caseKey = this.getCaseKey(node);
        this.recordValue = this.getRecordValue(node, false);
        this.caseBlockValueColumn = this.startColumn + FormatterSettings.tabSize();
        this.caseBlockWhenValueColumn = this.startColumn + FormatterSettings.tabSize() +
            	                                           FormatterSettings.tabSize();

        const bodyNode = this.getCaseBodyNode(node);

        if (bodyNode !== undefined) {
            this.caseBodyValue = this.getCaseBodyBlock(bodyNode);
        }
    }

    private getCaseKey(node: SyntaxNode): string {
        return this.ablFormatterCommon.getStatementKey(node, this.ablFormatterRunner);
    }

    private getRecordValue(node: SyntaxNode, isSecond: boolean): string {
        return this.ablFormatterCommon.getRecordValue(node, isSecond, this.ablFormatterRunner);
    }

    private getCaseBodyNode(node: SyntaxNode): SyntaxNode | undefined {
        return this.ablFormatterCommon.getNodeByType(node, SyntaxNodeType.CaseBody);
    }

    private getCaseBodyBlock(node: SyntaxNode): string {
        let resultString = "";

        node.children.forEach((child) => {
            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const bodyNode = child;

            if (bodyNode === null) {
                return "";
            }

            resultString = resultString + 
                           this.getCaseBodyBranchBlock(bodyNode) + 
                           "\r\n".concat(" ".repeat(this.caseBlockValueColumn));
        });

        return resultString;
    }

    private getCaseBodyBranchBlock(node: SyntaxNode): string {
        let resultString = "";
        let doBlock = false;

        if (node.type === SyntaxNodeType.CaseWhenBranch || node.type === SyntaxNodeType.CaseOtherwiseBranch) {

            node.children.forEach((child) => {
                if (child.type === SyntaxNodeType.DoBlock) {
                    doBlock = true;
                }
            });
            
            node.children.forEach((child) => {
                resultString = resultString.concat(
                    this.getCaseExpressionString(child, "\r\n".concat(" ".repeat(this.caseBlockWhenValueColumn)), doBlock)
                );
            });
            
        }

        return resultString.trim();
    }

    private getCaseExpressionString(node: SyntaxNode, separator: string, doBlock: boolean): string {
        switch (node.type) {
            case SyntaxNodeType.ThenKeyword:
                if (doBlock) {
                    return node.text;
                } else {
                    return ` ${node.text.trim()}${separator}`;
                }
            case SyntaxNodeType.AndKeyword:
            case SyntaxNodeType.OrKeyword:
            case SyntaxNodeType.OtherwiseKeyword:
                return ` ${node.text.trim()}${separator}`;
            case SyntaxNodeType.DoBlock:
                return this.ablFormatterCommon.getDoBlock(node, this.caseBlockWhenValueColumn, this.caseBlockValueColumn);
            default:
                return node.text;
        }
    }

    private getPrettyBlock(): string {
        const block = ""
            .concat(this.caseKey.trim())
            .concat(" ")
            .concat(this.recordValue.trim())
            .concat(":")
            .concat(this.caseBodyValue === "" ? " " : "\r\n")
            .concat(this.caseBodyValue === "" ? "" : " ".repeat(this.caseBlockValueColumn))
            .concat(this.caseBodyValue.trim())
            .concat("\r\n")
            .concat(" ".repeat(this.startColumn))
            .concat(FormatterSettings.casing() ? "END CASE" : "end case")
            .concat(".");

        return block;
    }
}
