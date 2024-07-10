import * as fs from "fs";
import * as path from "path";
import { extensions } from "vscode";
import Parser, { Tree } from "web-tree-sitter";

export class FormatterCache {
    private static cache = new Map<any, any>();

    private static getCacheFilePath(): string {
        const basePath = extensions.getExtension(
            "BalticAmadeus.AblFormatter"
        )?.extensionPath;

        if (basePath === undefined) {
            console.log("ERRRRRRRRRRRRRRRRRor. Cache file cannot be created!");
            return "";
        }

        return path.join(basePath, "cache.json");
    }

    public static getHash(filePath: string): string | undefined {
        const cache = this.loadCache();
        return cache[filePath];
    }

    public static updateHash(filePath: string, hash: string): void {
        const cache = this.loadCache();
        cache[filePath] = hash;
        this.saveCache(cache);
    }

    private static loadCache(): { [filePath: string]: string } {
        try {
            const data = fs.readFileSync(this.getCacheFilePath(), "utf-8");
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or cannot be parsed, return an empty object
            return {};
        }
    }

    private static saveCache(cache: { [filePath: string]: string }): void {
        try {
            fs.writeFileSync(
                this.getCacheFilePath(),
                JSON.stringify(cache, null, 2),
                "utf-8"
            );
        } catch (error) {
            console.log(
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                error
            );
        }
    }

    private static clearCacheFile() {
        try {
            fs.unlinkSync(this.getCacheFilePath());
        } catch (error) {
            // Handle error if file deletion fails
            console.error("Error clearing cache file:", error);
        }
    }

    public static clearCache() {
        this.cache.clear();
        this.clearCacheFile();
    }

    public static getTree(key: string): Parser.Tree {
        return this.cache.get(key);
    }

    public static setTree(key: string, tree: Tree) {
        this.cache.set(key, tree);
    }
}
