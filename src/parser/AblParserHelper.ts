import Parser from "web-tree-sitter";
import { IParserHelper } from "./IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { ParseResult } from "../model/ParseResult";
import path from "path";

export class AblParserHelper implements IParserHelper {
    private parser = new Parser();
    private trees = new Map<string, Parser.Tree>();

    public constructor(extensionPath: string) {
        console.log("Hello Parser!");

        const ablPromise = Parser.Language.load(
            path.join(extensionPath, "resources/tree-sitter-abl.wasm")
        );

        ablPromise.then((abl) => {
            this.parser.setLanguage(abl);
        });
    }

    public parse(fileIdentifier: FileIdentifier, text: string): ParseResult {
        const previousTree = this.trees.get(fileIdentifier.name);
        const newTree = this.parser.parse(text);
        let ranges: Parser.Range[];

        if (previousTree !== undefined) {
            ranges = previousTree.getChangedRanges(newTree);
        } else {
            ranges = []; // TODO
        }

        this.trees.set(fileIdentifier.name, newTree);

        const result: ParseResult = {
            tree: newTree,
            ranges: ranges,
        };

        return result;
    }
}
