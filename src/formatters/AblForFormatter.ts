import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { MyRange } from "../model/MyRange";
import { Range, TextEdit } from "vscode";

export class AblForFormatter extends AAblFormatter implements IAblFormatter {
    private startColumn = 0;
    private recordValueColumn = 0;
    private forBlockValueColumn = 0;
    private tab = 4;
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

    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (node.type !== "for_statement") {
            return;
        }

        if (this.ablFormatterRunner === undefined) {
            return;
        }

        this.collectForStructure(node);

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

    private collectForStructure(node: SyntaxNode) {
        this.startColumn = node.startPosition.column;
        this.forKey = this.getForKey(node);
        this.forTypeKey = this.getForTypeKey(node);
        this.recordValue = this.getRecordValue(node);
        this.recordValueColumn = this.startColumn + this.forKey.length + this.forTypeKey.length + 1; // +1 is a space between FOR EACH
        this.forBlockValueColumn = this.startColumn + this.tab;

        this.assignQueryTuningStatements(node);

        const whereNode = this.getWhereNode(node);

        if (whereNode !== undefined) {
            this.whereKey = this.getWhereKey(whereNode);

            this.whereValue = this.getPrettyWhereBlock(
                whereNode,
                "\r\n".concat(" ".repeat(this.recordValueColumn))
            );
        }

        this.assignByValue(node);
        this.assignforBodyValue(node);
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
            forTypeNode.type === "EACH" ||
            forTypeNode.type === "FIRST" ||
            forTypeNode.type === "LAST"
        ) {
            return this.ablFormatterRunner
                .getDocument()
                .getText(new MyRange(forTypeNode));
        } else {
            return "";
        }
    }

    private getForKey(node: SyntaxNode): string {
        const forNode = node.child(0);

        if (forNode === null) {
            return "";
        }

        if (this.ablFormatterRunner === undefined) {
            return "";
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(forNode));
    }

    private getRecordValue(node: SyntaxNode): string {
        const recordValue = node.child(2);

        if (recordValue === null) {
            return "";
        }

        if (this.ablFormatterRunner === undefined) {
            return "";
        }

        if (recordValue.type !== "identifier") {
            return "";
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(recordValue));
    }

    private assignQueryTuningStatements(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (this.ablFormatterRunner === undefined) {
                return;
            }

            if (child.type !== "query_tuning") {
                return;
            }

            const tuneNode = child.child(0);

            if (tuneNode === null) {
                return "";
            }

            const text = this.ablFormatterRunner
                .getDocument()
                .getText(new MyRange(tuneNode));

            switch (tuneNode.type) {
                case "SHARE-LOCK":
                case "EXCLUSIVE-LOCK": {
                    this.queryTuningLockKey = text;
                    break;
                }
                case "NO-LOCK": {
                    this.queryTuningLockKey = text;
                    break;
                }
                case "NO-PREFETCH": {
                    this.queryTuningNoPrefetchKey = text;
                    break;
                }
            }
        });
    }

    private getWhereNode(node: SyntaxNode): SyntaxNode | undefined {
        let whereNode;

        node.children.forEach((child) => {
            if (child.type !== "where_clause") {
                return;
            }

            whereNode = child;

            if (whereNode === null) {
                return;
            }

        });

        return whereNode;
    }

    private getWhereKey(whereNode: SyntaxNode): string {
        const whereKey = whereNode.child(0);

        if (whereKey === null) {
            return "";
        }

        if (this.ablFormatterRunner === undefined) {
            return "";
        }

        if (whereKey.type !== "WHERE") {
            return "";
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(whereKey));
    }

    private getPrettyWhereBlock(node: SyntaxNode, separator: string): string {
        const logicalExpression = node.child(1);
        let resultString = "";

        if (logicalExpression === null) {
            return node.text.trim();
        }

        if (logicalExpression.type !== "logical_expression") {
            return logicalExpression.text.trim();
        }

        logicalExpression.children.forEach((child) => {
            resultString = resultString.concat(
                this.getExpressionString(child, separator)
            );
        });

        return resultString.replace(" (", "(");
    }

    private assignByValue(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type !== "sort_clause") {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const byNode = child;

            if (byNode === null) {
                return "";
            }

            this.byValue = this.ablFormatterRunner
                        .getDocument()
                        .getText(new MyRange(byNode));

        });
    }

    private assignforBodyValue(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type !== "body") {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const bodyNode = child.child(0);

            if (bodyNode === null) {
                return "";
            }

            this.forBodyValue = this.ablFormatterRunner
                        .getDocument()
                        .getText(new MyRange(bodyNode));

        });
    }

    private assignEndValue(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type !== "END") {
                return;
            }

            if (this.ablFormatterRunner === undefined) {
                return "";
            }

            const endNode = child;

            if (endNode === null) {
                return "";
            }

            this.endValue = this.ablFormatterRunner
                        .getDocument()
                        .getText(new MyRange(endNode));

        });
    }

    private getExpressionString(node: SyntaxNode, separator: string): string {
        switch (node.type) {
            case "comparison_expression": {
                return node.text.trim();
            }
            case "AND":
            case "OR": {
                return " ".concat(node.text.trim()).concat(separator);
            }
            case "parenthesized_expression": {
                let resultString = "";

                node.children.forEach((child) => {
                    child.children.forEach((child2) => {
                        resultString = resultString.concat(
                            this.getExpressionString(child2, separator)
                        );
                    });
                });

                return "(".concat(resultString).concat(")");
            }
        }

        return "";
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
            .concat(this.forBodyValue)
            .concat(this.queryTuningNoPrefetchKey === "" ? "" : " ")
            .concat(this.queryTuningNoPrefetchKey.trim())
            .concat("\r\n")
            .concat(" ".repeat(this.startColumn))
            .concat(this.endValue)
            .concat(".");
        return block;
    }

}
