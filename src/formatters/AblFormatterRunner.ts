import { TextDocument, workspace } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser, { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblFormatterFactory } from "../providers/AblFormatterFactory";

//TODO
// In the future there will be issues with this logic as multiple Formatters may change same parts of code.
// It should be solved by making ABLFormatterRunner store Edits and by partially re-parsing Tree every time
// when document Edits come from any Formatter.
// Also, simmple formatters may be separated from those wthat format multiple statements.
export class AblFormatterRunner implements IAblFormatterRunner {
    private document: TextDocument | undefined;
    private parserResult: ParseResult | undefined;
    private ablFormatters: IAblFormatter[] = [];
    private factory: AblFormatterFactory;

    public constructor(factory: AblFormatterFactory) {
        this.factory = factory;
    }

    public setDocument(document: TextDocument): IAblFormatterRunner {
        this.document = document;
        return this;
    }
    public setParserResult(parserResult: ParseResult): IAblFormatterRunner {
        this.parserResult = parserResult;
        return this;
    }

    public start(): IAblFormatterRunner {
        if (this.parserResult === undefined) {
            console.log("Parser result is empty!");
            return this;
        }

        const settingsString = this.getOverrideSettingsComment(
            this.parserResult.tree.rootNode
        );
        if (settingsString !== undefined) {
            ConfigurationManager.setOverridingSettings(
                JSON.parse(settingsString)
            );
        } else {
            ConfigurationManager.setOverridingSettings(undefined);
        }
        this.ablFormatters = this.factory.getFormatters();

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

    public getOverrideSettingsComment(node: SyntaxNode): string | undefined {
        const firstChildNode = node.child(0);

        if (firstChildNode === null) {
            return undefined;
        }

        if (!firstChildNode.text.includes("formatterSettingsOverride")) {
            return undefined;
        }

        const secondChildNode = node.child(1);
        if (secondChildNode === null) {
            return undefined;
        }

        return secondChildNode.text.substring(
            2,
            secondChildNode.text.length - 2
        );
    }
}
