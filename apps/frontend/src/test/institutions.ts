import type { DiscoveryHierarchyFaculty } from '@/types/discovery-hierarchy';

/** FI-UNJU as the API returns it, for test fixtures. */
export const fiUnju: DiscoveryHierarchyFaculty = {
  id: '00000000-0000-4000-8000-00000000f001',
  name: 'Facultad de Ingeniería',
  shortName: 'FI',
  university: {
    id: '00000000-0000-4000-8000-00000000a001',
    name: 'Universidad Nacional de Jujuy',
    shortName: 'UNJU',
  },
};
