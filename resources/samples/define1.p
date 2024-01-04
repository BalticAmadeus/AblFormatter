/* formatterSettingsOverride */
/*  { "AblFormatter.defineFormatting": true,
    "abl.completion.upperCase": true}*/
FUNCTION GET_STUFF RETURNS Progress.Json.ObjectModel.JsonObject (cParam1 AS CHARACTER):
    DEF VARIABLE jsonTableRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    RETURN jsonTableRow.
END FUNCTION.