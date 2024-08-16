import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { UsingSettings } from "./UsingSettings";

@RegisterFormatter
export class UsingFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "usingFormatting";
    private readonly settings: UsingSettings;

    private usingStatementsFound: number = 0;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new UsingSettings(configurationManager);
    }

    private usingStatements: string[] = [];

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === "using_statement") {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.usingStatementsFound++;
        if (this.usingStatementsFound === 1) {
            this.collectAllUsingStatements(node, fullText);
            this.usingStatements.sort();
        }
        const text = FormatterHelper.getCurrentText(node, fullText);
        const newText = this.usingStatements[this.usingStatementsFound - 1];
        return this.getCodeEdit(node, text, newText);
    }

    private collectAllUsingStatements(
        node: SyntaxNode,
        fullText: FullText
    ): void {
        if (this.match(node)) {
            const leftChild = node.child(0);
            const rightChild = node.child(1);

            if (leftChild === null || rightChild === null) {
                return;
            }

            let keyword = FormatterHelper.getCurrentText(leftChild, fullText);
            keyword = this.settings.casing()
                ? keyword.toUpperCase()
                : keyword.toLowerCase();
            const identifier = FormatterHelper.getCurrentText(
                rightChild,
                fullText
            );

            this.usingStatements.push(keyword.concat(identifier).concat("."));
        }

        if (node.nextSibling !== null) {
            this.collectAllUsingStatements(node.nextSibling, fullText);
        }
    }
}
