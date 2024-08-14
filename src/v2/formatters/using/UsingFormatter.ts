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
    private readonly settings: UsingSettings;

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new UsingSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        if (node.type === "USING" || node.type === "using") {
            return true;
        }
        return false;
    }
    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        const text = FormatterHelper.getCurrentText(node, fullText);
        console.log(text);
        return this.getCodeEdit(node, text, text);
    }
}
