import { redirect } from 'next/navigation';
import { validationResources } from '@/components/validation/pixel-notebook/data';

const material = validationResources[0];

export default function PixelNotebookValidationMaterialPage() {
  redirect(
    `/validacion/pixel-notebook/materiales/${material.careerSlug}/${material.curriculumYear}/${material.subjectSlug}/${material.categorySlug}?archivo=${material.id}`,
  );
}
