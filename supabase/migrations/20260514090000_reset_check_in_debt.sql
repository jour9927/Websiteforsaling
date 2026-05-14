-- Reset makeup check-in debt that accumulated before the makeup system was opened.
UPDATE profiles
SET check_in_debt = 0
WHERE COALESCE(check_in_debt, 0) <> 0;
