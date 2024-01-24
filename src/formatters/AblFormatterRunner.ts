import { TextDocument, TextEdit, WorkspaceEdit, workspace } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser, { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblFormatterFactory } from "../providers/AblFormatterFactory";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";

export class AblFormatterRunner implements IAblFormatterRunner {
    private document: TextDocument | undefined;
    private parserResult: ParseResult | undefined;
    private ablBaseFormatters: IAblFormatter[] = [];
    private ablFormatters: IAblFormatter[] = [];
    private factory: AblFormatterFactory;
    private accumulatedEdits: TextEdit[] = [];
    private parserHelper: IParserHelper | undefined;

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
    public setParserHelper(parserHelper: IParserHelper): IAblFormatterRunner {
        this.parserHelper = parserHelper;
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

        this.ablBaseFormatters = this.factory.getBaseFormatters();
        this.ablFormatters     = this.factory.getFormatters();

        this.visitTree(this.parserResult.tree.rootNode, this.ablBaseFormatters);

        // Store the accumulated edits
        this.accumulatedEdits = this.getBaseSourceChanges().textEdits;
        
        this.applyEdits();

        return this;
    }

    private async applyEdits() {
        if (this.document) {
            const edit = new WorkspaceEdit();

            if (this.accumulatedEdits.length > 0) {
                edit.set(this.document.uri, this.accumulatedEdits);
                await workspace.applyEdit(edit);
            }

            // Open the document to get changes immediately and parse it
            const document    = await workspace.openTextDocument(this.document.uri);
            this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document!.fileName, this.document!.version), document.getText());

            this.visitTree(this.parserResult.tree.rootNode, this.ablFormatters);

            edit.set(this.document.uri, this.getSourceChanges().textEdits);
            await workspace.applyEdit(edit);
        }
    }

    public getBaseSourceChanges(): SourceChanges {
        let sourceChanges: SourceChanges = { textEdits: [] };

        this.ablBaseFormatters.forEach((formatter) => {
            sourceChanges.textEdits = sourceChanges.textEdits.concat(
                formatter.getSourceChanges().textEdits
            );
        });

        return sourceChanges;
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

    private visitTree(node: Parser.SyntaxNode, formatters: IAblFormatter[]) {
        formatters.forEach((formatter) => formatter.parseNode(node));
        node.children.forEach((child) => {
            this.visitTree(child, formatters);
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
