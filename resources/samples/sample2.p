FUNCTION GET_STUFF RETURNS Progress.Json.ObjectModel.JsonObject (cParam1 AS CHARACTER):
    def VARIABLE jsonTableRow AS INT NO-UNDO.
    def VARIABLE jsonTableRow2 AS INT NO-UNDO.
    ASSIGN
        jsonTableRow     = IF TRUE THEN 1 ELSE 2
        jsonTableRow2222 = 2
    .


    ASSIGN
        jsonTableRow2222 = "1" + "2"
    .
    IF TRUE THEN assign jsonTableRow2222 = "1" + STRING(10000).

    Define buffer vacation for Vacation.

    // Vacation

    for each vacation:
    end.

    Define buffer aaaa for a.

    IF FALSE THEN DO:
        ASSIGN
            jsonTableRow     = IF TRUE THEN 1 ELSE 2
            jsonTableRow2222 = 2
            jsonTableRow2223 = new Obj.Parser()
        .
    END.

    RETURN jsonTableRow.

END FUNCTION.