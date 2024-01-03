BLOCK-LEVEL ON ERROR UNDO, THROW.

USING Common.Language.LanguageError.

MESSAGE "Hello".

CATCH e AS LanguageError:
    RETURN FALSE.
END.
