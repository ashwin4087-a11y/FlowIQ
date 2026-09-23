export type CameraInputDisplay = {
  cvInput: string;
  yoloAdapter: string;
  modelWeights: string;
};

/** User-facing YOLOv8 lane-camera status from existing runtime / CV pipeline info. */
export function formatCameraInputStatus(
  cvDisplay?: CameraInputDisplay,
  cvMode?: string,
  trafficSource?: string,
): { status: string; dotClass: string } {
  if (!cvDisplay || cvDisplay.modelWeights === 'NOT CONFIGURED') {
    return { status: 'NOT CONFIGURED', dotClass: 'bg-[#64748b]' };
  }
  if (trafficSource === 'cv_model' && cvMode === 'cv_model') {
    return { status: 'YOLOv8 ACTIVE', dotClass: 'bg-[#10B981]' };
  }
  if (cvDisplay.cvInput === 'CV MODEL' && cvDisplay.yoloAdapter === 'READY') {
    return { status: 'YOLOv8 READY', dotClass: 'bg-[#10B981]' };
  }
  if (cvDisplay.yoloAdapter === 'NOT INSTALLED') {
    return { status: 'NOT CONFIGURED', dotClass: 'bg-[#64748b]' };
  }
  return { status: 'SIMULATION INPUT', dotClass: 'bg-[#F59E0B]' };
}
