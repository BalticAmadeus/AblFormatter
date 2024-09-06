/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true}*/

interface test:
      define public property x as integer no-undo
      get.
      set.
            method public void LogMessage(input msg as character).
  
      method public integer GetProgress().
  
      method public void SetProgress(input num as integer).
end interface.