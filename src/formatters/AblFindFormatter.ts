import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { AblFormatterCommon } from "./AblFormatterCommon";
import { MyRange } from "../model/MyRange";
import { Range, TextEdit } from "vscode";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class AblFindFormatter extends AAblFormatter implements IAblFormatter {
    // TODO find with current keyword structure
    private startColumn = 0;
    private recordValueColumn = 0;
    private findKey = ""; // FIND
    private findTypeKey = ""; // FIRST | LAST | NEXT | PREV
    private recordValue = "";
    private constantValue = "";
    private ofKey = ""; // OF
    private ofValue = "";
    private whereKey = ""; // WHERE
    private whereValue = "";
    private useIndexKey = ""; //USE-INDEX
    private useIndexValue = ""; //USE-INDEX
    // TODO USING
    private queryTuningLockKey = ""; // SHARE-LOCK | EXCLUSIVE-LOCK | NO-LOCK
    private queryTuningNoWaitKey = ""; // NO-WAIT
    private queryTuningNoPrefetchKey = ""; // NO-PREFETCH
    private queryTuningNoErrorKey = ""; // NO-ERROR

    private textEdit: TextEdit[] = [];

    private ablFormatterCommon: AblFormatterCommon = new AblFormatterCommon();

    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (node.type !== SyntaxNodeType.FindStatement) {
            return;
        }

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        this.collectFindStructure(node);

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

    clearSourceChanges(): void {
        this.textEdit.length = 0;
    }

    private collectFindStructure(node: SyntaxNode) {
        this.startColumn = node.startPosition.column;
        this.findKey = this.getFindKey(node);
        this.findTypeKey = this.getFindTypeKey(node);
        this.recordValue = this.getRecordValue(node, this.findTypeKey !== "");
        this.recordValueColumn = this.startColumn + 6 + this.findTypeKey.length;

        const whereNode = this.getWhereNode(node);

        if (whereNode !== undefined) {
            this.whereKey = this.getWhereKey(whereNode);

            this.whereValue = this.getPrettyWhereBlock(
                whereNode,
                "\r\n".concat(" ".repeat(this.recordValueColumn))
            );
        }

        this.assignQueryTuningStatements(node);
    }

    private getPrettyWhereBlock(node: SyntaxNode, separator: string): string {
        return this.ablFormatterCommon.getPrettyWhereBlock(node, separator);
    }

    private getExpressionString(node: SyntaxNode, separator: string): string {
        return this.ablFormatterCommon.getExpressionString(node, separator);
    }

    private getPrettyBlock(): string {
        const block = ""
            .concat(this.findKey)
            .concat(this.findTypeKey === "" ? "" : " ")
            .concat(this.findTypeKey.trim())
            .concat(this.recordValue === "" ? "" : " ")
            .concat(this.recordValue.trim())
            .concat(this.whereKey === "" ? "" : " ")
            .concat(this.whereKey.trim())
            .concat(this.whereValue === "" ? "" : " ")
            .concat(this.whereValue === "" ? " " : "\r\n")
            .concat(
                this.whereValue === "" ? "" : " ".repeat(this.recordValueColumn)
            )
            .concat(this.whereValue)
            .concat(this.whereValue === "" ? "" : "\r\n")
            .concat(
                this.whereValue === "" ? "" : " ".repeat(this.recordValueColumn)
            )
            .concat(this.queryTuningLockKey.trim())
            .concat(this.queryTuningNoWaitKey === "" ? "" : " ")
            .concat(this.queryTuningNoWaitKey.trim())
            .concat(this.queryTuningNoPrefetchKey === "" ? "" : " ")
            .concat(this.queryTuningNoPrefetchKey.trim())
            .concat(this.queryTuningNoErrorKey === "" ? "" : " ")
            .concat(this.queryTuningNoErrorKey.trim())
            .concat(".");
        return block;
    }

    private getFindKey(node: SyntaxNode): string {
        return this.ablFormatterCommon.getStatementKey(node, this.ablFormatterRunner);
    }

    private getFindTypeKey(node: SyntaxNode): string {
        const findTypeNode = node.child(1);

        if (findTypeNode === null) {
            return ""; // ERROR
        }

        if (this.ablFormatterRunner === undefined) {
            return ""; //ERROR
        }

        if (
            findTypeNode.type === SyntaxNodeType.FirstKeyword ||
            findTypeNode.type === SyntaxNodeType.LastKeyword ||
            findTypeNode.type === SyntaxNodeType.NextKeyword ||
            findTypeNode.type === SyntaxNodeType.PrevKeyword
        ) {
            return findTypeNode.text;
        } else {
            return ""; //EMPTY
        }
    }

    private getRecordValue(node: SyntaxNode, isSecond: boolean): string {
        return this.ablFormatterCommon.getRecordValue(node, isSecond, this.ablFormatterRunner);
    }

    private getWhereNode(node: SyntaxNode): SyntaxNode | undefined {
        return this.ablFormatterCommon.getNodeByType(node, SyntaxNodeType.WhereClause);
    }

    private getWhereKey(whereNode: SyntaxNode): string {
        return this.ablFormatterCommon.getKeyByType(whereNode, SyntaxNodeType.WhereKeyword, this.ablFormatterRunner);
    }

    private assignQueryTuningStatements(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (this.ablFormatterRunner === undefined) {
                return; //ERROR
            }

            if (child.type !== SyntaxNodeType.QueryTuning) {
                return;
            }

            const tuneNode = child.child(0);

            if (tuneNode === null) {
                return ""; // ERROR
            }

            const text = tuneNode.text;

            switch (tuneNode.type) {
                case SyntaxNodeType.ShareLockKeyword:
                case SyntaxNodeType.ExclLockKeyword:
                case SyntaxNodeType.NoLockKeyword: {
                    this.queryTuningLockKey = text;
                    break;
                }
                case SyntaxNodeType.NoWaitKeyword: {
                    this.queryTuningNoWaitKey = text;
                    break;
                }
                case SyntaxNodeType.NoPrefetchKeyword: {
                    this.queryTuningNoPrefetchKey = text;
                    break;
                }
                case SyntaxNodeType.NoErrorKeyword: {
                    this.queryTuningNoErrorKey = text;
                    break;
                }
            }
        });
    }
}
