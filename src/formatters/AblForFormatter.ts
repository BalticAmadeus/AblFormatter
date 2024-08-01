import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { AblFormatterCommon } from "./AblFormatterCommon";
import { Range, TextEdit } from "vscode";
import { SyntaxNodeType } from "../model/SyntaxNodeType";
import { FormatterSettings } from "../model/FormatterSettings";

export class AblForFormatter extends AAblFormatter implements IAblFormatter {
    private startColumn = 0;
    private recordValueColumn = 0;
    private forBlockValueColumn = 0;
    private tab = FormatterSettings.tabSize();
    private forKey = ""; // FOR
    private forTypeKey = ""; // EACH | FIRST | LAST
    private recordValue = "";
    private byValue = ""; // BY
    private whereKey = ""; // WHERE
    private whereValue = "";
    private forBodyValue = "";
    private useIndexValue = ""; //USE-INDEX
    private queryTuningLockKey = ""; // SHARE-LOCK | EXCLUSIVE-LOCK | NO-LOCK
    private queryTuningNoPrefetchKey = ""; // NO-PREFETCH
    private endValue = "";

    private textEdit: TextEdit[] = [];

    private ablFormatterCommon: AblFormatterCommon = new AblFormatterCommon();

    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (node.type !== SyntaxNodeType.ForStatement) {
            return;
        }

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        this.collectForStructure(node);

        const newBlock = this.getPrettyBlock();

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

    private collectForStructure(node: SyntaxNode) {
        this.startColumn = node.startPosition.column;
        this.forKey = this.getForKey(node);
        this.forTypeKey = this.getForTypeKey(node);
        this.recordValue = this.getRecordValue(node, this.forTypeKey !== "");
        this.recordValueColumn = this.startColumn + this.forKey.length + this.forTypeKey.length + 1; // +1 is a space between FOR EACH
        this.forBlockValueColumn = this.startColumn + this.tab;

        this.assignQueryTuningStatements(node);

        const whereNode = this.getWhereNode(node);

        if (whereNode !== undefined) {
            this.whereKey = this.getWhereKey(whereNode);

            this.whereValue = this.getPrettyWhereBlock(whereNode, "\r\n".concat(" ".repeat(this.recordValueColumn)));
        }

        this.assignByValue(node);

        const bodyNode = this.getForBodyNode(node);

        if (bodyNode !== undefined) {
            this.forBodyValue = this.getPrettyBodyBlock(bodyNode, "\r\n".concat(" ".repeat(this.forBlockValueColumn))
            );
        }

        this.assignEndValue(node);
    }

    private getForTypeKey(node: SyntaxNode): string {
        const forTypeNode = node.child(1);

        if (forTypeNode === null) {
            return "";
        }

        if (this.ablFormatterRunner === undefined) {
            return "";
        }

        if (
            forTypeNode.type === SyntaxNodeType.EachKeyword ||
            forTypeNode.type === SyntaxNodeType.FirstKeyword ||
            forTypeNode.type === SyntaxNodeType.LastKeyword
        ) {
            return forTypeNode.text;
        } else {
            return "";
        }
    }

    private getForKey(node: SyntaxNode): string {
        return this.ablFormatterCommon.getStatementKey(node, this.ablFormatterRunner);
    }

    private getRecordValue(node: SyntaxNode, isSecond: boolean): string {
        return this.ablFormatterCommon.getRecordValue(node, isSecond, this.ablFormatterRunner);
    }

    private assignQueryTuningStatements(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (this.ablFormatterRunner === undefined) {
                return;
            }

            if (child.type !== SyntaxNodeType.QueryTuning) {
                return;
            }

            const tuneNode = child.child(0);

            if (tuneNode === null) {
                return "";
            }

            const text = tuneNode.text;

            switch (tuneNode.type) {
                case SyntaxNodeType.ShareLockKeyword:
                case SyntaxNodeType.ExclLockKeyword: {
                    this.queryTuningLockKey = text;
                    break;
                }
                case SyntaxNodeType.NoLockKeyword: {
                    this.queryTuningLockKey = text;
                    break;
                }
                case SyntaxNodeType.NoPrefetchKeyword: {
                    this.queryTuningNoPrefetchKey = text;
                    break;
                }
            }
        });
    }

    private getWhereNode(node: SyntaxNode): SyntaxNode | undefined {
        return this.ablFormatterCommon.getNodeByType(node, SyntaxNodeType.WhereClause);
    }

    private getWhereKey(whereNode: SyntaxNode): string {
        return this.ablFormatterCommon.getKeyByType(whereNode, SyntaxNodeType.WhereKeyword, this.ablFormatterRunner);
    }

    private getPrettyWhereBlock(node: SyntaxNode, separator: string): string {
        return this.ablFormatterCommon.getPrettyWhereBlock(node, separator);
    }

    private assignByValue(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type !== SyntaxNodeType.SortClause) {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const byNode = child;

            if (byNode === null) {
                return "";
            }

            this.byValue = byNode.text;

        });
    }

    private getForBodyNode(node: SyntaxNode): SyntaxNode | undefined {
        return this.ablFormatterCommon.getNodeByType(node, SyntaxNodeType.Body);
    }

    private getPrettyBodyBlock(node: SyntaxNode, separator: string): string {
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
                bodyNode.text
                + separator;
        });

        return resultString;
    }

    private assignEndValue(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type !== SyntaxNodeType.EndKeyword) {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const endNode = child;

            if (endNode === null) {
                return "";
            }

            this.endValue = endNode.text;

        });
    }

    private getExpressionString(node: SyntaxNode, separator: string): string {
        return this.ablFormatterCommon.getExpressionString(node, separator);
    }

    private getPrettyBlock(): string {
        const block = ""
            .concat(this.forKey)
            .concat(this.forTypeKey === "" ? "" : " ")
            .concat(this.forTypeKey.trim())
            .concat(this.recordValue === "" ? "" : " ")
            .concat(this.recordValue.trim())
            .concat(this.queryTuningLockKey === "" ? "" : " ")
            .concat(this.queryTuningLockKey.trim())
            .concat(this.whereKey === "" ? "" : " ")
            .concat(this.whereKey.trim())
            .concat(this.whereValue === "" ? "" : " ")
            .concat(this.whereValue === "" ? " " : "\r\n")
            .concat(this.whereValue === "" ? "" : " ".repeat(this.recordValueColumn))
            .concat(this.whereValue.trim())
            .concat(this.byValue === "" ? "" : " ")
            .concat(this.byValue.trim())
            .concat(":")
            .concat(this.forBodyValue === "" ? " " : "\r\n")
            .concat(this.forBodyValue === "" ? "" : " ".repeat(this.forBlockValueColumn))
            .concat(this.forBodyValue.trim())
            .concat(this.queryTuningNoPrefetchKey === "" ? "" : " ")
            .concat(this.queryTuningNoPrefetchKey.trim())
            .concat("\r\n")
            .concat(" ".repeat(this.startColumn))
            .concat(this.endValue)
            .concat(".");
        return block;
    }
}
