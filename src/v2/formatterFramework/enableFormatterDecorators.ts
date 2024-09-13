import { AssignFormatter } from "../formatters/assign/AssignFormatter";
import { BlockFormater } from "../formatters/block/BlockFormatter";
import { IfFormatter } from "../formatters/if/IfFormatter";
import { DefineFormatter } from "../formatters/define/DefineFormatter";
import { UsingFormatter } from "../formatters/using/UsingFormatter";
import { CaseFormatter } from "../formatters/case/CaseFormatter";
import { FindFormatter } from "../formatters/find/FindFormatter";
import { ForFormatter } from "../formatters/for/ForFormatter";
import { IfFunctionFormatter } from "../formatters/ifFunction/IfFunctionFormatter";
import { TempTableFormatter } from "../formatters/tempTable/TempTableFormatter";
import { PropertyFormatter } from "../formatters/property/PropertyFormatter";
import { BodyFormatter } from "../formatters/body/BodyFormatter";

// needed just for enabling decorators. Decorators does not work if there is no usage of a class in the reachable code
export function enableFormatterDecorators(): void {
    AssignFormatter;
    BlockFormater;
    BodyFormatter;
    IfFormatter;
    DefineFormatter;
    UsingFormatter;
    CaseFormatter;
    FindFormatter;
    ForFormatter;
    TempTableFormatter;
    PropertyFormatter;
    IfFunctionFormatter;
}
