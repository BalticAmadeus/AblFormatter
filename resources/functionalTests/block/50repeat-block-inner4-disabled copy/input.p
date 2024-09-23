/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true}*/

CLASS ComplexClass:

    /* Constructor */
    CONSTRUCTOR PUBLIC ComplexClass():
        MESSAGE "ComplexClass instance created." VIEW-AS ALERT-BOX.
    END CONSTRUCTOR.

    /* Method with error handling */
    METHOD PUBLIC VOID ProcessData(INPUT data AS CHARACTER):
        DEF VAR result AS INTEGER NO-UNDO.
        
        /* Try-catch block */
        DO ON ERROR UNDO, THROW:
            IF LENGTH(data) > 0 THEN
                result = LENGTH(data).
            ELSE
                THROW NEW Progress.Lang.AppError("Data cannot be empty", 1001).
            END.
        CATCH e AS Progress.Lang.Error:
            MESSAGE "Error: " + e:Message VIEW-AS ALERT-BOX ERROR.
        END CATCH.
    END METHOD.

END CLASS.
