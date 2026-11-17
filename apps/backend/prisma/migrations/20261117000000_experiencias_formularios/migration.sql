-- Nota de promoción of a reseña de cursada; ranges live in the write DTOs.
ALTER TABLE "course_reviews" ADD COLUMN "promotion_grade" SMALLINT;

-- Profesores en la mesa, tiempo del examen, preparación and temas que tomaron.
ALTER TABLE "exam_experiences" ADD COLUMN "board_size" SMALLINT,
ADD COLUMN "duration_minutes" SMALLINT,
ADD COLUMN "prep_lead_days" SMALLINT,
ADD COLUMN "prep_daily_minutes" SMALLINT,
ADD COLUMN "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
