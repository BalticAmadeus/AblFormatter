import { Range } from "vscode";
import Parser from "web-tree-sitter";

export class MyRange extends Range {
    public constructor(node: Parser.SyntaxNode) {
        super(
            node.startPosition.row,
            node.startPosition.column,
            node.endPosition.row,
            node.endPosition.column
        );
    }
}
