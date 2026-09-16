interface EvidenceRefsProps {
  findingId: string;
  refs?: number[];
}

export function EvidenceRefs({ findingId, refs }: EvidenceRefsProps) {
  if (!refs?.length) return null;

  return (
    <span className="evidence-ref-list" aria-label={`Supporting evidence for finding ${findingId}`}>
      {refs.map((ref) => (
        <span className="evidence-ref-badge" key={`${findingId}-evidence-${ref}`}>
          Evidence {ref}
        </span>
      ))}
    </span>
  );
}
