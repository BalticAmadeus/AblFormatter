/* formatterSettingsOverride */
/*  { "AblFormatter.variableDefinitionFormatting": true} */

DEFINE TEMP-TABLE ttObjectBand NO-UNDO     
FIELD ObjectName    AS CHARACTER FORMAT "x(15)"
FIELD RunAttribute  AS CHARACTER FORMAT "x(15)"
FIELD ResultCode    AS CHARACTER                /* This field is required for customization of menus on a container - part of the unique primary index */
FIELD Sequence      AS INTEGER  
FIELD Action        AS CHAR 
FIELD Band          AS CHARACTER FORMAT "x(28)"
FIELD InsertSubmenu AS LOGICAL       
INDEX key1 AS PRIMARY UNIQUE ObjectName RunAttribute ResultCode Sequence      
INDEX key2 Band ObjectName RunAttribute
INDEX key3 Action ObjectName RunAttribute Sequence.
