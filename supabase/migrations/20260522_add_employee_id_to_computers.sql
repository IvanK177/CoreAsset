-- Add employee_id column to computers table for direct employee-computer linking
ALTER TABLE computers ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Populate employee_id from existing workplaces data
UPDATE computers SET employee_id = w.employee_id
FROM workplaces w
WHERE w.computer_id = computers.id AND w.employee_id IS NOT NULL;