import { SourceChanges } from "../model/SourceChanges";
import Parser from "web-tree-sitter";

export interface IAblFormatter {
    parseNode(node: Parser.SyntaxNode): void;

    getSourceChanges(): SourceChanges;
}
