import { SyntaxNode } from "web-tree-sitter";
import { FullText } from "./FormattingEngine";

export abstract class AFormatter {
    protected getCurrentText(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): string {
        if (node !== undefined && fullText !== undefined) {
            return fullText.text.substring(node.startIndex, node.endIndex);
        }
        return "";
    }
}
