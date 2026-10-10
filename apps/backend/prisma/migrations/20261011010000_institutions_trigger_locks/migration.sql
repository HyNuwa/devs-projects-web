-- Review fix for `institutions`: the plan–materia trigger read the materia, plan and
-- carrera without locking them, so a concurrent move of any of them could commit
-- alongside a new link and break the one-facultad rule. FOR SHARE conflicts with the
-- row lock an UPDATE takes, so the link waits for the move and then sees it.
CREATE OR REPLACE FUNCTION "study_plan_subjects_same_faculty"() RETURNS trigger AS $$
DECLARE
  plan_faculty UUID;
  subject_faculty UUID;
BEGIN
  SELECT c."faculty_id" INTO plan_faculty
  FROM "study_plans" p JOIN "careers" c ON c."id" = p."career_id"
  WHERE p."id" = NEW."study_plan_id"
  FOR SHARE OF p, c;

  SELECT s."faculty_id" INTO subject_faculty
  FROM "subjects" s WHERE s."id" = NEW."subject_id"
  FOR SHARE;

  IF plan_faculty IS DISTINCT FROM subject_faculty THEN
    RAISE EXCEPTION 'La materia % no pertenece a la facultad del plan %', NEW."subject_id", NEW."study_plan_id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
