BLOCK-LEVEL ON ERROR UNDO, THROW.

USING Common.Language.ILanguageService.
USING Common.Language.ILanguageRepository.
USING Common.Language.Language.
USING Common.Language.LanguageError.
USING Common.Language.LanguageService.

CLASS Common.Language.LanguageService IMPLEMENTS ILanguageService:
  DEFINE PRIVATE VARIABLE oRepo AS ILanguageRepository NO-UNDO.

  CONSTRUCTOR PUBLIC LanguageService (poRepo AS ILanguageRepository):
    THIS-OBJECT:oRepo = poRepo.
  END CONSTRUCTOR.

  METHOD PUBLIC Language GetByID(pcID AS CHARACTER):
    RETURN THIS-OBJECT:oRepo:GetByID(pcID).
  END METHOD.

  METHOD PUBLIC Language GetByISO(pcISO AS CHARACTER):
    RETURN THIS-OBJECT:oRepo:GetByISO(pcISO).
  END METHOD.

  METHOD PUBLIC LOGICAL ExistByISO(pcISO AS CHARACTER):
    THIS-OBJECT:oRepo:GetByISO(pcISO).
    RETURN TRUE.

    CATCH e AS LanguageError:
      RETURN FALSE.
    END.
  END METHOD.

  METHOD PUBLIC Language GetByNameEn(pcNameEn AS CHARACTER):
    RETURN THIS-OBJECT:oRepo:GetByNameEn(pcNameEn).
  END METHOD.

END CLASS.