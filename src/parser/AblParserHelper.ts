import Parser, { Tree } from "web-tree-sitter";
import { IParserHelper } from "./IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { ParseResult } from "../model/ParseResult";
import path from "path";
import { commands, Range, StatusBarItem, ThemeColor, window } from "vscode";

export class AblParserHelper implements IParserHelper {
    private parser = new Parser();
    private trees = new Map<string, Parser.Tree>();
    private ablLanguagePromise: Promise<Parser.Language>;
    private statusBarItem?: StatusBarItem;

    public constructor(extensionPath: string, statusBarItem?: StatusBarItem) {
        this.statusBarItem = statusBarItem;
        this.ablLanguagePromise = Parser.Language.load(
            path.join(extensionPath, "resources/tree-sitter-abl.wasm")
        );

        this.ablLanguagePromise.then((abl) => {
            this.parser.setLanguage(abl);
            if (this.statusBarItem !== undefined) {
                this.statusBarItem.text = "Abl Formatter • Ready";
            }
        });
    }

    public async awaitLanguage(): Promise<void> {
        await this.ablLanguagePromise;
    }

    public parse(
        fileIdentifier: FileIdentifier,
        text: string,
        previousTree?: Tree
    ): ParseResult {
        const newTree = this.parser.parse(text, previousTree);
        let ranges: Parser.Range[];

        if (previousTree !== undefined) {
            ranges = previousTree.getChangedRanges(newTree);
        } else {
            ranges = []; // TODO
        }

        //this.trees.set(fileIdentifier.name, newTree);

        const result: ParseResult = {
            tree: newTree,
            ranges: ranges,
        };

        const a = window.createTextEditorDecorationType({
            backgroundColor: new ThemeColor("errorForeground"),
        });

        if (this.statusBarItem !== undefined) {
            const nodes = getNodesWithErrors(newTree.rootNode);
            this.statusBarItem.text =
                "Abl Formatter • " +
                nodes.length +
                " Parser Errors" +
                nodes[0].startPosition.row;

            if (nodes.length > 0) {
                this.statusBarItem.backgroundColor = new ThemeColor(
                    "statusBarItem.errorBackground"
                );

                // const arg: { to: string; by: string } = {
                //     to: "left",
                //     by: "character",
                // };

                // this.statusBarItem.command = {
                //     command: "cursorMove",
                //     title: "cursorMove",
                //     arguments: [arg],
                // };

                const range = new Range(
                    nodes[0].startPosition.row,
                    nodes[0].startPosition.column,
                    nodes[0].endPosition.row,
                    nodes[0].endPosition.column
                );
                window.activeTextEditor?.setDecorations(a, [range]);
            } else {
                this.statusBarItem.backgroundColor = undefined;
                window.activeTextEditor?.setDecorations(a, []);
            }
        }

        return result;
    }
}

function getNodesWithErrors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
    let errorNodes: Parser.SyntaxNode[] = [];

    if (node.hasError()) {
        errorNodes.push(node);
    }

    node.children.forEach((child) => {
        errorNodes = errorNodes.concat(getNodesWithErrors(child));
    });

    return errorNodes;
}
