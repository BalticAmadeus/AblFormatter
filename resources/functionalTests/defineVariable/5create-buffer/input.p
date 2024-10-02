/* formatterSettingsOverride */
/*  { "AblFormatter.variableDefinitionFormatting": true} */

CREATE BUFFER ghFileBuff FOR TABLE pcDbName + "._file" IN WIDGET-POOL "datasetPool".
CREATE BUFFER ghFilTrgBuff FOR TABLE pcDbName + "._file-trig" IN WIDGET-POOL "datasetPool".
CREATE BUFFER ghFieldBuff  FOR TABLE pcDbName + "._field" IN WIDGET-POOL "datasetPool".