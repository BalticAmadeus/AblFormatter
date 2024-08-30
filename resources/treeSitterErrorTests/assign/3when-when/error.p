define variable number11 as integer no-undo.
define variable number2  as integer no-undo initial 3.
define variable number3  as integer no-undo initial 3.

assign
  number2  = 2
  when 
  number3 = 2
  number11 = 2
  when
  number3 = 2.