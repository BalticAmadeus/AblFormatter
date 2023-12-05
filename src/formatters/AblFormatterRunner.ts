import { TextDocument } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";

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
