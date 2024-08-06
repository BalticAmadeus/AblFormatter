import { SyntaxNode } from "web-tree-sitter";
import { CodeEdit, FullText } from "./FormattingEngine";

export interface IFormatter {
    match(node: Readonly<SyntaxNode>): boolean;
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined;
}
