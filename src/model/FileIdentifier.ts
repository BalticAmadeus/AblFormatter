export class FileIdentifier {
    public name: string = "";
    public version: number = 1000000;

    constructor(name: string, version: number) {
        this.name = name;
        this.version = version;
    }
    toKey() {
        return `Pair(${this.name}, ${this.version})`;
    }
    static key(name: string, version: number) {
        return new FileIdentifier(name, version).toKey();
    }
}
