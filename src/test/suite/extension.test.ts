import * as assert from "assert";
import * as fs from "fs";
import { IParserHelper } from "../../parser/IParserHelper";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { AblParserHelper } from "../../parser/AblParserHelper";
import { FileIdentifier } from "../../model/FileIdentifier";
import { AblFormatterFactory } from "../../providers/AblFormatterFactory";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Sample test", () => {
        console.log(vscode.extensions.all);
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test("hello.p", () => {
        genericTest("hello.p");
    });
});

function genericTest(name: string): void {
    const caseText = getCase(name);
    const result = format(caseText);
    const target = getTarget(name);
    assert.strictEqual(result, target);
}

function getCase(fileName: string): string {
    return readFile(
        "C:\\Users\\pkuprevicius\\OneDrive - ba.lt\\code_projects\\formatter\\AblFormatter\\resources\\testCases\\cases\\hello.p"
    );
}

function format(text: string): string {
    const parserHelper = new AblParserHelper(
        "C:\\Users\\pkuprevicius\\OneDrive - ba.lt\\code_projects\\formatter\\AblFormatter"
    );
    const formatterFactory = new AblFormatterFactory();

    const result = parserHelper.parse(new FileIdentifier("1", 1), text);

    // try {
    //     const runner = formatterFactory.getFormatterRunner().setDocument().setParserResult(result).setParserHelper(parserHelper);
    // }

    return "";
}

function getTarget(fileName: string): string {
    return readFile(
        "C:\\Users\\pkuprevicius\\OneDrive - ba.lt\\code_projects\\formatter\\AblFormatter\\resources\\testCases\\cases\\hello.p"
    );
}

function readFile(fileUri: string): string {
    return fs.readFileSync(fileUri, "utf-8");
}
