import { SyntaxNode } from "web-tree-sitter";
import { IFormatter } from "../../formatterFramework/IFormatter";
import { SyntaxNodeType } from "../../../model/SyntaxNodeType";
import { CodeEdit } from "../../model/CodeEdit";
import { FullText } from "../../model/FullText";
import { FormatterHelper } from "../../formatterFramework/FormatterHelper";
import { AFormatter } from "../AFormatter";
import { RegisterFormatter } from "../../formatterFramework/formatterDecorator";
import { ForSettings } from "./ForSettings";
import { IConfigurationManager } from "../../../utils/IConfigurationManager";

@RegisterFormatter
export class ForFormatter extends AFormatter implements IFormatter {
    public static readonly formatterLabel = "forFormatting";
    private readonly settings: ForSettings;

    private startColumn = 0;
    private recordValueColumn = 0;
    private forBlockValueColumn = 0;
    private forKey = ""; // FOR
    private forTypeKey = ""; // EACH | FIRST | LAST
    private recordValue = "";
    private byValue = ""; // BY
    private whereKey = ""; // WHERE
    private whereValue = "";
    private forBodyValue = "";
    private useIndexValue = ""; //USE-INDEX
    private queryTuningLockKey = ""; // SHARE-LOCK | EXCLUSIVE-LOCK | NO-LOCK
    private queryTuningNoPrefetchKey = ""; // NO-PREFETCH
    private endValue = "";

    public constructor(configurationManager: IConfigurationManager) {
        super(configurationManager);
        this.settings = new ForSettings(configurationManager);
    }

    match(node: Readonly<SyntaxNode>): boolean {
        return node.type === SyntaxNodeType.ForStatement;
    }

    parse(
        node: Readonly<SyntaxNode>,
        fullText: Readonly<FullText>
    ): CodeEdit | CodeEdit[] | undefined {
        this.collectForStructure(node, fullText);

        const formattedBlock = this.getPrettyBlock();

        const originalText = FormatterHelper.getCurrentText(node, fullText);
        if (originalText === formattedBlock) {
            return undefined; // No changes needed
        }

        return this.getCodeEdit(node, originalText, formattedBlock, fullText);
    }

    private collectForStructure(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ) {
        this.startColumn = node.startPosition.column;
        console.log("startColumn", this.startColumn);
        this.forKey = FormatterHelper.getCurrentText(node, fullText).trim();
        console.log("forKey", this.forKey);
        this.forTypeKey = this.getForTypeKey(node);
        console.log("forTypeKey", this.forTypeKey);
        this.recordValue = node.text;
        console.log("recordValue", this.recordValue);
        this.recordValueColumn =
            this.startColumn + this.forKey.length + this.forTypeKey.length + 1; // +1 is a space between FOR EACH
        console.log("recordValueColumn", this.recordValueColumn);
        this.forBlockValueColumn = this.startColumn + this.settings.tabSize();
        console.log("forBlockValueColumn", this.forBlockValueColumn);

        this.assignQueryTuningStatements(node);
        

        const whereNode = this.getWhereNode(node);
        console.log("whereNode", whereNode);

        if (whereNode !== undefined) {
            this.whereKey = this.getWhereKey(whereNode, fullText);
            this.whereValue = this.getPrettyWhereBlock(
                whereNode,
                "\r\n".concat(" ".repeat(this.recordValueColumn)),
                fullText
            );
        }

        this.assignByValue(node, fullText);

        const bodyNode = this.getForBodyNode(node);
        console.log("bodyNode", bodyNode);

        if (bodyNode !== undefined) {
            this.forBodyValue = this.getPrettyBodyBlock(
                bodyNode,
                "\r\n".concat(" ".repeat(this.forBlockValueColumn)),
                fullText
            );
        }

        this.assignEndValue(node, fullText);
    }

    private getForTypeKey(node: SyntaxNode): string {
        const forTypeNode = node.child(1);

        if (forTypeNode === null) {
            return "";
        }

        if (
            forTypeNode.type === SyntaxNodeType.EachKeyword ||
            forTypeNode.type === SyntaxNodeType.FirstKeyword ||
            forTypeNode.type === SyntaxNodeType.LastKeyword
        ) {
            return forTypeNode.text;
        } else {
            return "";
        }
    }

