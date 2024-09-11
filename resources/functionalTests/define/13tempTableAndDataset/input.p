/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": true,
"AblFormatter.defineFormatting": true,
"abl.completion.upperCase": true,
"AblFormatter.temptableFormatting": true}*/

DEF TEMP-TABLE ttCustomer NO-UNDO
    FIELD CustNum AS INTEGER
    FIELD Name AS CHARACTER.

DEF DATASET dsCustomer FOR ttCustomer.
