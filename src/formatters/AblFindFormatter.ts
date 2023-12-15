import { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { AAblFormatter } from "./AAblFormatter";
import { IAblFormatter } from "./IAblFormatter";
import { MyRange } from "../model/MyRange";
import { Range, TextEdit } from "vscode";

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

    protected getSelf(): IAblFormatter {
        return this;
    }

    parseNode(node: SyntaxNode): void {
        if (node.type !== "find_statement") {
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

    private collectFindStructure(node: SyntaxNode) {
        this.startColumn = node.startPosition.column;
        this.findKey = this.getFindKey(node);
        this.findTypeKey = this.getFindTypeKey(node);
        this.recordValue = this.getRecordValue(node, this.findTypeKey !== "");
        this.recordValueColumn = this.startColumn + 6 + this.findTypeKey.length;

        const whereNode = this.getWhereNode(node, this.findTypeKey !== "");

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
        const findNode = node.child(0);

        if (findNode === null) {
            return ""; // ERROR
        }

        if (this.ablFormatterRunner === undefined) {
            return ""; //ERROR
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(findNode));
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
            findTypeNode.type === "FIRST" ||
            findTypeNode.type === "LAST" ||
            findTypeNode.type === "NEXT" ||
            findTypeNode.type === "PREV"
        ) {
            return this.ablFormatterRunner
                .getDocument()
                .getText(new MyRange(findTypeNode));
        } else {
            return ""; //EMPTY
        }
    }

    private getRecordValue(node: SyntaxNode, isSecond: boolean): string {
        const recordValue = isSecond ? node.child(2) : node.child(1);

        if (recordValue === null) {
            return ""; // ERROR
        }

        if (this.ablFormatterRunner === undefined) {
            return ""; //ERROR
        }

        if (recordValue.type !== "identifier") {
            return ""; //ERROR
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(recordValue));
    }

    private getWhereNode(
        node: SyntaxNode,
        isThird: boolean
    ): SyntaxNode | undefined {
        const whereNode = isThird ? node.child(3) : node.child(2);

        if (whereNode === null) {
            return undefined;
        }

        if (whereNode.type !== "where_clause") {
            return undefined;
        }

        return whereNode;
    }

    private getWhereKey(whereNode: SyntaxNode): string {
        const whereKey = whereNode.child(0);

        if (whereKey === null) {
            return ""; // ERROR
        }

        if (this.ablFormatterRunner === undefined) {
            return ""; //ERROR
        }

        if (whereKey.type !== "WHERE") {
            return ""; //ERROR
        }

        return this.ablFormatterRunner
            .getDocument()
            .getText(new MyRange(whereKey));
    }

    private assignQueryTuningStatements(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (this.ablFormatterRunner === undefined) {
                return; //ERROR
            }

            if (child.type !== "query_tuning") {
                return;
            }

            const tuneNode = child.child(0);

            if (tuneNode === null) {
                return ""; // ERROR
            }

            const text = this.ablFormatterRunner
                .getDocument()
                .getText(new MyRange(tuneNode));

            switch (tuneNode.type) {
                case "SHARE-LOCK":
                case "EXCLUSIVE-LOCK":
                case "NO-LOCK": {
                    this.queryTuningLockKey = text;
                    break;
                }
                case "NO-WAIT": {
                    this.queryTuningNoWaitKey = text;
                    break;
                }
                case "NO-PREFETCH": {
                    this.queryTuningNoPrefetchKey = text;
                    break;
                }
                case "NO-ERROR": {
                    this.queryTuningNoErrorKey = text;
                    break;
                }
            }
        });
    }
}
