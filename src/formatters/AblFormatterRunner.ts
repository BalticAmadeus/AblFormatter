import { Range, TextDocument, TextEdit, TextEditor, TextEditorEdit, WorkspaceEdit, window, workspace } from "vscode";
import { ParseResult } from "../model/ParseResult";
import { IAblFormatter } from "./IAblFormatter";
import Parser, { SyntaxNode, Tree } from "web-tree-sitter";
import { SourceChanges } from "../model/SourceChanges";
import { IAblFormatterRunner } from "./IAblFormatterRunner";
import { ConfigurationManager } from "../utils/ConfigurationManager";
import { AblFormatterFactory } from "../providers/AblFormatterFactory";
import { IParserHelper } from "../parser/IParserHelper";
import { FileIdentifier } from "../model/FileIdentifier";
import { MemoryFile } from "../model/MemoryFile";
import { FormatterCache } from "../model/FormatterCache";
import { SyntaxNodeType } from "../model/SyntaxNodeType";
import * as crypto from 'crypto';
import * as fs from 'fs';

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
    private filePath: string | undefined;
    private changedRanges: Parser.Range[] | undefined;
    private nodeByRanges: SyntaxNode | undefined;
    private editableParent: SyntaxNode | undefined;
    private formattedBefore: boolean = false;
    private parserResultForSaving: ParseResult | undefined;
    private enablePartialFormatting: boolean = false;

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

        this.setBaseEdits();

        return this;
    }

    private async setBaseEdits(): Promise<void>{
        this.filePath = this.document?.uri.fsPath;
        const currentHash = await this.calculateHashOfFile(this.filePath!);
        const cachedHash = FormatterCache.getHash(this.filePath!);

        this.formattedBefore = false;

        if (this.enablePartialFormatting &&
            cachedHash === currentHash) {
            console.log('File has been formatted before.');

            this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document!.fileName, this.document!.version), this.getDocument().getText());
            
            FormatterCache.getTree(this.filePath!);

            this.changedRanges = FormatterCache.getTree(this.filePath!)!.getChangedRanges(this.parserResult.tree);

            this.changedRanges.forEach((range) => {

                // first find the changed node (keep in mind, searching by ranges not always returns the corect node)
                this.nodeByRanges = this.findNodeByRanges(this.parserResult!.tree.rootNode, range);

                this.editableParent = this.getEditableParentForStatements(this.nodeByRanges!.parent!);
                
                if (this.editableParent === undefined) {
                    this.editableParent = this.getEditableParentForDoBlock(this.nodeByRanges!);
                }

                if (this.editableParent === undefined) {
                    this.editableParent = this.nodeByRanges;
                }

                if (this.editableParent !== undefined) {
                    this.formattedBefore = true;
                }
            });

        } else {
            console.log('File needs first time formatting.');
        }

        this.getText(false, this.editor!);

        // create the in-memory document
        let memfile = MemoryFile.createDocument("ts");
        memfile.write(this.documentText!);

        // create a vscode.TextDocument from the in-memory document.
        this.inMemoryDocument = await workspace.openTextDocument(memfile.getUri());
        this.originalDocument = this.getDocument();

        this.setDocument(this.inMemoryDocument);

        this.parserResult = this.parserHelper!.parse(new FileIdentifier(this.document!.fileName, this.document!.version), this.getDocument().getText());

        this.visitTree(this.parserResult.tree.rootNode, this.ablBaseFormatters);

        // Store the accumulated base edits (only block editing)
        this.accumulatedEdits = this.getBaseSourceChanges().textEdits;
        
        this.applyEdits().then(() => {
            FormatterCache.updateHash(this.filePath!, currentHash);
        });
    }

    private async applyEdits(): Promise<void> {
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

            // first adding changes by base formatters (currently block formatting)
            this.editor!.edit((edit: TextEditorEdit) => {
                edit.replace(this.textRange!, this.inMemoryDocument!.getText().trim());
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

        /**
         *  Getting the correct editing range.
         *  Three cases: selected text, already formatted file (so formatting only the parent node)
         *  and the whole file text
         **/
        if (this.selection && !this.selection.isEmpty) {
            this.textRange = new Range(this.selection.start.line + this.getSourceChanges().textEdits[startNum].range.start.line, 
                                       this.selection.start.character + this.getSourceChanges().textEdits[startNum].range.start.character, 
                                       this.selection.start.line + this.getSourceChanges().textEdits[startNum].range.end.line, 
                                       this.getSourceChanges().textEdits[startNum].range.end.character);
        } else if (this.formattedBefore) {
            this.textRange = new Range(this.editableParent!.startPosition.row + this.getSourceChanges().textEdits[startNum].range.start.line, 
                                       this.getSourceChanges().textEdits[startNum].range.start.character,  
                                       this.editableParent!.startPosition.row + this.getSourceChanges().textEdits[startNum].range.end.line, 
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

            // saving the current tree to cache
            this.parserResultForSaving = this.parserHelper!.parse(new FileIdentifier(editor.document!.fileName, editor.document!.version), editor.document!.getText());
            FormatterCache.setTree(this.filePath!, this.parserResultForSaving!.tree);

        }); 
    }

    /**
     *  Method for getting the correct text and it's ranges for editing.
     *  Three cases: selected text, already formatted file (so formatting only the parent node)
     *  and the whole file text
     **/
    private getText(fromEditor: boolean, editor: TextEditor): void {
        this.selection = this.editor!.selection;

        if (this.selection && !this.selection.isEmpty) {
            this.textRange = new Range(this.selection.start.line, this.selection.start.character, this.selection.end.line, this.selection.end.character);
            this.documentText = editor.document.getText(this.textRange);
        } else if (this.formattedBefore) {
            this.textRange = new Range(this.editableParent!.startPosition.row, 0, this.editableParent!.endPosition.row, this.editableParent!.endPosition.column);
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

    private calculateHashOfFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
    
            stream.on('data', (data) => {
                hash.update(data);
            });
    
            stream.on('end', () => {
                const fileHash = hash.digest('hex');
                resolve(fileHash);
            });
    
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    private findNodeByRanges(node: SyntaxNode, range: Parser.Range): SyntaxNode | undefined {
        if (node.startIndex > range.startIndex && node.endIndex < range.endIndex) {
            this.nodeByRanges = node;
            return this.nodeByRanges;
        }

        node.children.forEach((child) => {
            if (this.nodeByRanges !== undefined) {
                return this.nodeByRanges;
            }
            this.findNodeByRanges(child, range);
        });

        return this.nodeByRanges;
    }

    private getEditableParentForStatements(node: SyntaxNode): SyntaxNode | undefined {
        if (node.parent === null) {
            this.editableParent = undefined;
            return this.editableParent;
        }

        if (node.parent.type === SyntaxNodeType.CaseStatement ||
            node.parent.type === SyntaxNodeType.IfStatement ||
            node.parent.type === SyntaxNodeType.TemptableDefinition ||
            node.parent.type === SyntaxNodeType.FindStatement ||
            node.parent.type === SyntaxNodeType.AssignStatement ||
            node.parent.type === SyntaxNodeType.ForStatement) {
            this.editableParent = node.parent;
            return this.editableParent;
        }

        this.getEditableParentForStatements(node.parent);

        return this.editableParent;
    }

    private getEditableParentForDoBlock(node: SyntaxNode): SyntaxNode | undefined {
        if (node.parent === null) {
            this.editableParent = undefined;
            return this.editableParent;
        }

        if (node.parent.type === SyntaxNodeType.DoBlock) {
            this.editableParent = node.parent!;
            return this.editableParent;
        }

        this.getEditableParentForDoBlock(node.parent);

        return this.editableParent;
    }
}
