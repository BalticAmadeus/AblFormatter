import { Range, TextDocument, TextEdit, TextEditor, TextEditorEdit, WorkspaceEdit, window, workspace } from "vscode";
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
    private editor = window.activeTextEditor;
    private selection = this.editor!.selection;
    private textRange: Range | undefined;
    private documentText: string | undefined;

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

        this.getText(false, this.editor!);

        this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document!.fileName, this.document!.version), this.getDocument().getText());

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
                modifiedContent = this.getDocument().getText();
            }

            // create the in-memory document
            let memfile = MemoryFile.createDocument("ts");
            memfile.write(modifiedContent);

            // create a vscode.TextDocument from the in-memory document.
            this.inMemoryDocument = await workspace.openTextDocument(memfile.getUri());
            this.originalDocument = this.getDocument();

            this.setDocument(this.inMemoryDocument);
            
            this.getText(false, this.editor!);

            this.editor!.edit((edit: TextEditorEdit) => {
                edit.replace(this.textRange!, this.inMemoryDocument!.getText(this.textRange!).trim());
            }, {undoStopBefore: false, undoStopAfter: false})
            .then(async success => {
                if (!success) {
                    return;
                }

                this.getText(false, this.editor!);

                this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document!.fileName, this.document!.version), this.documentText!);

                this.visitTree(this.parserResult.tree.rootNode, this.ablFormatters);

                this.addFormattersChanges(this.editor!, this.getSourceChanges().textEdits.length, 0);

            });
        }
    }

    private addFormattersChanges(editor: TextEditor, count: number, startNum: number): void {

        if (startNum === count) {
            return;
        }

        this.selection = this.editor!.selection;

        if (this.selection && !this.selection.isEmpty) {
            this.textRange = new Range(this.selection.start.line+this.getSourceChanges().textEdits[startNum].range.start.line, 
                                    this.selection.start.character + this.getSourceChanges().textEdits[startNum].range.start.character, 
                                    this.selection.start.line + this.getSourceChanges().textEdits[startNum].range.end.line, 
                                    this.getSourceChanges().textEdits[startNum].range.end.character);
        } else {
            this.textRange = this.getSourceChanges().textEdits[startNum].range;
        }

        editor.edit((edit: TextEditorEdit) => {
            edit.replace(this.textRange!, this.getSourceChanges().textEdits[startNum].newText);
        }, {undoStopBefore: false, undoStopAfter: false})
        .then(success => {
            if (!success) {
                return;
            }

            this.clearSourceChanges();
            this.getText(true, this.editor!);

            this.parserResult = this.parserHelper!.parse(new FileIdentifier(editor.document!.fileName, editor.document!.version), this.documentText!);

            this.visitTree(this.parserResult.tree.rootNode, this.ablFormatters);

            startNum = startNum + 1;

            this.addFormattersChanges(editor, count, startNum); 

        });
    }

    private getText(fromEditor: boolean, editor: TextEditor): void {
        this.selection = this.editor!.selection;

        if (this.selection && !this.selection.isEmpty) {
            this.textRange = new Range(this.selection.start.line, this.selection.start.character, this.selection.end.line, this.selection.end.character);
            this.documentText = editor.document.getText(this.textRange);
        } else {
            if (fromEditor) {
                this.documentText = editor.document!.getText();
            } else {
                this.textRange = new Range(this.document!.lineAt(0).range.start, this.document!.lineAt(this.document!.lineCount - 1).range.end);
                this.documentText = this.getDocument().getText();
            }
        }
    }

    private getRange(): void {
        if (this.selection && !this.selection.isEmpty) {
            this.textRange = new Range(this.selection.start.line, this.selection.start.character, this.selection.end.line, this.selection.end.character);
        } else {
            this.textRange = new Range(this.document!.lineAt(0).range.start, this.document!.lineAt(this.document!.lineCount - 1).range.end);
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

        sourceChanges.textEdits.length = 0;

        this.ablFormatters.forEach((formatter) => {
            sourceChanges.textEdits = sourceChanges.textEdits.concat(
                formatter.getSourceChanges().textEdits
            );
        });

        return sourceChanges;
    }

    public clearSourceChanges(): void {

        this.ablFormatters.forEach((formatter) => {
            formatter.clearSourceChanges();
        });
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
