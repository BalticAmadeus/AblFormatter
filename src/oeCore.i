FUNCTION GET_TABLE_ROW RETURNS Progress.Json.ObjectModel.JsonObject (cFileName AS CHARACTER, iFileNumber AS INTEGER):
    DEFINE VARIABLE jsonTableRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE cTableType AS CHARACTER NO-UNDO.

    jsonTableRow = NEW Progress.Json.ObjectModel.JsonObject().

    jsonTableRow:Add("name", cFileName).

    IF cFileName BEGINS "_sys"
    THEN cTableType = "SQLCatalog".
    ELSE IF iFileNumber > 0 AND iFileNumber < 32000
    THEN cTableType = "UserTable".
    ELSE IF iFileNumber > -80 AND iFileNumber < 0
    THEN cTableType = "SchemaTable".
    ELSE IF iFileNumber < -16384
    THEN cTableType = "VirtualSystem".
    ELSE IF iFileNumber >= -16384 AND iFileNumber <= -80
    THEN cTableType = "OtherTables".

    jsonTableRow:Add("tableType", cTableType).

    RETURN jsonTableRow.

END FUNCTION.

PROCEDURE LOCAL_PROCESS:
    RUN LOCAL_CONNECT.

    MESSAGE "RECEIVED COMMAND: " inputObject:GetCharacter("command").

    LOG-MANAGER:WRITE-MESSAGE("RECEIVED COMMAND: " + inputObject:GetCharacter("command")).

    CASE inputObject:GetCharacter("command"):
        WHEN "get_version" THEN DO:
            RUN LOCAL_GET_VERSION.
        END.
        WHEN "get_tables" THEN DO:
            RUN LOCAL_GET_TABLES.
        END.
        WHEN "get_table_data" THEN DO:
            RUN LOCAL_GET_TABLE_DATA.
        END.
        WHEN "submit_table_data" THEN DO:
            RUN LOCAL_SUBMIT_TABLE_DATA.
        END.
        WHEN "get_table_details" THEN DO:
            RUN LOCAL_GET_TABLE_DETAILS.
        END.
        OTHERWISE DO:
            UNDO, THROW NEW Progress.Lang.AppError("Unknown command", 501).
        END.
    END CASE.

    FINALLY:
        DISCONNECT DICTDB NO-ERROR.
    END.
END PROCEDURE.

FUNCTION CREATE_DEBUG RETURNS Progress.Json.ObjectModel.JsonObject (tmpDate AS DATETIME-TZ, cProcedure AS CHAR):
    DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    jsonDebug = jsonObject:GetJsonObject("debug").
    jsonDebug:Add(SUBSTITUTE("start&1", cProcedure), tmpDate).
    jsonDebug:Add(SUBSTITUTE("end&1", cProcedure), NOW).
    jsonDebug:Add(SUBSTITUTE("time&1", cProcedure), NOW - tmpDate).

    RETURN jsonDebug.
END FUNCTION.

PROCEDURE LOCAL_CONNECT:
    DEFINE VARIABLE tmpDate AS DATETIME-TZ NO-UNDO.

    tmpDate = NOW.
    CONNECT VALUE(inputObject:GetCharacter("connectionString")) NO-ERROR.
    IF ERROR-STATUS:ERROR THEN DO:
        UNDO, THROW NEW Progress.Lang.AppError(ERROR-STATUS:GET-MESSAGE(1), ERROR-STATUS:GET-NUMBER(1)).
    END.

    jsonObject:Set("debug", CREATE_DEBUG(tmpDate, "Connect")).

    IF NUM-DBS = 0 THEN DO:
        UNDO, THROW NEW Progress.Lang.AppError("No database connected", 500).
    END.
END PROCEDURE.

PROCEDURE LOCAL_GET_DEBUG:
    DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    IF NOT jsonObject:Has("debug") THEN DO:
        jsonObject:Add("debug", NEW Progress.Json.ObjectModel.JsonObject()).
    END.

    jsonObject:Set("debug", CREATE_DEBUG(tmpDate, "")).
END PROCEDURE.

