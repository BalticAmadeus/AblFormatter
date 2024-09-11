/* formatterSettingsOverride */
/*  { "AblFormatter.forFormatting": true}*/

FOR EACH Employee NO-LOCK WHERE
         Employee.Salary > 50000
         BREAK BY Employee.Department:
    DISPLAY Employee.Department Employee.Name Employee.Salary.
END.
