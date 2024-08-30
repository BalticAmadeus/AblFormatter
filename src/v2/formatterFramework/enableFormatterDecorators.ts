import { AssignFormatter } from "../formatters/assign/AssignFormatter";
import { BlockFormater } from "../formatters/block/BlockFormatter";
import { IfFormatter } from "../formatters/if/IfFormatter";
import { DefineFormatter } from "../formatters/define/DefineFormatter";
import { UsingFormatter } from "../formatters/using/UsingFormatter";
import { CaseFormatter } from "../formatters/case/CaseFormatter";
import { ForFormatter } from "../formatters/for/ForFormatter";
import { IfFunctionFormatter } from "../formatters/ifFunction/IfFunctionFormatter";
import { EmptyBlockFormatter } from "../formatters/emptyblock/EmptyBlockFormatter";
import { TempTableFormatter } from "../formatters/tempTable/TempTableFormatter";
import { PropertyFormatter } from "../formatters/property/PropertyFormatter";

// needed just for enabling decorators. Decorators does not work if there is no usage of a class in the reachable code
export function enableFormatterDecorators(): void {
    AssignFormatter;
    BlockFormater;
    IfFormatter;
    DefineFormatter;
    UsingFormatter;
    CaseFormatter;
    ForFormatter;
    EmptyBlockFormatter;
    TempTableFormatter;
    PropertyFormatter;
    IfFunctionFormatter;
}
