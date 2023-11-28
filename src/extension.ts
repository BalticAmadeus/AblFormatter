// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as vscode from 'vscode';
import Parser from 'web-tree-sitter';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	await Parser.init().then( () => {

	});

	const parser = new Parser;

	const ABL = await Parser.Language.load('C:/Users/pkuprevicius/Rnd/ProBro/Formatting/Formatter/ablformatter3/node_modules/@usagi-coffee/tree-sitter-abl/tree-sitter-abl.wasm');
	parser.setLanguage(ABL);


	const code = fs.readFileSync("C:/Users/pkuprevicius/Rnd/ProBro/Formatting/Formatter/ablformatter3/src/test.i", "utf-8");

	const tree = parser.parse(code);

	fs.writeFileSync("C:/Users/pkuprevicius/Rnd/ProBro/Formatting/Formatter/ablformatter3/src/test2.i", tree.rootNode.toString());

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ablformatter3" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ablformatter3.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ABLformatter3!');
	});

	context.subscriptions.push(disposable);
}

// function parse(tree: Parser.Tree): Map<number, number> {
// 	let adjustments = new Map<number, number>();

// 	const rootNode = tree.rootNode;
// 	parseElement(rootNode, adjustments);
// 	return adjustments;
// }
// This method is called when your extension is deactivated
export function deactivate() {}
