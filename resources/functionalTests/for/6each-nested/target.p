/* formatterSettingsOverride */
/*  { "AblFormatter.forFormatting": true}*/

FOR EACH Department NO-LOCK:
    DISPLAY Department.Name.
    
    FOR EACH Employee NO-LOCK WHERE
             Employee.Department = Department.DepartmentID
             BREAK BY Employee.JobTitle:
        DISPLAY Employee.JobTitle Employee.Name Employee.Salary.
        
        FOR EACH Project NO-LOCK WHERE
                 Project.EmployeeID = Employee.EmployeeID:
            DISPLAY Project.ProjectName Project.StartDate Project.EndDate.
        END.
    END.
END.

