import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { UsingSettings } from "./UsingSettings";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";

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
        if (node.type === SyntaxNodeType.UsingStatement) {
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
        if (this.usingStatementsFound > this.usingStatements.length) {
            return undefined;
        }
        const newText = this.usingStatements[this.usingStatementsFound - 1];
        return this.getCodeEdit(node, text, newText, fullText);
    }

    private collectAllUsingStatements(
        node: SyntaxNode | null,
        fullText: FullText
    ): void {
        for (node; node !== null; node = node.nextSibling) {
            if (!this.match(node)) {
                continue;
            }

            const keywordChild = node.child(0);
            const identifierChild = node.child(1);

            if (keywordChild === null || identifierChild === null) {
                return;
            }

            let keyword = FormatterHelper.getCurrentText(
                keywordChild,
                fullText
            );
            keyword = this.settings.casing()
                ? keyword.toUpperCase()
                : keyword.toLowerCase();
            const identifier = FormatterHelper.getCurrentText(
                identifierChild,
                fullText
            );

            let optionalDefinitions = "";
            if (node.childCount > 2) {
                for (let i = 2; i < node.childCount; ++i) {
                    const currentChild = node.child(i);
                    if (currentChild === null) {
                        continue;
                    }
                    optionalDefinitions += FormatterHelper.getCurrentText(
                        currentChild,
                        fullText
                    );
                }
                optionalDefinitions = this.settings.casing()
                    ? optionalDefinitions.toUpperCase()
                    : optionalDefinitions.toLowerCase();
            }

            this.usingStatements.push(
                keyword
                    .concat(identifier)
                    .concat(optionalDefinitions)
                    .concat(".")
            );
        }
    }
}
