import * as assert from "assert";
import * as fs from "fs";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { AblParserHelper } from "../../parser/AblParserHelper";
import { FileIdentifier } from "../../model/FileIdentifier";
import { FormattingEngine } from "../../v2/formatterFramework/FormattingEngine";
import { ConfigurationManager2 } from "../../utils/ConfigurationManager2";
import Parser from "web-tree-sitter";
import { enableFormatterDecorators } from "../../v2/formatterFramework/enableFormatterDecorators";
import path from "path";
import { EOL } from "../../v2/model/EOL";

let parserHelper: AblParserHelper;

const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
const functionalTestDir = "resources\\functionalTests";
const functionalTestDirs = getDirs(path.join(extensionDevelopmentPath, functionalTestDir));
let functionalTestCases: string[] = [];
functionalTestDirs.forEach((dir) => {
    const testsInsideDir = getDirs(
        path.join(extensionDevelopmentPath, functionalTestDir + "\\" + dir)
    );
    testsInsideDir.forEach((test) => {
        functionalTestCases.push(dir + "\\" + test);
    });
});

const treeSitterErrorTestDir = "resources\\treeSitterErrorTests";
const treeSitterErrorTestDirs = getDirs(path.join(extensionDevelopmentPath, treeSitterErrorTestDir));
let treeSitterTestCases: string[] = [];
treeSitterErrorTestDirs.forEach((dir) => {
    const testsInsideDir = getDirs(
        path.join(extensionDevelopmentPath, treeSitterErrorTestDir + "\\" + dir)
    );
    testsInsideDir.forEach((test) => {
        treeSitterTestCases.push(dir + "\\" + test);
    });
});

// example for running single test case;
// testCases = ["assign/1formattingFalse"];

suite("Extension Test Suite", () => {
    suiteTeardown(() => {
        vscode.window.showInformationMessage("All tests done!");
    });

    suiteSetup(async () => {
        await Parser.init().then(() => {
            console.log("Parser initialized");
        });

        parserHelper = new AblParserHelper(extensionDevelopmentPath);
        await parserHelper.awaitLanguage();

        console.log("FunctionalTests: ", extensionDevelopmentPath, functionalTestCases.toString());
        console.log("TreeSitterTests: ", extensionDevelopmentPath, treeSitterTestCases.toString());
    });

    functionalTestCases.forEach((cases) => {
        test(`Functional test: ${cases}`, () => {
            functionalTest(cases);
        });
    });

    treeSitterTestCases.forEach((cases) => {
        test(`Tree Sitter Error test: ${cases}`, () => {
            treeSitterTest(cases);
        });
    });
});

function functionalTest(name: string): void {
    ConfigurationManager2.getInstance();
    enableFormatterDecorators();

    const inputText = getInput(name);
    const resultText = format(inputText, name);
    const targetText = getTarget(name);

    assert.strictEqual(
        resultText
            .replaceAll(" ", "_")
            .replaceAll("\r\n", "#CRLF\r\n")
            .replaceAll("(?<!\r)\n", "#LF\n"),
        targetText
            .replaceAll(" ", "_")
            .replaceAll("\r\n", "#CRLF\r\n")
            .replaceAll("(?<!\r)\n", "#LF\n")
    );
}

function getError(fileName: string): string {
    const filePath = path.join(
        extensionDevelopmentPath,
        treeSitterErrorTestDir,
        fileName,
        "error.p"
    );
    return readFile(filePath);
}

function getInput(fileName: string): string {
    const filePath = path.join(
        extensionDevelopmentPath,
        functionalTestDir,
        fileName,
        "input.p"
    );
    return readFile(filePath);
}

function getTarget(fileName: string): string {
    const filePath = path.join(
        extensionDevelopmentPath,
        functionalTestDir,
        fileName,
        "target.p"
    );

    return readFile(filePath);
}

function format(text: string, name: string): string {
    const configurationManager = ConfigurationManager2.getInstance();

    const codeFormatter = new FormattingEngine(
        parserHelper,
        new FileIdentifier(name, 1),
        configurationManager
    );

    const result = codeFormatter.formatText(text, new EOL(getFileEOL(text)));

    return result;
}

function readFile(fileUri: string): string {
    return fs.readFileSync(fileUri, "utf-8");
}

function getDirs(fileUri: string): string[] {
    return fs.readdirSync(fileUri, "utf-8");
}

function getFileEOL(fileText: string): string {
    if (fileText.includes("\r\n")) {
        return "\r\n"; // Windows EOL
    } else if (fileText.includes("\n")) {
        return "\n"; // Unix/Linux/Mac EO
    } else {
        return ""; // No EOL found
    }
}

function treeSitterTest(name: string): void {
    ConfigurationManager2.getInstance();
    enableFormatterDecorators();

    const errorText = getError(name);
    const errors = parseAndCheckForErrors(errorText as string, name);

    const errorMessage = formatErrorMessage(errors, name);

    assert.strictEqual(
        errors.length,
        0,
        errorMessage
    );
}

function parseAndCheckForErrors(
    text: string,
    name: string
): Parser.SyntaxNode[] {
    const parseResult = parserHelper.parse(new FileIdentifier(name, 1), text);

    const rootNode = parseResult.tree.rootNode;
    const errors = getNodesWithErrors(rootNode);

    return errors;
}

function getNodesWithErrors(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
    let errorNodes: Parser.SyntaxNode[] = [];

    if (node.hasError()) {
        errorNodes.push(node);
    }

    node.children.forEach((child) => {
        errorNodes = errorNodes.concat(getNodesWithErrors(child));
    });

    return errorNodes;
}

function formatErrorMessage(errors: Parser.SyntaxNode[], name: string): string {
    if (errors.length === 0) {
        return '';
    }

    let errorMessage = `\n\nAssertionError [ERR_ASSERTION]: Expected no errors, but found ${errors.length} in ${name}.\n`;
    errorMessage += `--------------------------------------------------------------------------------\n`;

    errors.forEach((errorNode, index) => {
        errorMessage += `Error ${index + 1}:\n`;
        errorMessage += `- Type           : ${errorNode.type}\n`;
        errorMessage += `- Start Position : Line ${errorNode.startPosition.row + 1}, Column ${errorNode.startPosition.column + 1}\n`;
        errorMessage += `- End Position   : Line ${errorNode.endPosition.row + 1}, Column ${errorNode.endPosition.column + 1}\n`;
        errorMessage += `- Code Snippet   :\n\n${errorNode.text}\n`;
        errorMessage += `--------------------------------------------------------------------------------\n`;
    });

    return errorMessage;
}
