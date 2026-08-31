import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import type { MaterialResourceType } from '@/types/material';
import type {
  DiscoveryCareerList,
  DiscoveryCurriculumYearList,
  DiscoveryMaterialFileList,
  DiscoveryResourceCategoryList,
  DiscoverySubjectList,
} from '@/types/discovery-hierarchy';

const hierarchyListParams = { limit: 50 };

export async function getHierarchyCareers(): Promise<DiscoveryCareerList> {
  const response = await api.get<DiscoveryCareerList>('/discovery/hierarchy/careers', {
    params: hierarchyListParams,
  });

  return getData(response);
}

export async function getHierarchyYears(careerId: string): Promise<DiscoveryCurriculumYearList> {
  const response = await api.get<DiscoveryCurriculumYearList>(
    `/discovery/hierarchy/careers/${encodeURIComponent(careerId)}/years`,
    { params: hierarchyListParams },
  );

  return getData(response);
}

export async function getHierarchySubjects(
  careerId: string,
  studyPlanId: string,
  year: number,
): Promise<DiscoverySubjectList> {
  const response = await api.get<DiscoverySubjectList>(
    `/discovery/hierarchy/careers/${encodeURIComponent(careerId)}/study-plans/${encodeURIComponent(studyPlanId)}/years/${year}/subjects`,
    { params: hierarchyListParams },
  );

  return getData(response);
}

export async function getHierarchyCategories(
  subjectId: string,
): Promise<DiscoveryResourceCategoryList> {
  const response = await api.get<DiscoveryResourceCategoryList>(
    `/discovery/hierarchy/subjects/${encodeURIComponent(subjectId)}/resource-categories`,
  );

  return getData(response);
}

export async function getHierarchyFiles(
  subjectId: string,
  resourceType: MaterialResourceType,
): Promise<DiscoveryMaterialFileList> {
  const response = await api.get<DiscoveryMaterialFileList>(
    `/discovery/hierarchy/subjects/${encodeURIComponent(subjectId)}/resource-categories/${resourceType}/materials`,
    { params: hierarchyListParams },
  );

  return getData(response);
}
