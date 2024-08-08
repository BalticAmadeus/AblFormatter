import { AssignFormatter } from "../formatters/AssignFormatter";
import { BlockFormater } from "../formatters/BlockFormatter";

// needed just for enabling decorators. Decorators does not work if there is no usage of a class in the reachable code
export function formatterList(): void {
    AssignFormatter;
    BlockFormater;
}
