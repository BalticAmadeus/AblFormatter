import * as assert from "assert";
import * as fs from "fs";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { AblParserHelper } from "../../parser/AblParserHelper";
import { FileIdentifier } from "../../model/FileIdentifier";
import { FormattingEngine } from "../../v2/formatterFramework/FormattingEngine";
import { ConfigurationManager2 } from "../../utils/ConfigurationManager";
import Parser from "web-tree-sitter";
import { enableFormatterDecorators } from "../../v2/formatterFramework/enableFormatterDecorators";
import path, { join } from "path";
import { EOL } from "../../v2/model/EOL";
import { DebugManagerMock } from "./DebugManagerMock";

let parserHelper: AblParserHelper;

const extensionDevelopmentPath = path.resolve(__dirname, "../../../");

const stabilityTestDir = join(extensionDevelopmentPath, "resources/ade");
const extensionsToFind = [".p", ".w", ".cls", ".i"];
const stabilityTestCases = getFilesWithExtensions(
    stabilityTestDir,
    extensionsToFind
);

console.log("Parser initialized", stabilityTestCases);

suite("Extension Test Suite", () => {
    console.log("Parser initialized", stabilityTestCases);

    suiteTeardown(() => {
        vscode.window.showInformationMessage("All tests done!");
    });

    suiteSetup(async () => {
        await Parser.init().then(() => {
            console.log("Parser initialized");
        });

        parserHelper = new AblParserHelper(
            extensionDevelopmentPath,
            new DebugManagerMock()
        );
        await parserHelper.awaitLanguage();

        console.log(
            "StabilityTests: ",
            extensionDevelopmentPath,
            stabilityTestCases.toString()
        );
    });

    stabilityTestCases.forEach((cases) => {
        test(`Symbol test: ${cases}`, () => {
            stabilityTest(cases);
        });

        test(`Parser error test: ${cases}`, () => {
            stabilityTest(cases);
        });
    });
});

function stabilityTest(name: string): void {
    ConfigurationManager2.getInstance();
    enableFormatterDecorators();

    const beforeText = getInput(name);
    const beforeCount = countActualSymbols(beforeText);
    const afterText = format(beforeText, name);
    const afterCount = countActualSymbols(afterText);

    assert.strictEqual(beforeCount, afterCount);
}

function getInput(fileName: string): string {
    return readFile(fileName);
}

function format(text: string, name: string): string {
    const configurationManager = ConfigurationManager2.getInstance();

    const codeFormatter = new FormattingEngine(
        parserHelper,
        new FileIdentifier(name, 1),
        configurationManager,
        new DebugManagerMock()
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

function getFilesWithExtensions(
    rootDir: string,
    extensions: string[]
): string[] {
    let results: string[] = [];

    const items = getDirs(rootDir); // Get all items in the directory

    for (const item of items) {
        const fullPath = path.join(rootDir, item); // Get full path to the item
        const stat = fs.statSync(fullPath); // Get info about the item (file or directory)

        if (stat.isDirectory()) {
            // If it's a directory, recursively scan it
            results = results.concat(
                getFilesWithExtensions(fullPath, extensions)
            );
        } else {
            // If it's a file, check if its extension matches
            const ext = path.extname(item).toLowerCase();
            if (extensions.includes(ext)) {
                results.push(fullPath);
            }
        }
    }

    return results;
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

function countActualSymbols(text: string): number {
    let count = 0;

    for (const element of text) {
        const char = element;
        // Exclude spaces, newlines, carriage returns, and tabs
        if (char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t') {
            count++;
        }
    }

    return count;
}