PROCEDURE LOCAL_GET_VERSION:
    jsonObject:Add("dbversion", DBVERSION(1)).
    jsonObject:Add("proversion", PROVERSION(1)).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLES:

    DEFINE VARIABLE jsonTableRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE jsonTables AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
    DEFINE VARIABLE qhFile AS WIDGET-HANDLE NO-UNDO.
    DEFINE VARIABLE bhFile AS HANDLE  NO-UNDO.

    jsonTableRow = NEW Progress.Json.ObjectModel.JsonObject().
    jsonTables = NEW Progress.Json.ObjectModel.JsonArray().

    CREATE BUFFER bhFile FOR TABLE "_file".
    CREATE QUERY qhFile.
    qhFile:SET-BUFFERS(bhFile).
    qhFile:QUERY-PREPARE("FOR EACH _file NO-LOCK BY _file._file-name").
    qhFile:QUERY-OPEN.

    DO WHILE qhFile:GET-NEXT():
        jsonTableRow = NEW Progress.Json.ObjectModel.JsonObject().
        jsonTableRow:Add("name", qhFile:GET-BUFFER-HANDLE(1)::_file-name).

        IF NOT qhFile:GET-BUFFER-HANDLE(1)::_file-name BEGINS "_sys" AND
        qhFile:GET-BUFFER-HANDLE(1)::_file-number = 0 OR
        qhFile:GET-BUFFER-HANDLE(1)::_file-number > 32000
            THEN NEXT.
        ELSE jsonTables:Add(GET_TABLE_ROW(qhFile:GET-BUFFER-HANDLE(1)::_file-name, qhFile:GET-BUFFER-HANDLE(1)::_file-number)).
    END.

    qhFile:QUERY-CLOSE().
    DELETE OBJECT qhFile.
    DELETE OBJECT bhFile.

    jsonObject:Add("tables", jsonTables).
END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DETAILS:
        DEFINE VARIABLE jsonField AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
        DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
        DEFINE VARIABLE jsonIndexes AS Progress.Json.ObjectModel.JsonArray NO-UNDO.

        DEFINE VARIABLE bhFile AS HANDLE NO-UNDO.
        DEFINE VARIABLE bhIndex AS HANDLE NO-UNDO.
        DEFINE VARIABLE bhIndexField AS HANDLE NO-UNDO.
        DEFINE VARIABLE bhField AS HANDLE NO-UNDO.
        DEFINE VARIABLE qhIndex AS WIDGET-HANDLE NO-UNDO.
        DEFINE VARIABLE qhField AS WIDGET-HANDLE NO-UNDO.

        DEFINE VARIABLE cFieldQuery AS CHARACTER NO-UNDO.
        DEFINE VARIABLE cIndexQuery AS CHARACTER NO-UNDO.


        jsonFields = NEW Progress.Json.ObjectModel.JsonArray().
        jsonIndexes = NEW Progress.Json.ObjectModel.JsonArray().

        // get fields table details

        CREATE BUFFER bhFile FOR TABLE "_file".
        CREATE BUFFER bhField FOR TABLE "_field".

        cFieldQuery = SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'" +
                                " , EACH _field OF _file BY _field._order",
                                inputObject:GetCharacter("params")).

        CREATE QUERY qhField.
        qhField:SET-BUFFERS(bhFile, bhField).
        qhField:QUERY-PREPARE(cFieldQuery).
        qhField:QUERY-OPEN.

        DO WHILE qhField:GET-NEXT():
            jsonField = NEW Progress.Json.ObjectModel.JsonObject().
            jsonField:Add("order", bhField::_order).
            jsonField:Add("name", bhField::_field-name).
            jsonField:Add("type", bhField::_data-type).
            jsonField:Add("format", bhField::_format).
            jsonField:Add("label", bhField::_label).
            jsonField:Add("initial", bhField::_initial).
            jsonField:Add("columnLabel", bhField::_col-label).
            jsonField:Add("mandatory", bhField::_mandatory).
            jsonField:Add("extent", bhField::_extent).
            jsonField:Add("decimals", bhField::_decimals).
            jsonField:Add("rpos", bhField::_field-rpos).
            jsonField:Add("valExp", bhField::_valexp).
            jsonField:Add("valMessage", bhField::_valmsg).
            jsonField:Add("helpMsg", bhField::_help).
            jsonField:Add("description", bhField::_desc).
            jsonField:Add("viewAs", bhField::_view-as).
            jsonFields:Add(jsonField).
        END.

        qhField:QUERY-CLOSE().
        DELETE OBJECT bhField.
        DELETE OBJECT qhField.
        DELETE OBJECT bhFile.

        // get Index table details

        CREATE BUFFER bhFile FOR TABLE "_file".
        CREATE BUFFER bhIndex FOR TABLE "_Index".
        CREATE BUFFER bhIndexField FOR TABLE "_Index-Field".
        CREATE BUFFER bhField FOR TABLE "_Field".

        DEFINE BUFFER bttIndex FOR ttIndex.

        EMPTY TEMP-TABLE bttIndex.

        cIndexQuery = SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'" +
                            " , EACH _Index OF _file NO-LOCK" +
                            " , EACH _Index-field OF _Index NO-LOCK" +
                            " , EACH _Field OF _Index-field NO-LOCK",
                            inputObject:GetCharacter('params')).

        CREATE QUERY qhIndex.
        qhIndex:SET-BUFFERS(bhFile, bhIndex, bhIndexField, bhField).
        qhIndex:QUERY-PREPARE(cIndexQuery).
        qhIndex:QUERY-OPEN.

        DO WHILE qhIndex:GET-NEXT():
            DEFINE VARIABLE cFlags AS CHARACTER NO-UNDO.
            DEFINE VARIABLE cFields AS CHARACTER NO-UNDO.

            FIND bttIndex WHERE bttIndex.cName = bhIndex::_Index-name NO-ERROR.
            IF NOT AVAILABLE bttIndex THEN DO:
                CREATE bttIndex.

                //index name
                bttIndex.cName = bhIndex::_Index-name.

                //index flags
                cFlags = SUBSTITUTE("&1 &2 &3",
                                            STRING(bhFile::_prime-index = bhIndex:RECID, "P/"),
                                            STRING(bhIndex::_unique, "U/"),
                                            STRING(bhIndex::_WordIdx <> ?, "W/")
                                            ).
                cFlags = TRIM(cFLags).
                bttIndex.cFlags = cFlags.
            END.

            //index field
            cFields = SUBSTITUTE("&1 &2&3",
                                bttIndex.cFields,
                                bhField::_Field-name,
                                STRING(bhIndexField::_ascending, '+/-')
                                ).


            cFields = TRIM(cFields).
            bttIndex.cFields = cFields.
        END.

        qhIndex:QUERY-CLOSE().
        DELETE OBJECT bhFile.
        DELETE OBJECT bhIndex.
        DELETE OBJECT bhIndexField.
        DELETE OBJECT bhField.

        jsonIndexes:Read(TEMP-TABLE bttIndex:HANDLE).

        jsonObject:Add("fields", jsonFields).
        jsonObject:Add("indexes", jsonIndexes).
