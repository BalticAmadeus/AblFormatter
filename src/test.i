
function GET_SAME RETURNS char (c as Char):
    ASSIGN
    c = "yys"
    c = "yys"
    .
    return c.

END function.

function GET_SAME_CHAR RETURNS char (c as Char):
    return c.
END function.