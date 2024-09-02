/* formatterSettingsOverride */
/*  { "AblFormatter.caseFormatting": true,
"AblFormatter.blockFormatting": true,
"AblFormatter.caseFormattingThenLocation": "Same",
"AblFormatter.caseFormattingStatementLocation": "New"}*/

case pcBatchType:
    when BatchConst:TYPE_REFUND then iNextBatchNum = next-value(rfnd_batch_seq).
    otherwise undo, throw new AppException(subst("Invalid batch type '&1'", pcBatchType)).
end case.