END PROCEDURE.

PROCEDURE GET_ROW_DATA:
    DEFINE INPUT PARAMETER hfield AS WIDGET-HANDLE NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonRawRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonFormattedRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE cCellValue AS CHARACTER NO-UNDO.
    DEFINE VARIABLE iFieldNum AS INTEGER NO-UNDO.
    DEFINE VARIABLE iExtentSize AS INTEGER NO-UNDO.

    DEFINE BUFFER bttColumn FOR ttColumn.

    jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
    jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().
    jsonRawRow:Add("ROWID", STRING(hfield:ROWID)).
    jsonFormattedRow:Add("ROWID", STRING(hfield:ROWID)).

    DO iFieldNum = 1 TO hfield:NUM-FIELDS:

        FIND bttColumn  WHERE bttColumn.cName = hfield:BUFFER-FIELD(iFieldNum):NAME NO-ERROR .
        IF AVAILABLE bttColumn
        THEN DO:
            IF LOOKUP(bttColumn.cType, 'clob,blob') = 0 THEN DO:
                jsonRawRow:Add(hfield:BUFFER-FIELD(iFieldNum):NAME, hfield:BUFFER-FIELD(iFieldNum):BUFFER-VALUE).

                cCellValue = STRING(hfield:BUFFER-FIELD(iFieldNum):BUFFER-VALUE, bttColumn.cFormat) NO-ERROR.
                jsonFormattedRow:Add(hfield:BUFFER-FIELD(iFieldNum):NAME, cCellValue).
            END.
            ELSE IF bttColumn.cType = "raw" THEN DO:
                jsonRawRow:Add(hfield:BUFFER-FIELD(iFieldNum):NAME, STRING(hfield:BUFFER-FIELD(iFieldNum):BUFFER-VALUE)).
            END.
            ELSE DO:
                DEFINE VARIABLE cDummy AS CHARACTER NO-UNDO.
                cDummy = ?.
                jsonRawRow:Add(hfield:BUFFER-FIELD(iFieldNum):NAME, cDummy).
            END.
        END.
        ELSE DO:
            iExtentSize = 0.
            FOR EACH bttColumn WHERE INDEX(bttColumn.cName, SUBSTITUTE("&1[", hfield:BUFFER-FIELD(iFieldNum):NAME)) = 1 NO-LOCK:
                iExtentSize = iExtentSize + 1.
                jsonRawRow:Add(bttColumn.cName, hfield:BUFFER-FIELD(iFieldNum):BUFFER-VALUE(iExtentSize)).

                cCellValue = STRING(hfield:BUFFER-FIELD(iFieldNum):BUFFER-VALUE(iExtentSize), bttColumn.cFormat) NO-ERROR.
                jsonFormattedRow:Add(bttColumn.cName, cCellValue).
            END.
        END.
    END.
