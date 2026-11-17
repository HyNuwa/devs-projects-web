import { Prisma } from '../../generated/prisma';
import { publicVisibilitySql } from '../moderation/visibility';
import { MIN_TOPIC_FINALES, type TopicCount } from './experiences-summary';

/** Topic suggestions of `GET /discovery/subjects/:code/exam-topics`. */
export const EXAM_TOPICS_LIMIT = 20;

export type ExamTopicRow = { topic: string; count: bigint };

/**
 * The temas of a materia found in at least MIN_TOPIC_FINALES different public
 * finales, most mentioned first and then by name. Writes normalize spacing, so
 * `lower(topic)` is the key that compares ignoring case and spacing. The table
 * is aliased `m` to reuse `publicVisibilitySql`.
 */
export function buildExamTopicsQuery(input: {
  subjectId: string;
  limit: number;
  now: Date;
}): Prisma.Sql {
  return Prisma.sql`
    SELECT min(t.topic) AS topic, count(DISTINCT m.id) AS count
    FROM exam_experiences AS m
    CROSS JOIN LATERAL unnest(m.topics) AS t(topic)
    WHERE m.subject_id = ${input.subjectId}::uuid
      AND ${publicVisibilitySql(input.now)}
    GROUP BY lower(t.topic)
    HAVING count(DISTINCT m.id) >= ${MIN_TOPIC_FINALES}
    ORDER BY count(DISTINCT m.id) DESC, lower(min(t.topic)) ASC
    LIMIT ${input.limit}
  `;
}

export function toTopicCounts(rows: readonly ExamTopicRow[]): TopicCount[] {
  return rows.map((row) => ({ topic: row.topic, count: Number(row.count) }));
}
