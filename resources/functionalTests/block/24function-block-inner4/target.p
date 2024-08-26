/* formatterSettingsOverride */
/*  { "AblFormatter.blockFormatting": false}*/

function fun returns integer (input pInt as integer):
define variable a as integer no-undo initial 3.
 a += pInt.
  pInt *= a.
    return a + 2 * pInt.
 end function.