    private assignQueryTuningStatements(node: SyntaxNode): void {
        node.children.forEach((child) => {
            if (child.type === SyntaxNodeType.QueryTuning) {
                const tuneNode = child.child(0);
                if (tuneNode !== null) {
                    const text = tuneNode.text;

                    switch (tuneNode.type) {
                        case SyntaxNodeType.ShareLockKeyword:
                        case SyntaxNodeType.ExclLockKeyword:
                        case SyntaxNodeType.NoLockKeyword:
                            this.queryTuningLockKey = text;
                            break;
                        case SyntaxNodeType.NoPrefetchKeyword:
                            this.queryTuningNoPrefetchKey = text;
                            break;
                    }
                }
            }
        });
    }

    private getWhereNode(node: SyntaxNode): SyntaxNode | undefined {
        return node.children.find(
            (child) => child.type === SyntaxNodeType.WhereClause
        );
    }

    private getWhereKey(
        whereNode: SyntaxNode,
        fullText: Readonly<FullText>
    ): string {
        return FormatterHelper.getCurrentText(whereNode, fullText).trim(); // Assuming first child is WHERE keyword
    }

    private getPrettyWhereBlock(
        node: SyntaxNode,
        separator: string,
        fullText: Readonly<FullText>
    ): string {
        return node.children
            .map((child) =>
                FormatterHelper.getCurrentText(child, fullText).trim()
            )
            .join(separator);
    }

    private assignByValue(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): void {
        const byNode = node.children.find(
            (child) => child.type === SyntaxNodeType.SortClause
        );
        this.byValue = byNode
            ? FormatterHelper.getCurrentText(byNode, fullText).trim()
            : "";
    }

    private getForBodyNode(node: SyntaxNode): SyntaxNode | undefined {
        return node.children.find(
            (child) => child.type === SyntaxNodeType.Body
        );
    }

    private getPrettyBodyBlock(
        node: SyntaxNode,
        separator: string,
        fullText: Readonly<FullText>
    ): string {
        return node.children
            .map(
                (child) =>
                    FormatterHelper.getCurrentText(child, fullText).trim() +
                    separator
            )
            .join("");
    }

    private assignEndValue(
        node: SyntaxNode,
        fullText: Readonly<FullText>
    ): void {
        const endNode = node.children.find(
            (child) => child.type === SyntaxNodeType.EndKeyword
        );
        this.endValue = endNode
            ? FormatterHelper.getCurrentText(endNode, fullText).trim()
            : "";
    }

    private getPrettyBlock(): string {
        return ""
            .concat(this.forKey)
            .concat(this.forTypeKey === "" ? "" : " ")
            .concat(this.forTypeKey.trim())
            .concat(this.recordValue === "" ? "" : " ")
            .concat(this.recordValue.trim())
            .concat(this.queryTuningLockKey === "" ? "" : " ")
            .concat(this.queryTuningLockKey.trim())
            .concat(this.whereKey === "" ? "" : " ")
            .concat(this.whereKey.trim())
            .concat(this.whereValue === "" ? "" : " ")
            .concat(this.whereValue === "" ? " " : "\r\n")
            .concat(
                this.whereValue === "" ? "" : " ".repeat(this.recordValueColumn)
            )
            .concat(this.whereValue.trim())
            .concat(this.byValue === "" ? "" : " ")
            .concat(this.byValue.trim())
            .concat(":")
            .concat(this.forBodyValue === "" ? " " : "\r\n")
            .concat(
                this.forBodyValue === ""
                    ? ""
                    : " ".repeat(this.forBlockValueColumn)
            )
            .concat(this.forBodyValue.trim())
            .concat(this.queryTuningNoPrefetchKey === "" ? "" : " ")
            .concat(this.queryTuningNoPrefetchKey.trim())
            .concat("\r\n")
            .concat(" ".repeat(this.startColumn))
            .concat(this.endValue)
            .concat(".");
    }
}
