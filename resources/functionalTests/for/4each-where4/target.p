/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": false,
"AblFormatter.forFormatting": true
}*/

for each xlatedb.XL_GlossDet no-lock where
         xlatedb.XL_GlossDet.GlossaryName = s_Glossary:  
    export xlatedb.XL_GlossDet.SourcePhrase xlatedb.XL_GlossDet.TargetPhrase.
end.