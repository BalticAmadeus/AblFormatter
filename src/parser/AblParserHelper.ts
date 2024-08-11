import Parser, { Tree } from "web-tree-sitter";
import { IParserHelper } from "./IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { ParseResult } from "../model/ParseResult";
import path from "path";

export class AblParserHelper implements IParserHelper {
    private parser = new Parser();
    private trees = new Map<string, Parser.Tree>();
    private ablLanguagePromise: Promise<Parser.Language>;

    public constructor(extensionPath: string) {
        this.ablLanguagePromise = Parser.Language.load(
            path.join(extensionPath, "resources/tree-sitter-abl.wasm")
        );

        this.ablLanguagePromise.then((abl) => {
            this.parser.setLanguage(abl);
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

        return result;
    }
}
