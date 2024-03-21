import * as fs from 'fs';
import Parser, { Tree } from "web-tree-sitter";

export class FormatterCache {
    private static cacheFilePath = 'cache.json';
    private static cache = new Map<any, any>();

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
            const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or cannot be parsed, return an empty object
            return {};
        }
    }

    private static saveCache(cache: { [filePath: string]: string }): void {
        fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
    }

    private static clearCacheFile() {
        try {
            fs.unlinkSync(this.cacheFilePath);
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
