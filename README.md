# AblFormatter

VSCode extension for Progress OpenEdge code formatting

## Feature Summary

Already implemented:
- Block
- Assign
- Define

|  | Feature | Default value | Values | Code example |
|--|---------|---------------|-----------------|--------------|
|  | tabSize | 4 | Number |  |
|  | assignFormatting | true | Boolean |  |
|  | assignFormattingAssignLocation | New | New, Same |  |
|  | assignFormattingAlignRightExpression | Yes | Yes, No |  |
|  | assignFormattingEndDotLocation | New aligned | New, New aligned, Same |  |
|  | defineFormatting | true | Boolean |  |
|  | findFormatting | true | Boolean |  |
|  | forFormatting | true | Boolean |  |
|  | caseFormatting | true | Boolean |  |
|  | blockFormatting | true | Boolean |  |
|  | ifFormatting | true | Boolean |  |
|  | ifFormattingThenLocation | Same | New, Same | `if true then return a.` <br> ⬇️ <br> `if true`<br>`then return a.` |
|  | ifFormattingDoLocation | Same | New, Same | `if true then do:`<br>`    return a.`<br>`end.` <br> ⬇️ <br> `if true then`<br>`do:`<br>`    return a.`<br>`end.` |
|  | ifFormattingStatementLocation | Same | New, Same | `if true then return a.` <br> ⬇️ <br> `if true then`<br>`    return a.` |
|  | temptableFormatting | true | Boolean |  |
