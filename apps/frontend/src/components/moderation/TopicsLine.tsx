/** The temas que tomaron of an experiencia de final, so moderation reads every public text. */
export function TopicsLine({ topics }: { topics?: string[] }) {
  if (!topics?.length) return null;
  return <p className="text-sm text-muted-foreground">Temas: {topics.join(', ')}</p>;
}
