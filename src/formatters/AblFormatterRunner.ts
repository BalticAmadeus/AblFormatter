import { TextDocument } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";

//TODO
// In the future there will be issues with this logic as multiple Formatters may change same parts of code.
// It should be solved by making ABLFormatterRunner store Edits and by partially re-parsing Tree every time
// when document Edits come from any Formatter.
// Also, simmple formatters may be separated from those wthat format multiple statements.
export class AblFormatterRunner implements IAblFormatterRunner {
    private document: TextDocument | undefined;
    private parserResult: ParseResult | undefined;
    private ablFormatters: IAblFormatter[] = [];

    public setDocument(document: TextDocument): IAblFormatterRunner {
        this.document = document;
        return this;
    }
    public setParserResult(parserResult: ParseResult): IAblFormatterRunner {
        this.parserResult = parserResult;
        return this;
    }

    public setFormatters(ablFormatters: IAblFormatter[]): IAblFormatterRunner {
        this.ablFormatters = ablFormatters;
        return this;
    }

    public start(): IAblFormatterRunner {
        if (this.parserResult === undefined) {
            console.log("Parser result is empty!");
            return this;
        }
        this.visitTree(this.parserResult.tree.rootNode);
        return this;
    }

    public getSourceChanges(): SourceChanges {
        let sourceChanges: SourceChanges = { textEdits: [] };

        this.ablFormatters.forEach((formatter) => {
            sourceChanges.textEdits = sourceChanges.textEdits.concat(
                formatter.getSourceChanges().textEdits
            );
        });

        return sourceChanges;
    }

    public getDocument(): TextDocument {
        if (this.document === undefined) {
            throw new Error("Document is undefined!");
        }
        return this.document;
    }

    private visitTree(node: Parser.SyntaxNode) {
        this.ablFormatters.forEach((formatter) => formatter.parseNode(node));
        node.children.forEach((child) => {
            this.visitTree(child);
        });
    }
}
