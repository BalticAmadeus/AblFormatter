import { SyntaxNode } from "web-tree-sitter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { AFormatter } from "../AFormatter";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { VariableDefinitionSettings } from "./VariableDefinitionSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";

@RegisterFormatter
export class VariableDefinitionFormatter
    extends AFormatter
    implements IFormatter
{
    public static readonly formatterLabel = "variableDefinitionFormatting";
    private readonly settings: VariableDefinitionSettings;
    private static visitedNodes: Set<number> = new Set();
    private static alignType = 0;
    private static alignNoUndo = 0;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new VariableDefinitionSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === SyntaxNodeType.VariableDefinition) {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const oldText = FormatterHelper.getCurrentText(node, fullText);
        if (VariableDefinitionFormatter.visitedNodes.has(node.id)) {
            const newText = this.collectDefineString(node, fullText);
            return this.getCodeEdit(node, oldText, newText, fullText);
        }

        this.resetStaticVariables();
        let currentNode: SyntaxNode | null = node;
        for (
            currentNode;
            currentNode !== null;
            currentNode = currentNode.nextSibling
        ) {
            if (currentNode.type === SyntaxNodeType.Comment) {
                continue;
            }
            if (currentNode.type !== SyntaxNodeType.VariableDefinition) {
                break;
            }
            this.collectDefineStructure(currentNode, fullText);
            VariableDefinitionFormatter.visitedNodes.add(currentNode.id);
        }
        const newText = this.collectDefineString(node, fullText);
        return this.getCodeEdit(node, oldText, newText, fullText);
    }

    private collectDefineString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let resultString = "";
        node.children.forEach((child) => {
            resultString = resultString.concat(
                this.getExpressionString(child, fullText)
            );
        });
        resultString += ".";
        return resultString;
    }

    private collectDefineStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): void {
        node.children.forEach((child) => {
            this.getDefineStructure(child, fullText);
        });
    }

    private getDefineStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): void {
        switch (node.type) {
            case SyntaxNodeType.TypeTuning:
                VariableDefinitionFormatter.alignNoUndo = Math.max(
                    VariableDefinitionFormatter.alignNoUndo,
                    FormatterHelper.getCurrentText(node, fullText).trim().length
                );
                break;
            case SyntaxNodeType.Identifier:
                VariableDefinitionFormatter.alignType = Math.max(
                    VariableDefinitionFormatter.alignType,
                    FormatterHelper.getCurrentText(node, fullText).trim().length
                );
                break;
        }
    }

    private getExpressionString(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        let newString = "";
        const text = FormatterHelper.getCurrentText(node, fullText).trim();
        switch (node.type) {
            case SyntaxNodeType.DotKeyword:
                break;
            case SyntaxNodeType.DefineKeyword:
                newString = text;
                break;
            case SyntaxNodeType.TypeTuning:
                newString =
                    " " +
                    text +
                    " ".repeat(
                        VariableDefinitionFormatter.alignNoUndo - text.length
                    );
                break;
            case SyntaxNodeType.Identifier:
                newString =
                    " " +
                    text +
                    " ".repeat(
                        VariableDefinitionFormatter.alignType - text.length
                    );
                break;
            default:
                newString = text.length === 0 ? "" : " " + text;
                break;
        }
        return newString;
    }

    private resetStaticVariables() {
        VariableDefinitionFormatter.alignType = 0;
        VariableDefinitionFormatter.alignNoUndo = 0;
    }
}
