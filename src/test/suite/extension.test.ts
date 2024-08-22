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
const testDir = "resources\\functionalTests";
const testDirs = getDirs(path.join(extensionDevelopmentPath, testDir));
let testCases: string[] = [];
testDirs.forEach((dir) => {
    const testsInsideDir = getDirs(
        path.join(extensionDevelopmentPath, testDir + "\\" + dir)
    );
    testsInsideDir.forEach((test) => {
        testCases.push(dir + "\\" + test);
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

        console.log("Tests: ", extensionDevelopmentPath, testCases.toString());
    });

    testCases.forEach((cases) => {
        test(`Functional test: ${cases}`, () => {
            functionalTest(cases);
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

function getInput(fileName: string): string {
    const filePath = path.join(
        extensionDevelopmentPath,
        testDir,
        fileName,
        "input.p"
    );
    return readFile(filePath);
}

function getTarget(fileName: string): string {
    const filePath = path.join(
        extensionDevelopmentPath,
        testDir,
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