END PROCEDURE.

FUNCTION CHECK_IF_EXPORT RETURNS LOGICAL ():
    IF inputObject:GetJsonObject("params"):Has("exportType")
    THEN RETURN TRUE.

    ELSE RETURN FALSE.
END FUNCTION.

FUNCTION CHECK_IF_DUMPFILE RETURNS LOGICAL ():
    IF inputObject:GetJsonObject("params"):GetCharacter("exportType") = "dumpFile"
    THEN RETURN TRUE.

    ELSE RETURN FALSE.
END FUNCTION.

FUNCTION GET_COLUMNS RETURNS Progress.Json.ObjectModel.JsonArray (lDumpFile AS LOGICAL):
    DEFINE VARIABLE jsonFields AS Progress.Json.ObjectModel.JsonArray NO-UNDO.

    DEFINE VARIABLE bhFile AS HANDLE  NO-UNDO.
    DEFINE VARIABLE qhFile AS HANDLE NO-UNDO.
    DEFINE VARIABLE qhField AS HANDLE NO-UNDO.
    DEFINE VARIABLE bhField AS HANDLE  NO-UNDO.

    DEFINE VARIABLE iFieldCount AS INTEGER NO-UNDO.

    DEFINE BUFFER bttColumn FOR ttColumn.

    jsonFields = NEW Progress.Json.ObjectModel.JsonArray().

    CREATE BUFFER bhFile FOR TABLE "_file".
    CREATE QUERY qhFile.
    qhFile:SET-BUFFERS(bhFile).
    qhFile:QUERY-PREPARE(SUBSTITUTE("FOR EACH _file WHERE _file._file-name = '&1'", inputObject:GetJsonObject("params"):GetCharacter("tableName"))).
    qhFile:QUERY-OPEN.

    DO WHILE qhFile:GET-NEXT():

        CREATE BUFFER bhField FOR TABLE "_field".
        CREATE QUERY qhField.
        qhField:SET-BUFFERS(bhField).
        qhField:QUERY-PREPARE(SUBSTITUTE("FOR each _field where _field._file-recid = &1 BY _field._order", qhFile:GET-BUFFER-HANDLE(1):RECID)).
        qhField:QUERY-OPEN.

        EMPTY TEMP-TABLE bttColumn.

        CREATE bttColumn.
        bttColumn.cName = "ROWID".
        bttColumn.cKey = "ROWID".
        bttColumn.cLabel = "ROWID".
        bttColumn.cType = "ROWID".
        bttColumn.cFormat = ?.

        DO WHILE qhField:GET-NEXT():
            IF NOT lDumpFile THEN DO:
                IF LOOKUP(qhField:GET-BUFFER-HANDLE(1)::_data-type, 'clob,blob,raw') <> 0
                THEN NEXT.
            END.

            IF qhField:GET-BUFFER-HANDLE(1)::_extent = 0
            THEN DO:
                CREATE bttColumn.
                bttColumn.cName = qhField:GET-BUFFER-HANDLE(1)::_field-name.
                bttColumn.cKey = qhField:GET-BUFFER-HANDLE(1)::_field-name.
                bttColumn.cLabel = qhField:GET-BUFFER-HANDLE(1)::_field-name.
                bttColumn.cType = qhField:GET-BUFFER-HANDLE(1)::_data-type.
                bttColumn.cFormat = qhField:GET-BUFFER-HANDLE(1)::_format.
                bttColumn.iExtent = qhField:GET-BUFFER-HANDLE(1)::_extent.
            END.
            ELSE DO:
                DO iFieldCount = 1 TO qhField:GET-BUFFER-HANDLE(1)::_extent:
                    CREATE bttColumn.
                    bttColumn.cName = SUBSTITUTE("&1[&2]", qhField:GET-BUFFER-HANDLE(1)::_field-name, iFieldCount).
                    bttColumn.cKey = SUBSTITUTE("&1[&2]", qhField:GET-BUFFER-HANDLE(1)::_field-name, iFieldCount).
                    bttColumn.cLabel = qhField:GET-BUFFER-HANDLE(1)::_field-name.
                    bttColumn.cType = qhField:GET-BUFFER-HANDLE(1)::_data-type.
                    bttColumn.cFormat = qhField:GET-BUFFER-HANDLE(1)::_format.
                    bttColumn.iExtent = qhField:GET-BUFFER-HANDLE(1)::_extent.
                END.
            END.
        END.
        jsonFields:Read(TEMP-TABLE bttColumn:HANDLE).

        qhField:QUERY-CLOSE().
        DELETE OBJECT qhField.
        DELETE OBJECT bhField.
    END.

    qhFile:QUERY-CLOSE().
    DELETE OBJECT qhFile.
    DELETE OBJECT bhFile.

    RETURN jsonFields.
