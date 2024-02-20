import { Range, TextDocument, TextEdit, TextEditorEdit, WorkspaceEdit, window, workspace } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser, { SyntaxNode } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblFormatterFactory } from "../providers/AblFormatterFactory";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { MemoryFile } from "../model/MemoryFile";

export class AblFormatterRunner implements IAblFormatterRunner {
    private document: TextDocument | undefined;
    private inMemoryDocument: TextDocument | undefined;
    private originalDocument: TextDocument | undefined;
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

            let modifiedContent = "";

            // Apply edits to in-memory file content
            this.accumulatedEdits.forEach(edit => {
                modifiedContent = modifiedContent +
                                  edit.newText +
                                  "\r\n";
            });

            if (modifiedContent.length === 0) {
                modifiedContent = this.document.getText();
            }

            // create the in-memory document
            let memfile = MemoryFile.createDocument("ts");
            memfile.write(modifiedContent);

            // create a vscode.TextDocument from the in-memory document.
            this.inMemoryDocument = await workspace.openTextDocument(memfile.getUri());
            this.originalDocument = this.getDocument();

            this.setDocument(this.inMemoryDocument);

            this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document.fileName, this.document.version), this.getDocument().getText());

            this.visitTree(this.parserResult.tree.rootNode, this.ablFormatters);

            let editor = window.activeTextEditor;

            editor!.edit((edit: TextEditorEdit) => {
                edit.replace(new Range(this.originalDocument!.lineAt(0).range.start, this.originalDocument!.lineAt(this.originalDocument!.lineCount - 1).range.end), this.getDocument().getText());
            }, {undoStopBefore: false, undoStopAfter: false})
            .then(async success => {
                if (!success) {
                    return;
                }

                this.getSourceChanges().textEdits.forEach((textEdit) => {
                    editor!.edit((edit: TextEditorEdit) => {
                        edit.replace(textEdit.range, textEdit.newText);
                    }, {undoStopBefore: false, undoStopAfter: false});
                });

            });
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
