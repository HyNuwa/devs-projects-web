import type { Material, MaterialPreview, MaterialResourceType } from './material';

export interface DiscoveryHierarchyCareer {
  id: string;
  name: string;
  code: string;
  studyPlanCount: number;
}

export interface DiscoveryHierarchyStudyPlan {
  id: string;
  name: string;
  code: string;
}

export interface DiscoveryHierarchyYear {
  id: string;
  year: number;
  studyPlan: DiscoveryHierarchyStudyPlan;
  subjectCount: number;
}

export interface DiscoveryHierarchySubject {
  id: string;
  curriculumAssignmentId: string;
  name: string;
  code: string | null;
  semester: number;
  credits: number | null;
  approvedMaterialCount: number;
}

export interface DiscoveryHierarchySubjectContext {
  id: string;
  name: string;
  code: string | null;
}

export interface DiscoveryHierarchyCategory {
  id: MaterialResourceType;
  resourceType: MaterialResourceType;
  materialCount: number;
}

export interface DiscoveryHierarchyFile {
  id: string;
  title: string;
  fileType: string;
  resourceType: MaterialResourceType;
  academicYear: number | null;
  createdAt: string;
  /** Row evidence from the same mapper as the public material DTO. */
  helpfulCount: number;
  /** `average` is a decimal string (e.g. "0", "4.50"), parsed at render like `Material`. */
  starSummary: Material['starSummary'];
  preview: MaterialPreview;
}

export interface DiscoveryCareerList {
  careers: DiscoveryHierarchyCareer[];
  hasMore: boolean;
}

export interface DiscoveryCurriculumYearList {
  career: DiscoveryHierarchyCareer;
  years: DiscoveryHierarchyYear[];
  hasMore: boolean;
}

export interface DiscoverySubjectList {
  career: DiscoveryHierarchyCareer;
  studyPlan: DiscoveryHierarchyStudyPlan;
  year: number;
  subjects: DiscoveryHierarchySubject[];
  hasMore: boolean;
}

export interface DiscoveryResourceCategoryList {
  subject: DiscoveryHierarchySubjectContext;
  categories: DiscoveryHierarchyCategory[];
}

export interface DiscoveryMaterialFileList {
  subject: DiscoveryHierarchySubjectContext;
  resourceType: MaterialResourceType;
  files: DiscoveryHierarchyFile[];
  hasMore: boolean;
}
