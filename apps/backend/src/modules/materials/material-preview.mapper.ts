import {
  MaterialPreviewCapability,
  MaterialPreviewDto,
  MaterialPreviewFallbackReason,
} from './dto/material-response.dto';

export type MaterialPreviewSource = {
  fileType: string;
  fileUrl: string;
  drivePreviewUrl: string | null;
  driveDownloadUrl: string | null;
};

function getPreviewCapability(
  fileType: string,
  previewUrl: string | null,
): MaterialPreviewCapability {
  if (!previewUrl) {
    return MaterialPreviewCapability.UNAVAILABLE;
  }

  const normalized = fileType.toLowerCase().replace(/^image\//, '');
  if (normalized === 'pdf' || normalized === 'application/pdf') {
    return MaterialPreviewCapability.PDF;
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(normalized)) {
    return MaterialPreviewCapability.IMAGE;
  }
  return MaterialPreviewCapability.UNSUPPORTED;
}

export function toMaterialPreview(
  material: MaterialPreviewSource,
): MaterialPreviewDto {
  const previewCandidate = material.drivePreviewUrl || material.fileUrl || null;
  const capability = getPreviewCapability(material.fileType, previewCandidate);
  const previewUrl =
    capability === MaterialPreviewCapability.PDF ||
    capability === MaterialPreviewCapability.IMAGE
      ? previewCandidate
      : null;
  const downloadUrl = material.driveDownloadUrl ?? material.fileUrl;
  const fallbackReason =
    capability === MaterialPreviewCapability.UNSUPPORTED
      ? MaterialPreviewFallbackReason.UNSUPPORTED
      : capability === MaterialPreviewCapability.UNAVAILABLE
        ? MaterialPreviewFallbackReason.UNAVAILABLE
        : MaterialPreviewFallbackReason.PREVIEW_FAILED;

  return {
    capability,
    url: previewUrl,
    canPreview: previewUrl !== null,
    downloadUrl,
    fallback: { reason: fallbackReason, downloadUrl },
  };
}
