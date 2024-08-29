export class MyFancySet<T> extends Set {
    public hasFancy(value: T, inCaseOfNotHave: T): T {
        if (this.has(value)) {
            return value;
        } else {
            return inCaseOfNotHave;
        }
    }
}
