/**
 * AblFormatterCommon - handles common formatting functionality for Formatters.
 *
 * @class
 */

import { SyntaxNode } from "web-tree-sitter";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { MyRange } from "../model/MyRange";
import { FormatterSettings } from "../model/FormatterSettings";
import { SyntaxNodeType } from "../model/SyntaxNodeType";

export class AblFormatterCommon {
    public getExpressionString(node: SyntaxNode, separator: string): string {
        switch (node.type) {
            case "comparison_expression":
                return node.text.trim();
            case "AND":
            case "OR":
                return ` ${node.text.trim()}${separator}`;
            case "parenthesized_expression":
                let resultString = "";

                node.children.forEach((child) => {
                    child.children.forEach((child2) => {
                        resultString += this.getExpressionString(child2, separator);
                    });
                });

                return `(${resultString})`;
            default:
                return "";
        }
    }

    public getRecordValue(node: SyntaxNode, isSecond: boolean, ablFormatterRunner: IAblFormatterRunner | undefined): string {
        const recordValue = isSecond ? node.child(2) : node.child(1);

        if (recordValue === null || ablFormatterRunner === undefined || recordValue.type !== "identifier") {
            return "";
        }

        return ablFormatterRunner.getDocument().getText(new MyRange(recordValue));
    }

    public getStatementKey(node: SyntaxNode, ablFormatterRunner: IAblFormatterRunner | undefined): string {
        const statementNode = node.child(0);

        if (statementNode === null || ablFormatterRunner === undefined) {
            return "";
        }

        return ablFormatterRunner.getDocument().getText(new MyRange(statementNode));
    }

    public getNodeByType(node: SyntaxNode, type: string): SyntaxNode | undefined {
        let nodeByType;

        node.children.forEach((child) => {
            if (child.type !== type) {
                return;
            }

            nodeByType = child;

            if (nodeByType === null) {
                return;
            }

        });

        return nodeByType;
    }

    public getKeyByType(whereNode: SyntaxNode, type: string, ablFormatterRunner: IAblFormatterRunner | undefined): string {
        const keyByType = whereNode.child(0);

        if (keyByType === null || ablFormatterRunner === undefined || keyByType.type !== type) {
            return "";
        }

        return ablFormatterRunner.getDocument().getText(new MyRange(keyByType));
    }

    public getPrettyWhereBlock(node: SyntaxNode, separator: string): string {
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

    public getDoBlock(node: SyntaxNode, blockValueColumn: number, startColumn: number): string {
        let resultString = "";

        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.Body) {
                resultString = (FormatterSettings.casing() ? " DO:" : " do:") + 
                               "\r\n".concat(" ".repeat(blockValueColumn)) + 
                               child.text + 
                               "\r\n".concat(" ".repeat(startColumn)) + 
                               (FormatterSettings.casing() ? "END." : "end.") + 
                               "\r\n".concat(" ".repeat(startColumn));
            }
        });
        
        return resultString;
    }
}