END FUNCTION.

FUNCTION GET_MODE RETURNS CHARACTER ():
    IF NOT inputObject:GetJsonObject("params"):has("mode") THEN RETURN "DATA".
    RETURN inputObject:GetJsonObject("params"):GetCharacter("mode").
END FUNCTION.

FUNCTION GET_WHERE_PHRASE RETURNS CHARACTER ():
    DEFINE VARIABLE jsonFilter AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE cWherePhrase AS CHARACTER NO-UNDO.
    DEFINE VARIABLE cFilterNames AS CHARACTER EXTENT NO-UNDO.

    DEFINE VARIABLE iFilterNameCount AS INTEGER NO-UNDO.

    IF inputObject:GetJsonObject("params"):has("wherePhrase") THEN DO:
        IF TRIM(inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")) > "" THEN DO:
            cWherePhrase = SUBSTITUTE("WHERE (&1) ", inputObject:GetJsonObject("params"):GetCharacter("wherePhrase")).
        END.
    END.

    IF inputObject:GetJsonObject("params"):Has("filters") AND
    inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetLogical("enabled") = TRUE THEN DO:

        jsonFilter = inputObject:GetJsonObject("params"):GetJsonObject("filters"):GetJsonObject("columns").
        cFilterNames = jsonFilter:GetNames().

        IF EXTENT(cFilterNames) <= 0 THEN DO:
            RETURN cWherePhrase.
        END.

        DO iFilterNameCount = 1 TO EXTENT(cFilterNames):
            IF jsonFilter:GetCharacter(cFilterNames[iFilterNameCount]) > "" THEN DO:
                IF cWherePhrase = "" THEN DO:
                    cWherePhrase = "where".
                END.
                ELSE DO:
                    cWherePhrase = SUBSTITUTE("&1 AND", cWherePhrase).
                END.

                cWherePhrase = SUBSTITUTE("&1 STRING(&2.&3) BEGINS ~"&4~"",
                                        cWherePhrase,
                                        inputObject:GetJsonObject("params"):GetCharacter("tableName"),
                                        cFilterNames[iFilterNameCount],
                                        jsonFilter:GetCharacter(cFilterNames[iFilterNameCount])
                                        ).
            END.
        END.
    END.

    RETURN cWherePhrase.
END FUNCTION.

FUNCTION GET_ORDER_PHRASE RETURNS CHARACTER ():
    DEFINE VARIABLE jsonSort AS Progress.Json.ObjectModel.JsonArray NO-UNDO.

    DEFINE VARIABLE cOrderPhrase AS CHARACTER NO-UNDO.

    DEFINE VARIABLE iChar AS INTEGER NO-UNDO.

    IF inputObject:GetJsonObject("params"):has("sortColumns") THEN DO:
        jsonSort = inputObject:GetJsonObject("params"):GetJsonArray("sortColumns").
        DO iChar = 1 TO jsonSort:Length:
            cOrderPhrase = SUBSTITUTE("&1 BY &2.&3 &4",
                        cOrderPhrase,
                        inputObject:GetJsonObject("params"):GetCharacter("tableName"),
                        jsonSort:GetJsonObject(iChar):GetCharacter("columnKey"),
                        IF jsonSort:GetJsonObject(iChar):GetCharacter("direction") = "ASC" THEN "" ELSE "DESCENDING").
        END.
    END.

    RETURN cOrderPhrase.
END FUNCTION.

FUNCTION GET_CRUD RETURNS Progress.Json.ObjectModel.JsonArray ():
    IF inputObject:GetJsonObject("params"):has("crud") THEN DO:
        RETURN inputObject:GetJsonObject("params"):GetJsonArray("crud").
    END.
END FUNCTION.

PROCEDURE CREATE_PSC:
    DEFINE VARIABLE PSC AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    PSC = NEW Progress.Json.ObjectModel.JsonObject().
    PSC:Add("timestamp", SUBSTITUTE("&1/&2/&3-&4", STRING(YEAR( TODAY),"9999"), STRING(MONTH(TODAY),"99"), STRING(DAY(TODAY),"99"), STRING(TIME,"HH:MM:SS"))).
    PSC:Add("numformat", SUBSTITUTE("&1,&2", ASC(SESSION:NUMERIC-SEPARATOR), ASC(SESSION:NUMERIC-DECIMAL-POINT))).
    PSC:Add("dateformat", SUBSTITUTE("&1-&2", SESSION:DATE-FORMAT, SESSION:YEAR-OFFSET)).
    PSC:Add("cpstream", SESSION:CPSTREAM).
    JsonObject:Add("psc", PSC).

END PROCEDURE.

PROCEDURE LOCAL_GET_TABLE_DATA:
    DEFINE VARIABLE jsonRaw AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
    DEFINE VARIABLE jsonFormatted AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
    DEFINE VARIABLE jsonRawRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE jsonFormattedRow AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE jsonDebug AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE jsonCrud AS Progress.Json.ObjectModel.JsonArray NO-UNDO.

    DEFINE VARIABLE qhTableName AS HANDLE NO-UNDO.
    DEFINE VARIABLE bhTableName AS HANDLE  NO-UNDO.

    DEFINE VARIABLE iChar AS INTEGER NO-UNDO.
    DEFINE VARIABLE dtStart AS DATETIME-TZ NO-UNDO.
    DEFINE VARIABLE dtEnd AS DATETIME-TZ NO-UNDO.
    DEFINE VARIABLE iRemainingLength AS INTEGER NO-UNDO.
    DEFINE VARIABLE iTimeOut AS INTEGER NO-UNDO.
    DEFINE VARIABLE cWherePhrase AS CHARACTER NO-UNDO.
    DEFINE VARIABLE cOrderPhrase AS CHARACTER NO-UNDO.
    DEFINE VARIABLE cMode AS CHARACTER NO-UNDO.
    DEFINE VARIABLE lExport AS LOGICAL NO-UNDO INITIAL false.
    DEFINE VARIABLE lDumpFile AS LOGICAL No-UNDO INITIAL false.
    DEFINE VARIABLE iMinTime AS INTEGER NO-UNDO.

    DEFINE BUFFER bttColumn FOR ttColumn.

    jsonRaw = NEW Progress.Json.ObjectModel.JsonArray().
    jsonFormatted = NEW Progress.Json.ObjectModel.JsonArray().
    jsonDebug = jsonObject:GetJsonObject("debug").

    IF CHECK_IF_EXPORT() THEN DO:
        lExport = true.
        lDumpFile = CHECK_IF_DUMPFILE().
    END.
    ELSE DO:
        lExport = false.
        lDumpFile = false.
    END.

    jsonObject:ADD("columns", GET_COLUMNS(lDumpFile)).

    cMode = GET_MODE().

    IF cMode = "UPDATE" THEN DO:
    END.
    ELSE IF cMode = "DATA" THEN DO:
        cWherePhrase = GET_WHERE_PHRASE().

        cOrderPhrase = GET_ORDER_PHRASE().

        jsonCrud = GET_CRUD().
    END.

    IF CAN-DO("UPDATE,DATA,COPY", cMode) THEN DO:
        CREATE BUFFER bhTableName FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
        CREATE QUERY qhTableName.
        qhTableName:SET-BUFFERS(bhTableName).
        qhTableName:QUERY-PREPARE(SUBSTITUTE("FOR EACH &1 NO-LOCK &2 &3", inputObject:GetJsonObject("params"):GetCharacter("tableName"), cWherePhrase, cOrderPhrase)).
        qhTableName:QUERY-OPEN.

        IF lDumpFile THEN DO:
            RUN CREATE_PSC.
        END.

        IF inputObject:GetJsonObject("params"):GetCharacter("lastRowID") > "" AND
            qhTableName:REPOSITION-TO-ROWID(TO-ROWID(inputObject:GetJsonObject("params"):GetCharacter("lastRowID"))) THEN DO:
            IF cMode = "DATA" THEN DO:
                qhTableName:GET-NEXT().
            END.
        END.


        iRemainingLength = inputObject:GetJsonObject("params"):GetInteger("pageLength").
        iTimeOut = inputObject:GetJsonObject("params"):GetInteger("timeOut").
        iMinTime = inputObject:GetJsonObject("params"):GetInteger("minTime").
        dtStart = NOW.

        IF jsonCrud = ? THEN DO:
            TABLE_LOOP:
            DO WHILE qhTableName:GET-NEXT() STOP-AFTER 1 /*every data query should lasts not more then 1 second*/ ON STOP UNDO, LEAVE:
                jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
                jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().

                RUN GET_ROW_DATA(INPUT bhTableName:HANDLE,
                    OUTPUT jsonRawRow,
                    OUTPUT jsonFormattedRow).

                jsonRaw:Add(jsonRawRow).
                jsonFormatted:Add(jsonFormattedRow).
                iRemainingLength = iRemainingLength - 1.
                IF iRemainingLength <= 0 AND NOW - dtStart >= iMinTime THEN LEAVE.
                IF iTimeOut > 0 AND NOW - dtStart >= iTimeOut THEN LEAVE.
            END.
        END.
        ELSE DO:
            DO iChar = 1 TO jsonCrud:Length:
                qhTableName:REPOSITION-TO-ROWID(TO-ROWID(jsonCrud:GetCharacter(iChar))).
                qhTableName:GET-NEXT().

                jsonRawRow = NEW Progress.Json.ObjectModel.JsonObject().
                jsonFormattedRow = NEW Progress.Json.ObjectModel.JsonObject().

                RUN GET_ROW_DATA(INPUT bhTableName:HANDLE,
                    OUTPUT jsonRawRow,
                    OUTPUT jsonFormattedRow).

                jsonRaw:Add(jsonRawRow).
                IF NOT lExport
                THEN jsonFormatted:Add(jsonFormattedRow).
            END.
        END.

        dtEnd = NOW.

        qhTableName:QUERY-CLOSE().
        DELETE OBJECT qhTableName.
        DELETE OBJECT bhTableName.

        jsonObject:ADD("rawData", jsonRaw).
        IF NOT lExport
        THEN jsonObject:ADD("formattedData", jsonFormatted).

        jsonDebug:add("recordsRetrieved", jsonRaw:Length).
        jsonDebug:add("recordsRetrievalTime", dtEnd - dtStart).
    END.
END PROCEDURE.

FUNCTION SET_BUFFER_VALUE RETURNS LOG (INPUT-OUTPUT fhKey AS HANDLE, cMode AS CHAR,
                                    jsonModelObject AS Progress.Json.ObjectModel.JsonObject):
    CASE fhKey:DATA-TYPE:
        WHEN "CHARACTER" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> jsonModelObject:GetJsonText("defaultValue") THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 600).
            END.
            fhKey:BUFFER-VALUE = jsonModelObject:GetJsonText("value").
        END.
        WHEN "LOGICAL" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> LOGICAL(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 601).
            END.
            fhKey:BUFFER-VALUE = LOGICAL(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "INTEGER" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> INTEGER(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 602).
            END.
            fhKey:BUFFER-VALUE = INTEGER(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "INT64" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> INT64(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
            END.
            fhKey:BUFFER-VALUE = INT64(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "DECIMAL" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> DECIMAL(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
            END.
            fhKey:BUFFER-VALUE = DECIMAL(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "date" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 604).
            END.
            fhKey:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
        WHEN "datetime" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <>  OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 605).
            END.
            fhKey:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
        WHEN "datetime-tz" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE <> OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 606).
            END.
            fhKey:BUFFER-VALUE = OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
    END CASE.
End FUNCTION.

FUNCTION SET_BUFFER_VALUE_EXTENT RETURNS LOG (INPUT-OUTPUT fhKey AS HANDLE, cMode AS CHAR,
                                                                    jsonModelObject AS Progress.Json.ObjectModel.JsonObject):
    DEFINE VARIABLE j AS INTEGER NO-UNDO.

    j = INTEGER(ENTRY(1, ENTRY(2, jsonModelObject:GetCharacter("key"), "["), "]")).
    CASE fhKey:DATA-TYPE:
        WHEN "CHARACTER" THEN DO:

            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> jsonModelObject:GetJsonText("defaultValue") THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 600).
            END.
            fhKey:BUFFER-VALUE[j] = jsonModelObject:GetJsonText("value").
        END.
        WHEN "LOGICAL" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> LOGICAL(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 601).
            END.
            fhKey:BUFFER-VALUE[j] = LOGICAL(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "INTEGER" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> INTEGER(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 602).
            END.
            fhKey:BUFFER-VALUE[j] = INTEGER(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "INT64" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> INT64(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
            END.
            fhKey:BUFFER-VALUE[j] = INT64(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "DECIMAL" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> DECIMAL(jsonModelObject:GetJsonText("defaultValue")) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 603).
            END.
            fhKey:BUFFER-VALUE[j] = DECIMAL(jsonModelObject:GetJsonText("value")).
        END.
        WHEN "date" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 604).
            END.
            fhKey:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
        WHEN "datetime" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <>  OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 605).
            END.
            fhKey:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateTimeFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
        WHEN "datetime-tz" THEN DO:
            IF cMode = "UPDATE" AND fhKey:BUFFER-VALUE[j] <> OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonModelObject:GetJsonText("defaultValue"))) THEN DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record was changed", 606).
            END.
            fhKey:BUFFER-VALUE[j] = OpenEdge.Core.TimeStamp:ToABLDateTimeTzFromISO(STRING(jsonModelObject:GetJsonText("value"))).
        END.
    END CASE.
END FUNCTION.

PROCEDURE LOCAL_SUBMIT_TABLE_DATA:
    DEFINE VARIABLE jsonData AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
    DEFINE VARIABLE jsonCrud AS Progress.Json.ObjectModel.JsonArray NO-UNDO.
    DEFINE VARIABLE qh AS WIDGET-HANDLE NO-UNDO.
    DEFINE VARIABLE bh AS HANDLE  NO-UNDO.
    DEFINE VARIABLE fhKey AS HANDLE NO-UNDO.
    DEFINE VARIABLE cMode AS CHARACTER NO-UNDO.
    DEFINE VARIABLE lUseTriggers AS LOGICAL NO-UNDO.

    DEFINE VARIABLE i AS INTEGER NO-UNDO.


    jsonData = inputObject:GetJsonObject("params"):GetJsonArray("data").
    jsonCrud = inputObject:GetJsonObject("params"):GetJsonArray("crud").

    CREATE BUFFER bh FOR TABLE inputObject:GetJsonObject("params"):GetCharacter("tableName").
    CREATE QUERY qh.
    qh:SET-BUFFERS(bh).
    qh:QUERY-PREPARE(SUBSTITUTE("FOR EACH &1 NO-LOCK", inputObject:GetJsonObject("params"):GetCharacter("tableName"))).
    qh:QUERY-OPEN.

    cMode = inputObject:GetJsonObject("params"):GetCharacter("mode").

    lUseTriggers = inputObject:GetJsonObject("params"):GetLogical("useTriggers").

    IF cMode = "DELETE" THEN DO:
        DO i = 1 TO jsonCrud:Length:
            IF qh:REPOSITION-TO-ROWID(TO-ROWID(jsonCrud:GetCharacter(i))) THEN DO:
                IF qh:GET-NEXT(EXCLUSIVE-LOCK, NO-WAIT) THEN DO:
                    IF bh:LOCKED THEN DO:
                        UNDO, THROW NEW Progress.Lang.AppError("Record is locked", 503).
                    END.
                END.
                ELSE DO:
                    UNDO, THROW NEW Progress.Lang.AppError("Record not found", 504).
                END.
                bh:BUFFER-DELETE().

            END.
            ELSE DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record not found", 505).
            END.
        END.
    END.
    ELSE DO:
        IF cMode = "INSERT" OR cMode = "COPY" THEN DO:
            IF lUseTriggers = false THEN DO:
                bh:DISABLE-LOAD-TRIGGERS(FALSE).
                bh:DISABLE-DUMP-TRIGGERS( ).
            END.

            bh:BUFFER-CREATE().
        END.
        ELSE IF cMode = "UPDATE" THEN DO:
            IF lUseTriggers = false THEN DO:
                bh:DISABLE-LOAD-TRIGGERS(FALSE).
                bh:DISABLE-DUMP-TRIGGERS( ).
            END.

            IF qh:REPOSITION-TO-ROWID(TO-ROWID(inputObject:GetJsonObject("params"):GetCharacter("lastRowID"))) THEN DO:
                IF qh:GET-NEXT(EXCLUSIVE-LOCK, NO-WAIT) THEN DO:
                    IF bh:LOCKED THEN DO:
                        UNDO, THROW NEW Progress.Lang.AppError("Record is locked", 501).
                    END.
                END.
                ELSE DO:
                    UNDO, THROW NEW Progress.Lang.AppError("Record not found", 502).
                END.
            END.
            ELSE DO:
                UNDO, THROW NEW Progress.Lang.AppError("Record not found", 502).
            END.
        END.

        DO i = 1 TO jsonData:Length:
            fhKey = ?.
            ASSIGN fhKey = bh:BUFFER-FIELD(ENTRY(1, jsonData:GetJsonObject(i):GetCharacter("key"), "[")) NO-ERROR.
            IF NOT VALID-HANDLE(fhKey) THEN next.

            IF fhKey:EXTENT = 0 THEN
                SET_BUFFER_VALUE(fhKey, cMode, jsonData:GetJsonObject(i)).
            ELSE
                SET_BUFFER_VALUE_EXTENT(fhKey, cMode, jsonData:GetJsonObject(i)).
        END.
    END.
END PROCEDURE.

