/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true,
"AblFormatter.propertyFormatting": true }*/
class AClass:
    define private property m_Total as integer no-undo
            get.
                        set.
    
    define PUBLIC PROPERTY propertyWidthGetterAndSetter AS SomeClass NO-UNDO
            GET:
                RETURN ?.
            END GET.
        SET(INPUT pValue AS SomeClass):
                    IF valid-object(pValue)
            THEN DO:
                        pValue:CallMethod().
                    END.
        END SET.
    
    define PRIVATE VARIABLE propertyWidthGetter_ AS SomeClass NO-UNDO.
    define PROTECTED PROPERTY propertyWidthGetter AS SomeClass NO-UNDO
            GET():
                    IF NOT valid-object(propertyWidthGetter_)
                THEN propertyWidthGetter = new SomeClass().
                            
                RETURN propertyWidthGetter_.
            END GET.
end class.