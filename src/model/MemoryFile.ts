import * as vscode from 'vscode';

const _SCHEME = "inmemoryfile";

/**
 *  Registration function for In-Memory files.
 **/
export function register_memoryFileProvider ({ subscriptions }: vscode.ExtensionContext)
{
  const myProvider = new (class implements vscode.TextDocumentContentProvider
        {
            provideTextDocumentContent(uri: vscode.Uri): string
            {
                let memDoc = MemoryFile.getDocument (uri);
                if (memDoc == null)
                    return "";
                return memDoc.read ();
            }
  })();
  subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(
        _SCHEME, myProvider));
}

/**
 *  Management class for in-memory files.
 **/
class MemoryFileManagement
{
    private static _documents: {[key: string]: MemoryFile} = {};
    private static _lastDocId: number = 0;

    public static getDocument(uri: vscode.Uri) : MemoryFile | null
    {
        return MemoryFileManagement._documents[uri.path];
    }

    private static _getNextDocId(): string{
        MemoryFileManagement._lastDocId++;
        return "_" + MemoryFileManagement._lastDocId + "_";
    }

    public static createDocument(extension = "")
    {
      let path = MemoryFileManagement._getNextDocId ();

        if (extension != "")
            path += "." + extension;

        let self = new MemoryFile(path);

        MemoryFileManagement._documents[path] = self;

        return self;
    }
}

/**
 * A file in memory
 **/
export class MemoryFile
{
    public static getDocument(uri: vscode.Uri) : MemoryFile | null {
        return MemoryFileManagement.getDocument (uri);
    }

    public static createDocument(extension = "") {
        return MemoryFileManagement.createDocument (extension);
    }

    public content: string = "";
    public uri: vscode.Uri;

    constructor (path: string)
    {
        this.uri = vscode.Uri.from ({scheme: _SCHEME, path: path})
    }

    public write(strContent: string){
        this.content += strContent;
    }

    public read(): string {
        return this.content;
    }

    public getUri(): vscode.Uri {
        return this.uri;
    }
}