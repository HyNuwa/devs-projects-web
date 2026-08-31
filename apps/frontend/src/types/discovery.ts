import type { MaterialResourceType } from './material';

export interface DiscoverySubjectSuggestion {
  kind: 'SUBJECT';
  id: string;
  name: string;
  code: string | null;
}

export interface DiscoveryMaterialSuggestion {
  kind: 'MATERIAL';
  id: string;
  title: string;
  resourceType: MaterialResourceType;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
}

/** Bounded groups returned in academic context before individual resources. */
export interface GroupedDiscoverySuggestions {
  subjects: DiscoverySubjectSuggestion[];
  materials: DiscoveryMaterialSuggestion[];
}
