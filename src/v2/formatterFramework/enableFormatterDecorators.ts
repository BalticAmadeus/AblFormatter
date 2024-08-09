import { AssignFormatter } from "../formatters/assign/AssignFormatter";
import { BlockFormater } from "../formatters/block/BlockFormatter";

// needed just for enabling decorators. Decorators does not work if there is no usage of a class in the reachable code
export function enableFormatterDecorators(): void {
    AssignFormatter;
    BlockFormater;
}
