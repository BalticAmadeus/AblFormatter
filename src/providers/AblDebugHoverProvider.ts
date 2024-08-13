import {
    CancellationToken,
    Hover,
    HoverProvider,
    MarkdownString,
    Position,
    ProviderResult,
    TextDocument,
} from "vscode";
import { AblFormatterProvider } from "./AblFormatterProvider";
import { Point, SyntaxNode, Tree } from "web-tree-sitter";

export class AblDebugHoverProvider implements HoverProvider {
    private ablFormatterProvider: AblFormatterProvider;

    public constructor(ablFormatterProvider: AblFormatterProvider) {
        this.ablFormatterProvider = ablFormatterProvider;
    }

    provideHover(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): ProviderResult<Hover> {
        if (this.ablFormatterProvider.result === undefined) {
            return new Hover("NO TREE YET!");
        }

        const point: Point = {
            row: position.line,
            column: position.character,
        };

        const node =
            this.ablFormatterProvider.result.tree.rootNode.descendantForPosition(
                point
            );

        return new Hover(
            "| ID | TYPE | START POS | END POS | INDEX | TEXT | \n | ---- | ---- | ---- | ---- | ---- | ---- | \n" +
                this.fillTreeWithAcendantsInfo(node, true)
        );
    }

    private fillTreeWithAcendantsInfo(
        node: SyntaxNode,
        isHead: boolean
    ): string {
        const str =
            "| " +
            node.id +
            " | " +
            node.type +
            " | " +
            node.startPosition.row +
            ":" +
            node.startPosition.column +
            " | " +
            node.endPosition.row +
            ":" +
            node.endPosition.column +
            " | " +
            node.startIndex +
            ":" +
            node.endIndex +
            " | " +
            node.text
                .replaceAll("\r\n", " ")
                .replaceAll("\n", " ")
                .substring(0, 200) +
            " | " +
            " \n";

        if (node.parent === null) {
            return "";
        }

        return str + this.fillTreeWithAcendantsInfo(node.parent, false);
    }
}
