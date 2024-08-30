// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Parser from "web-tree-sitter";
import { AblFormatterProvider } from "./providers/AblFormatterProvider";
import { Constants } from "./model/Constants";
import { AblParserHelper } from "./parser/AblParserHelper";
import { register_memoryFileProvider } from "./model/MemoryFile";
import { FormatterCache } from "./model/FormatterCache";
import { AblDebugHoverProvider } from "./providers/AblDebugHoverProvider";
import { ConfigurationManager2 } from "./utils/ConfigurationManager2";
import { enableFormatterDecorators } from "./v2/formatterFramework/enableFormatterDecorators";
import { DebugManager } from "./providers/DebugManager";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    register_memoryFileProvider(context);
    DebugManager.getInstance(context);

    await Parser.init().then(() => {});

    ConfigurationManager2.getInstance();
    enableFormatterDecorators();

    const parserHelper = new AblParserHelper(context.extensionPath);
    const formatter = new AblFormatterProvider(parserHelper);

    vscode.languages.registerDocumentRangeFormattingEditProvider(
        Constants.ablId,
        formatter
    );

    vscode.languages.registerDocumentFormattingEditProvider(
        Constants.ablId,
        formatter
    );

    const hoverProvider = new AblDebugHoverProvider(parserHelper);
    vscode.languages.registerHoverProvider(Constants.ablId, hoverProvider);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "AblFormatter.helloWorld",
        () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage(
                "Hello World from AblFormatter!"
            );
        }
    );

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    FormatterCache.clearCache();
}
