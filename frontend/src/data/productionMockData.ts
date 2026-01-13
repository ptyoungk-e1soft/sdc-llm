// 생산 이력 추적을 위한 목업 데이터
// ERP 시스템, MES 시스템, 품질 검사, 불량 이력, 공정/설비 이력 등

// 분석 대상 정보 (고객 불량 접수 데이터와 연계)
export interface AnalysisTarget {
  id: string;
  customer: string;
  productModel: string;
  lotId: string;
  cellId: string;
  defectType: string;
  defectDescription: string;
  registeredAt: string;
}

// ERP 출하 정보
export interface ERPShipmentData {
  shipmentId: string;
  shipmentDate: string;
  customer: string;
  productModel: string;
  shipmentLotId: string;
  quantity: number;
  destination: string;
  invoiceNo: string;
  poNumber: string;
  status: string;
}

// MES 생산 실적 정보
export interface MESProductionData {
  productionId: string;
  productionDate: string;
  productionLotId: string;
  productModel: string;
  lineId: string;
  lineName: string;
  shiftType: string;
  plannedQty: number;
  actualQty: number;
  goodQty: number;
  defectQty: number;
  yieldRate: number;
  startTime: string;
  endTime: string;
  operator: string;
  supervisor: string;
}

// LOT 트래킹 정보
export interface LotTrackingData {
  trackingId: string;
  shipmentLotId: string;
  productionLotId: string;
  inspectionLotId: string;
  materialLotIds: string[];
  processFlow: ProcessStep[];
}

export interface ProcessStep {
  stepNo: number;
  processName: string;
  processId: string;
  startTime: string;
  endTime: string;
  equipmentId: string;
  equipmentName: string;
  operator: string;
  result: "PASS" | "FAIL" | "REWORK";
  parameters: Record<string, string | number>;
}

// 품질 검사 정보
export interface QualityInspectionData {
  inspectionId: string;
  inspectionLotId: string;
  inspectionType: string;
  inspectionDate: string;
  inspectorId: string;
  inspectorName: string;
  sampleSize: number;
  passQty: number;
  failQty: number;
  result: "PASS" | "FAIL" | "CONDITIONAL";
  inspectionItems: InspectionItem[];
}

export interface InspectionItem {
  itemName: string;
  standard: string;
  measuredValue: string;
  result: "OK" | "NG";
  remarks?: string;
}

// 불량 이력 정보
export interface DefectHistoryData {
  defectId: string;
  detectionDate: string;
  lotId: string;
  cellId: string;
  defectType: string;
  defectCode: string;
  defectLocation: string;
  severity: "Critical" | "Major" | "Minor";
  detectedBy: string;
  detectionStage: string;
  rootCause?: string;
  correctiveAction?: string;
  status: "Open" | "Analyzing" | "Resolved" | "Closed";
  imageUrl?: string;
}

// 공정/설비 이력 정보
export interface ProcessEquipmentData {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  processId: string;
  processName: string;
  operationDate: string;
  runningTime: number;
  idleTime: number;
  downTime: number;
  maintenanceHistory: MaintenanceRecord[];
  parameterLog: ParameterLog[];
}

export interface MaintenanceRecord {
  maintenanceId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  technician: string;
  duration: number;
}

export interface ParameterLog {
  timestamp: string;
  parameterName: string;
  setValue: number;
  actualValue: number;
  unit: string;
  status: "Normal" | "Warning" | "Alarm";
}

// 개발 이력 정보
export interface DevelopmentHistoryData {
  developmentId: string;
  productModel: string;
  version: string;
  developmentDate: string;
  engineer: string;
  changeType: string;
  description: string;
  relatedDocuments: string[];
  testResults: string;
  approvalStatus: string;
}

// 자재 정보
export interface MaterialData {
  materialId: string;
  materialName: string;
  materialLotId: string;
  supplier: string;
  receiveDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  inspectionResult: "PASS" | "FAIL";
  storageLocation: string;
}

// =====================
// 목업 데이터 생성
// =====================

// ERP 출하 정보 - LOT20241203001에 대한 데이터
export const ERP_SHIPMENT_DATA: ERPShipmentData[] = [
  {
    shipmentId: "SHP-2024-12-001",
    shipmentDate: "2024-12-01",
    customer: "Apple",
    productModel: "OLED_67_FHD",
    shipmentLotId: "LOT20241203001",
    quantity: 5000,
    destination: "Cupertino, CA, USA",
    invoiceNo: "INV-2024-APL-0892",
    poNumber: "APL-PO-2024-11-2847",
    status: "Delivered",
  },
  {
    shipmentId: "SHP-2024-12-002",
    shipmentDate: "2024-12-02",
    customer: "Apple",
    productModel: "OLED_67_FHD",
    shipmentLotId: "LOT20241203002",
    quantity: 3000,
    destination: "Cupertino, CA, USA",
    invoiceNo: "INV-2024-APL-0893",
    poNumber: "APL-PO-2024-11-2848",
    status: "In Transit",
  },
];

// MES 생산 실적 정보
export const MES_PRODUCTION_DATA: MESProductionData[] = [
  {
    productionId: "PRD-2024-11-28-001",
    productionDate: "2024-11-28",
    productionLotId: "PROD-LOT-20241128-A01",
    productModel: "OLED_67_FHD",
    lineId: "LINE-A01",
    lineName: "OLED Assembly Line A",
    shiftType: "Day Shift",
    plannedQty: 2000,
    actualQty: 1987,
    goodQty: 1952,
    defectQty: 35,
    yieldRate: 98.24,
    startTime: "2024-11-28 08:00:00",
    endTime: "2024-11-28 17:30:00",
    operator: "Kim, Jihoon",
    supervisor: "Park, Sungmin",
  },
  {
    productionId: "PRD-2024-11-29-001",
    productionDate: "2024-11-29",
    productionLotId: "PROD-LOT-20241129-A01",
    productModel: "OLED_67_FHD",
    lineId: "LINE-A01",
    lineName: "OLED Assembly Line A",
    shiftType: "Day Shift",
    plannedQty: 2000,
    actualQty: 2012,
    goodQty: 1989,
    defectQty: 23,
    yieldRate: 98.86,
    startTime: "2024-11-29 08:00:00",
    endTime: "2024-11-29 17:45:00",
    operator: "Lee, Minho",
    supervisor: "Park, Sungmin",
  },
  {
    productionId: "PRD-2024-11-30-001",
    productionDate: "2024-11-30",
    productionLotId: "PROD-LOT-20241130-A01",
    productModel: "OLED_67_FHD",
    lineId: "LINE-A01",
    lineName: "OLED Assembly Line A",
    shiftType: "Day Shift",
    plannedQty: 1500,
    actualQty: 1501,
    goodQty: 1478,
    defectQty: 23,
    yieldRate: 98.47,
    startTime: "2024-11-30 08:00:00",
    endTime: "2024-11-30 16:00:00",
    operator: "Choi, Yuna",
    supervisor: "Park, Sungmin",
  },
];

// LOT 트래킹 정보
export const LOT_TRACKING_DATA: LotTrackingData = {
  trackingId: "TRK-2024-12-001",
  shipmentLotId: "LOT20241203001",
  productionLotId: "PROD-LOT-20241128-A01",
  inspectionLotId: "INS-LOT-20241129-001",
  materialLotIds: ["MAT-OLED-2024-1101", "MAT-GLASS-2024-1105", "MAT-DRIVER-2024-1108"],
  processFlow: [
    {
      stepNo: 1,
      processName: "OLED 증착",
      processId: "PROC-DEP-001",
      startTime: "2024-11-28 08:00:00",
      endTime: "2024-11-28 10:30:00",
      equipmentId: "EQP-DEP-A01",
      equipmentName: "OLED Deposition System A",
      operator: "Kim, Jihoon",
      result: "PASS",
      parameters: {
        chamberTemp: 25.3,
        chamberPressure: 1.2e-6,
        depositionRate: 0.5,
        filmThickness: 120,
      },
    },
    {
      stepNo: 2,
      processName: "봉지 공정",
      processId: "PROC-ENC-001",
      startTime: "2024-11-28 10:45:00",
      endTime: "2024-11-28 12:30:00",
      equipmentId: "EQP-ENC-A01",
      equipmentName: "Encapsulation System A",
      operator: "Kim, Jihoon",
      result: "PASS",
      parameters: {
        sealingTemp: 85,
        sealingPressure: 2.5,
        cureTime: 45,
      },
    },
    {
      stepNo: 3,
      processName: "Cell 검사",
      processId: "PROC-INS-001",
      startTime: "2024-11-28 13:30:00",
      endTime: "2024-11-28 15:00:00",
      equipmentId: "EQP-INS-A01",
      equipmentName: "Cell Inspection System",
      operator: "Lee, Soojin",
      result: "PASS",
      parameters: {
        brightness: 450,
        contrast: 1000000,
        colorGamut: 99.8,
        deadPixelCount: 0,
      },
    },
    {
      stepNo: 4,
      processName: "모듈 조립",
      processId: "PROC-ASM-001",
      startTime: "2024-11-28 15:15:00",
      endTime: "2024-11-28 16:45:00",
      equipmentId: "EQP-ASM-A01",
      equipmentName: "Module Assembly Line",
      operator: "Park, Junho",
      result: "PASS",
      parameters: {
        bondingTemp: 180,
        bondingPressure: 1.5,
        alignmentAccuracy: 0.02,
      },
    },
    {
      stepNo: 5,
      processName: "최종 검사",
      processId: "PROC-FIN-001",
      startTime: "2024-11-28 17:00:00",
      endTime: "2024-11-28 17:30:00",
      equipmentId: "EQP-FIN-A01",
      equipmentName: "Final Inspection System",
      operator: "Cho, Minji",
      result: "PASS",
      parameters: {
        displayTest: "PASS",
        touchTest: "PASS",
        electricalTest: "PASS",
      },
    },
  ],
};

// 품질 검사 정보
export const QUALITY_INSPECTION_DATA: QualityInspectionData[] = [
  {
    inspectionId: "QI-2024-11-29-001",
    inspectionLotId: "INS-LOT-20241129-001",
    inspectionType: "In-Process Inspection",
    inspectionDate: "2024-11-29",
    inspectorId: "INS-001",
    inspectorName: "Hwang, Seokyoung",
    sampleSize: 100,
    passQty: 98,
    failQty: 2,
    result: "PASS",
    inspectionItems: [
      {
        itemName: "휘도 (Brightness)",
        standard: "450 ± 20 cd/m²",
        measuredValue: "448 cd/m²",
        result: "OK",
      },
      {
        itemName: "명암비 (Contrast)",
        standard: "> 1,000,000:1",
        measuredValue: "1,200,000:1",
        result: "OK",
      },
      {
        itemName: "색재현율 (Color Gamut)",
        standard: "> 99% DCI-P3",
        measuredValue: "99.8%",
        result: "OK",
      },
      {
        itemName: "Dead Pixel",
        standard: "0",
        measuredValue: "2건 발견",
        result: "NG",
        remarks: "CELL12345, CELL12389에서 Dead Pixel 발견",
      },
      {
        itemName: "응답속도",
        standard: "< 1ms",
        measuredValue: "0.8ms",
        result: "OK",
      },
    ],
  },
  {
    inspectionId: "QI-2024-11-30-001",
    inspectionLotId: "INS-LOT-20241130-001",
    inspectionType: "Final Inspection",
    inspectionDate: "2024-11-30",
    inspectorId: "INS-002",
    inspectorName: "Jung, Taeyoung",
    sampleSize: 200,
    passQty: 197,
    failQty: 3,
    result: "CONDITIONAL",
    inspectionItems: [
      {
        itemName: "외관 검사",
        standard: "스크래치, 이물질 없음",
        measuredValue: "3건 이물질 발견",
        result: "NG",
        remarks: "미세 이물질 - 재세척 후 합격 처리",
      },
      {
        itemName: "터치 기능",
        standard: "전 영역 정상 동작",
        measuredValue: "정상",
        result: "OK",
      },
      {
        itemName: "전기적 특성",
        standard: "소비전력 < 5W",
        measuredValue: "4.7W",
        result: "OK",
      },
    ],
  },
];

// 불량 이력 정보
export const DEFECT_HISTORY_DATA: DefectHistoryData[] = [
  {
    defectId: "DEF-2024-11-29-001",
    detectionDate: "2024-11-29",
    lotId: "PROD-LOT-20241128-A01",
    cellId: "CELL12345",
    defectType: "DEAD_PIXEL",
    defectCode: "DP-001",
    defectLocation: "화면 중앙 (X: 540, Y: 960)",
    severity: "Critical",
    detectedBy: "Hwang, Seokyoung",
    detectionStage: "In-Process Inspection",
    rootCause: "OLED 증착 공정 중 파티클 오염 추정",
    correctiveAction: "Chamber 청소 및 필터 교체 완료",
    status: "Analyzing",
  },
  {
    defectId: "DEF-2024-11-29-002",
    detectionDate: "2024-11-29",
    lotId: "PROD-LOT-20241128-A01",
    cellId: "CELL12389",
    defectType: "DEAD_PIXEL",
    defectCode: "DP-001",
    defectLocation: "화면 좌측 상단 (X: 120, Y: 200)",
    severity: "Major",
    detectedBy: "Hwang, Seokyoung",
    detectionStage: "In-Process Inspection",
    rootCause: "분석 중",
    status: "Open",
  },
  {
    defectId: "DEF-2024-11-25-001",
    detectionDate: "2024-11-25",
    lotId: "PROD-LOT-20241124-A01",
    cellId: "CELL11890",
    defectType: "LINE_DEFECT",
    defectCode: "LD-002",
    defectLocation: "화면 우측 5% 영역 수직 라인",
    severity: "Critical",
    detectedBy: "Kim, Younghee",
    detectionStage: "Final Inspection",
    rootCause: "Driver IC 불량",
    correctiveAction: "Driver IC 공급업체 품질 강화 요청",
    status: "Closed",
  },
];

// 공정/설비 이력 정보
export const PROCESS_EQUIPMENT_DATA: ProcessEquipmentData[] = [
  {
    equipmentId: "EQP-DEP-A01",
    equipmentName: "OLED Deposition System A",
    equipmentType: "Vacuum Deposition",
    processId: "PROC-DEP-001",
    processName: "OLED 증착",
    operationDate: "2024-11-28",
    runningTime: 540,
    idleTime: 60,
    downTime: 0,
    maintenanceHistory: [
      {
        maintenanceId: "MT-2024-11-20-001",
        maintenanceDate: "2024-11-20",
        maintenanceType: "Preventive",
        description: "정기 점검 - 진공 펌프 오일 교체, 챔버 클리닝",
        technician: "Maintenance Team A",
        duration: 240,
      },
      {
        maintenanceId: "MT-2024-11-27-001",
        maintenanceDate: "2024-11-27",
        maintenanceType: "Corrective",
        description: "파티클 필터 교체 - 파티클 수 증가로 인한 긴급 조치",
        technician: "Maintenance Team B",
        duration: 120,
      },
    ],
    parameterLog: [
      {
        timestamp: "2024-11-28 08:30:00",
        parameterName: "Chamber Temperature",
        setValue: 25.0,
        actualValue: 25.3,
        unit: "°C",
        status: "Normal",
      },
      {
        timestamp: "2024-11-28 09:15:00",
        parameterName: "Chamber Pressure",
        setValue: 1.0e-6,
        actualValue: 1.2e-6,
        unit: "Torr",
        status: "Normal",
      },
      {
        timestamp: "2024-11-28 09:45:00",
        parameterName: "Deposition Rate",
        setValue: 0.5,
        actualValue: 0.52,
        unit: "nm/s",
        status: "Normal",
      },
    ],
  },
  {
    equipmentId: "EQP-INS-A01",
    equipmentName: "Cell Inspection System",
    equipmentType: "Optical Inspection",
    processId: "PROC-INS-001",
    processName: "Cell 검사",
    operationDate: "2024-11-28",
    runningTime: 480,
    idleTime: 90,
    downTime: 30,
    maintenanceHistory: [
      {
        maintenanceId: "MT-2024-11-15-001",
        maintenanceDate: "2024-11-15",
        maintenanceType: "Preventive",
        description: "카메라 렌즈 클리닝, 조명 모듈 점검",
        technician: "Maintenance Team C",
        duration: 60,
      },
    ],
    parameterLog: [
      {
        timestamp: "2024-11-28 13:30:00",
        parameterName: "Camera Resolution",
        setValue: 4096,
        actualValue: 4096,
        unit: "px",
        status: "Normal",
      },
      {
        timestamp: "2024-11-28 14:00:00",
        parameterName: "Light Intensity",
        setValue: 1000,
        actualValue: 985,
        unit: "lux",
        status: "Normal",
      },
    ],
  },
];

// 개발 이력 정보
export const DEVELOPMENT_HISTORY_DATA: DevelopmentHistoryData[] = [
  {
    developmentId: "DEV-2024-09-001",
    productModel: "OLED_67_FHD",
    version: "1.0",
    developmentDate: "2024-09-15",
    engineer: "Dr. Kim, Sangho",
    changeType: "Initial Release",
    description: "OLED_67_FHD 제품 초기 개발 완료. 6.7인치 FHD OLED 디스플레이 양산 버전.",
    relatedDocuments: ["SPEC-OLED67-001", "DWG-OLED67-001", "TEST-OLED67-001"],
    testResults: "모든 신뢰성 테스트 통과",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-09-015",
    productModel: "OLED_67_FHD",
    version: "1.0.1",
    developmentDate: "2024-09-28",
    engineer: "Dr. Kim, Sangho",
    changeType: "Bug Fix",
    description: "초기 양산 버전 경미한 설계 수정 - 터치 IC 연결 패턴 최적화",
    relatedDocuments: ["ECN-2024-0756", "DWG-OLED67-002"],
    testResults: "터치 응답성 10% 개선 확인",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-10-001",
    productModel: "OLED_67_FHD",
    version: "1.1",
    developmentDate: "2024-10-20",
    engineer: "Lee, Junghwa",
    changeType: "Design Change",
    description: "봉지층 두께 변경 (1.0mm → 0.8mm) - 고객 요청에 따른 박형화",
    relatedDocuments: ["ECN-2024-0892", "SPEC-OLED67-002"],
    testResults: "박형화 신뢰성 테스트 통과",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-10-015",
    productModel: "OLED_67_FHD",
    version: "1.1.1",
    developmentDate: "2024-10-28",
    engineer: "Choi, Minsoo",
    changeType: "Material Change",
    description: "HTL 유기물 공급업체 변경 (Samsung SDI → LG Chem) - 원가 절감",
    relatedDocuments: ["MCN-2024-0234", "TEST-OLED67-032", "QA-2024-1028"],
    testResults: "동등성 평가 완료, 성능 차이 없음",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-11-001",
    productModel: "OLED_67_FHD",
    version: "1.2",
    developmentDate: "2024-11-10",
    engineer: "Park, Jiyeon",
    changeType: "Process Change",
    description: "OLED 증착 공정 파라미터 최적화 - 수율 향상 목적",
    relatedDocuments: ["PCN-2024-0156", "TEST-OLED67-045"],
    testResults: "수율 1.5% 향상 확인",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-11-010",
    productModel: "OLED_67_FHD",
    version: "1.2.1",
    developmentDate: "2024-11-15",
    engineer: "Kim, Youngho",
    changeType: "Quality Improvement",
    description: "Dead Pixel 불량 저감을 위한 클린룸 환경 기준 강화 및 검사 공정 추가",
    relatedDocuments: ["PCN-2024-0178", "SOP-CLEAN-012", "QA-2024-1115"],
    testResults: "Dead Pixel 불량률 0.5% → 0.1% 감소",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-11-020",
    productModel: "OLED_67_FHD",
    version: "1.3",
    developmentDate: "2024-11-25",
    engineer: "Dr. Lee, Sungmin",
    changeType: "Feature Enhancement",
    description: "고객 요청 - HDR10+ 지원을 위한 밝기 향상 (450nit → 600nit)",
    relatedDocuments: ["ECN-2024-0945", "SPEC-OLED67-003", "TEST-OLED67-052"],
    testResults: "HDR10+ 인증 테스트 진행 중",
    approvalStatus: "Pending",
  },
  {
    developmentId: "DEV-2024-12-001",
    productModel: "OLED_67_FHD",
    version: "1.3.1",
    developmentDate: "2024-12-01",
    engineer: "Park, Jiyeon",
    changeType: "Corrective Action",
    description: "Apple 고객 Dead Pixel 클레임 대응 - 증착 챔버 파티클 필터 교체 주기 단축 (30일 → 15일)",
    relatedDocuments: ["CAR-2024-0089", "PCN-2024-0198", "MAINT-DEP-015"],
    testResults: "파티클 카운트 50% 감소 확인",
    approvalStatus: "Approved",
  },
  // 다른 제품 개발 이력
  {
    developmentId: "DEV-2024-08-001",
    productModel: "AMOLED_55_4K",
    version: "2.0",
    developmentDate: "2024-08-10",
    engineer: "Dr. Yoon, Sejin",
    changeType: "Initial Release",
    description: "AMOLED_55_4K 제품 양산 개시. 5.5인치 4K AMOLED 디스플레이.",
    relatedDocuments: ["SPEC-AMOL55-001", "DWG-AMOL55-001", "TEST-AMOL55-001"],
    testResults: "전체 신뢰성 테스트 통과",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-10-020",
    productModel: "AMOLED_55_4K",
    version: "2.1",
    developmentDate: "2024-10-25",
    engineer: "Han, Jisoo",
    changeType: "Design Change",
    description: "베젤 축소 설계 변경 (2.5mm → 1.8mm) - Samsung Galaxy 신모델 대응",
    relatedDocuments: ["ECN-2024-0876", "DWG-AMOL55-002"],
    testResults: "구조 강도 테스트 통과",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-07-001",
    productModel: "OLED_77_8K",
    version: "1.0",
    developmentDate: "2024-07-20",
    engineer: "Dr. Park, Donghyun",
    changeType: "Initial Release",
    description: "OLED_77_8K 제품 초기 개발. 7.7인치 8K OLED 프리미엄 디스플레이.",
    relatedDocuments: ["SPEC-OLED77-001", "DWG-OLED77-001", "TEST-OLED77-001"],
    testResults: "8K 해상도 인증 완료",
    approvalStatus: "Approved",
  },
  {
    developmentId: "DEV-2024-11-025",
    productModel: "OLED_77_8K",
    version: "1.1",
    developmentDate: "2024-11-22",
    engineer: "Kang, Minji",
    changeType: "Process Change",
    description: "Mura 불량 개선을 위한 증착 균일도 향상 - 마스크 정밀도 개선",
    relatedDocuments: ["PCN-2024-0189", "TEST-OLED77-018", "QA-2024-1122"],
    testResults: "Mura 불량률 2.1% → 0.8% 개선",
    approvalStatus: "Approved",
  },
];

// 자재 정보
export const MATERIAL_DATA: MaterialData[] = [
  {
    materialId: "MAT-001",
    materialName: "OLED 유기물 (HTL)",
    materialLotId: "MAT-OLED-2024-1101",
    supplier: "Samsung SDI",
    receiveDate: "2024-11-01",
    expiryDate: "2025-05-01",
    quantity: 500,
    unit: "g",
    inspectionResult: "PASS",
    storageLocation: "Cleanroom Storage A-1",
  },
  {
    materialId: "MAT-002",
    materialName: "봉지용 Glass",
    materialLotId: "MAT-GLASS-2024-1105",
    supplier: "Corning",
    receiveDate: "2024-11-05",
    expiryDate: "2026-11-05",
    quantity: 10000,
    unit: "EA",
    inspectionResult: "PASS",
    storageLocation: "Warehouse B-3",
  },
  {
    materialId: "MAT-003",
    materialName: "Driver IC",
    materialLotId: "MAT-DRIVER-2024-1108",
    supplier: "Samsung LSI",
    receiveDate: "2024-11-08",
    expiryDate: "2027-11-08",
    quantity: 20000,
    unit: "EA",
    inspectionResult: "PASS",
    storageLocation: "ESD Storage C-2",
  },
];

// =====================
// 데이터 조회 함수
// =====================

export function getProductionDataContext(analysisTarget: AnalysisTarget): string {
  // 분석 대상과 연계된 모든 데이터를 컨텍스트로 생성
  const shipment = ERP_SHIPMENT_DATA.find(s => s.shipmentLotId === analysisTarget.lotId);
  const production = MES_PRODUCTION_DATA.find(p => p.productModel === analysisTarget.productModel);
  const lotTracking = LOT_TRACKING_DATA;
  const qualityInspections = QUALITY_INSPECTION_DATA;
  const defects = DEFECT_HISTORY_DATA.filter(d => d.cellId === analysisTarget.cellId || d.lotId.includes("20241128"));
  const equipment = PROCESS_EQUIPMENT_DATA;
  const development = DEVELOPMENT_HISTORY_DATA.filter(d => d.productModel === analysisTarget.productModel);
  const materials = MATERIAL_DATA;

  return `
## 분석 대상 정보
- 접수 ID: ${analysisTarget.id}
- 고객사: ${analysisTarget.customer}
- 제품 모델: ${analysisTarget.productModel}
- 출하 LOT ID: ${analysisTarget.lotId}
- Cell ID: ${analysisTarget.cellId}
- 불량 유형: ${analysisTarget.defectType}
- 불량 상세: ${analysisTarget.defectDescription}
- 접수일: ${analysisTarget.registeredAt}

## ERP 출하 정보
${shipment ? `
- 출하 ID: ${shipment.shipmentId}
- 출하일: ${shipment.shipmentDate}
- 고객사: ${shipment.customer}
- 제품 모델: ${shipment.productModel}
- 출하 LOT: ${shipment.shipmentLotId}
- 수량: ${shipment.quantity}개
- 배송지: ${shipment.destination}
- Invoice No: ${shipment.invoiceNo}
- PO Number: ${shipment.poNumber}
- 상태: ${shipment.status}
` : '해당 LOT의 출하 정보가 없습니다.'}

## MES 생산 실적 정보
${production ? `
- 생산 ID: ${production.productionId}
- 생산일: ${production.productionDate}
- 생산 LOT: ${production.productionLotId}
- 라인: ${production.lineName} (${production.lineId})
- 근무조: ${production.shiftType}
- 계획 수량: ${production.plannedQty}개
- 실적 수량: ${production.actualQty}개
- 양품 수량: ${production.goodQty}개
- 불량 수량: ${production.defectQty}개
- 수율: ${production.yieldRate}%
- 작업 시간: ${production.startTime} ~ ${production.endTime}
- 작업자: ${production.operator}
- 감독자: ${production.supervisor}
` : '해당 제품의 생산 실적이 없습니다.'}

## LOT 트래킹 정보
- 추적 ID: ${lotTracking.trackingId}
- 출하 LOT: ${lotTracking.shipmentLotId}
- 생산 LOT: ${lotTracking.productionLotId}
- 검사 LOT: ${lotTracking.inspectionLotId}
- 투입 자재 LOT: ${lotTracking.materialLotIds.join(', ')}

### 공정 흐름
${lotTracking.processFlow.map(step => `
**${step.stepNo}. ${step.processName}**
- 공정 ID: ${step.processId}
- 설비: ${step.equipmentName} (${step.equipmentId})
- 작업 시간: ${step.startTime} ~ ${step.endTime}
- 작업자: ${step.operator}
- 결과: ${step.result}
- 파라미터: ${JSON.stringify(step.parameters)}
`).join('')}

## 품질 검사 정보
${qualityInspections.map(qi => `
### ${qi.inspectionType} (${qi.inspectionDate})
- 검사 ID: ${qi.inspectionId}
- 검사 LOT: ${qi.inspectionLotId}
- 검사자: ${qi.inspectorName}
- 샘플 크기: ${qi.sampleSize}개
- 합격: ${qi.passQty}개, 불합격: ${qi.failQty}개
- 결과: ${qi.result}

**검사 항목:**
${qi.inspectionItems.map(item => `
- ${item.itemName}: ${item.measuredValue} (기준: ${item.standard}) → ${item.result}${item.remarks ? ` [${item.remarks}]` : ''}`).join('')}
`).join('')}

## 불량 이력 정보
${defects.map(def => `
### ${def.defectType} - ${def.cellId}
- 불량 ID: ${def.defectId}
- 발견일: ${def.detectionDate}
- LOT: ${def.lotId}
- 불량 코드: ${def.defectCode}
- 위치: ${def.defectLocation}
- 심각도: ${def.severity}
- 발견자: ${def.detectedBy}
- 발견 단계: ${def.detectionStage}
- 원인 분석: ${def.rootCause || '분석 중'}
- 시정 조치: ${def.correctiveAction || '미정'}
- 상태: ${def.status}
`).join('')}

## 공정/설비 이력 정보
${equipment.map(eq => `
### ${eq.equipmentName}
- 설비 ID: ${eq.equipmentId}
- 설비 유형: ${eq.equipmentType}
- 공정: ${eq.processName}
- 운전일: ${eq.operationDate}
- 가동 시간: ${eq.runningTime}분
- 유휴 시간: ${eq.idleTime}분
- 정지 시간: ${eq.downTime}분

**유지보수 이력:**
${eq.maintenanceHistory.map(mh => `
- ${mh.maintenanceDate} (${mh.maintenanceType}): ${mh.description} - ${mh.technician}`).join('')}
`).join('')}

## 개발 이력 정보
${development.map(dev => `
### ${dev.productModel} v${dev.version}
- 개발 ID: ${dev.developmentId}
- 변경 유형: ${dev.changeType}
- 개발일: ${dev.developmentDate}
- 담당자: ${dev.engineer}
- 설명: ${dev.description}
- 관련 문서: ${dev.relatedDocuments.join(', ')}
- 테스트 결과: ${dev.testResults}
- 승인 상태: ${dev.approvalStatus}
`).join('')}

## 자재 정보
${materials.map(mat => `
### ${mat.materialName}
- 자재 ID: ${mat.materialId}
- LOT: ${mat.materialLotId}
- 공급업체: ${mat.supplier}
- 입고일: ${mat.receiveDate}
- 유효기한: ${mat.expiryDate}
- 수량: ${mat.quantity} ${mat.unit}
- 검사 결과: ${mat.inspectionResult}
- 보관 위치: ${mat.storageLocation}
`).join('')}
`;
}

// 특정 데이터 유형별 조회 함수
export function getProductionHistoryContext(analysisTarget: AnalysisTarget): string {
  const production = MES_PRODUCTION_DATA;
  const shipment = ERP_SHIPMENT_DATA.find(s => s.shipmentLotId === analysisTarget.lotId);

  return `
## 분석 대상
- 제품: ${analysisTarget.productModel}
- LOT ID: ${analysisTarget.lotId}
- Cell ID: ${analysisTarget.cellId}

## ERP 출하 정보 조회 결과
${shipment ? `
✅ LOT ${analysisTarget.lotId}의 출하 정보를 찾았습니다.
- 출하일: ${shipment.shipmentDate}
- 수량: ${shipment.quantity}개
- 배송지: ${shipment.destination}
- Invoice: ${shipment.invoiceNo}
` : `❌ 해당 LOT의 출하 정보를 찾을 수 없습니다.`}

## MES 생산 실적 조회 결과
${production.map(p => `
### ${p.productionDate} 생산 실적
- 생산 LOT: ${p.productionLotId}
- 라인: ${p.lineName}
- 계획/실적: ${p.plannedQty}/${p.actualQty}개
- 양품/불량: ${p.goodQty}/${p.defectQty}개
- 수율: ${p.yieldRate}%
- 작업자: ${p.operator}
`).join('')}
`;
}

export function getQualityInspectionContext(analysisTarget: AnalysisTarget): string {
  const inspections = QUALITY_INSPECTION_DATA;
  const defects = DEFECT_HISTORY_DATA.filter(d =>
    d.cellId === analysisTarget.cellId || d.defectType === analysisTarget.defectType
  );

  return `
## 분석 대상
- 제품: ${analysisTarget.productModel}
- LOT ID: ${analysisTarget.lotId}
- Cell ID: ${analysisTarget.cellId}
- 신고 불량: ${analysisTarget.defectType}

## 품질 검사 이력
${inspections.map(qi => `
### ${qi.inspectionType} (${qi.inspectionDate})
- 검사 LOT: ${qi.inspectionLotId}
- 샘플/합격/불합격: ${qi.sampleSize}/${qi.passQty}/${qi.failQty}
- 판정: ${qi.result}

검사 항목:
${qi.inspectionItems.map(item => `  - ${item.itemName}: ${item.result} ${item.remarks ? `(${item.remarks})` : ''}`).join('\n')}
`).join('')}

## 관련 불량 이력
${defects.map(def => `
### ${def.defectId} - ${def.defectType}
- Cell ID: ${def.cellId}
- 위치: ${def.defectLocation}
- 심각도: ${def.severity}
- 원인: ${def.rootCause || '분석 중'}
- 상태: ${def.status}
`).join('')}
`;
}

export function getProcessEquipmentContext(analysisTarget: AnalysisTarget): string {
  const equipment = PROCESS_EQUIPMENT_DATA;
  const lotTracking = LOT_TRACKING_DATA;

  return `
## 분석 대상
- 제품: ${analysisTarget.productModel}
- LOT ID: ${analysisTarget.lotId}

## 공정 흐름 (LOT 트래킹)
${lotTracking.processFlow.map(step => `
### ${step.stepNo}. ${step.processName}
- 설비: ${step.equipmentName}
- 시간: ${step.startTime} ~ ${step.endTime}
- 작업자: ${step.operator}
- 결과: ${step.result}
- 주요 파라미터:
${Object.entries(step.parameters).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}
`).join('')}

## 설비 상세 정보
${equipment.map(eq => `
### ${eq.equipmentName} (${eq.equipmentId})
- 유형: ${eq.equipmentType}
- 가동/유휴/정지: ${eq.runningTime}/${eq.idleTime}/${eq.downTime}분

유지보수 이력:
${eq.maintenanceHistory.map(mh => `  - ${mh.maintenanceDate}: ${mh.description}`).join('\n')}

파라미터 로그:
${eq.parameterLog.map(pl => `  - ${pl.timestamp}: ${pl.parameterName} = ${pl.actualValue}${pl.unit} (${pl.status})`).join('\n')}
`).join('')}
`;
}

export function getDevelopmentHistoryContext(analysisTarget: AnalysisTarget): string {
  const development = DEVELOPMENT_HISTORY_DATA.filter(d => d.productModel === analysisTarget.productModel);
  const materials = MATERIAL_DATA;

  return `
## 분석 대상
- 제품: ${analysisTarget.productModel}

## 개발 이력
${development.map(dev => `
### v${dev.version} - ${dev.changeType}
- 개발일: ${dev.developmentDate}
- 담당자: ${dev.engineer}
- 설명: ${dev.description}
- 관련 문서: ${dev.relatedDocuments.join(', ')}
- 테스트: ${dev.testResults}
`).join('')}

## 투입 자재 정보
${materials.map(mat => `
### ${mat.materialName}
- LOT: ${mat.materialLotId}
- 공급업체: ${mat.supplier}
- 입고일: ${mat.receiveDate}
- 검사 결과: ${mat.inspectionResult}
`).join('')}
`;
}

export function getChangeHistoryContext(analysisTarget: AnalysisTarget): string {
  const development = DEVELOPMENT_HISTORY_DATA.filter(d =>
    d.productModel === analysisTarget.productModel && d.changeType !== 'Initial Release'
  );
  const equipment = PROCESS_EQUIPMENT_DATA;

  return `
## 분석 대상
- 제품: ${analysisTarget.productModel}

## 설계/공정 변경 이력
${development.map(dev => `
### ${dev.developmentDate} - ${dev.changeType}
- 버전: v${dev.version}
- 담당자: ${dev.engineer}
- 변경 내용: ${dev.description}
- 관련 문서: ${dev.relatedDocuments.join(', ')}
- 검증 결과: ${dev.testResults}
`).join('')}

## 설비 유지보수/변경 이력
${equipment.flatMap(eq => eq.maintenanceHistory.map(mh => ({
  ...mh,
  equipmentName: eq.equipmentName
}))).sort((a, b) => b.maintenanceDate.localeCompare(a.maintenanceDate)).map(mh => `
### ${mh.maintenanceDate} - ${mh.equipmentName}
- 유형: ${mh.maintenanceType}
- 내용: ${mh.description}
- 작업자: ${mh.technician}
- 소요시간: ${mh.duration}분
`).join('')}
`;
}

// ==========================================
// 기본분석 단계별 목업 데이터
// ==========================================

// 고객 담당자 정보
export interface CustomerContact {
  contactId: string;
  customer: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  preferredContact: "email" | "phone" | "both";
  communicationHistory: {
    date: string;
    type: "email" | "phone" | "meeting";
    subject: string;
    summary: string;
    handler: string;
  }[];
}

export const CUSTOMER_CONTACTS: CustomerContact[] = [
  {
    contactId: "CC-001",
    customer: "Apple",
    name: "John Smith",
    department: "Display QA Team",
    position: "Senior Quality Engineer",
    email: "john.smith@apple.com",
    phone: "+1-408-555-1234",
    preferredContact: "email",
    communicationHistory: [
      {
        date: "2024-12-03",
        type: "email",
        subject: "OLED_67_FHD 불량 접수 건 확인 요청",
        summary: "Dead Pixel 불량 관련 초기 접수 및 분석 요청. LOT20241203001 제품 5개 불량 확인됨.",
        handler: "김영수"
      },
      {
        date: "2024-11-28",
        type: "phone",
        subject: "11월 납품분 품질 현황 논의",
        summary: "전월 대비 수율 개선 확인. 신규 불량 유형 발견 시 즉시 공유 요청.",
        handler: "이미라"
      },
      {
        date: "2024-11-15",
        type: "meeting",
        subject: "Q4 품질 개선 회의",
        summary: "분기별 정기 품질 리뷰. Mura 불량 개선 성과 공유. 2025년 품질 목표 협의.",
        handler: "박철수"
      }
    ]
  },
  {
    contactId: "CC-002",
    customer: "삼성전자",
    name: "김민준",
    department: "디스플레이 품질관리팀",
    position: "팀장",
    email: "minjun.kim@samsung.com",
    phone: "+82-2-2255-5678",
    preferredContact: "both",
    communicationHistory: [
      {
        date: "2024-12-01",
        type: "email",
        subject: "AMOLED 패널 품질 이슈",
        summary: "AMOLED_55_4K 제품 색상 편차 문의. 샘플 분석 요청.",
        handler: "정하나"
      },
      {
        date: "2024-11-20",
        type: "meeting",
        subject: "월간 품질 협의회",
        summary: "11월 납품분 품질 검토. Dead Pixel 불량률 0.02% 달성 확인.",
        handler: "박철수"
      }
    ]
  },
  {
    contactId: "CC-003",
    customer: "LG전자",
    name: "이수진",
    department: "TV 사업부 품질팀",
    position: "과장",
    email: "sujin.lee@lge.com",
    phone: "+82-2-3777-1234",
    preferredContact: "email",
    communicationHistory: [
      {
        date: "2024-11-25",
        type: "email",
        subject: "OLED 77인치 패널 밝기 불균일 문의",
        summary: "77인치 8K 모델 밝기 편차 관련 기술 지원 요청.",
        handler: "이미라"
      },
      {
        date: "2024-11-10",
        type: "phone",
        subject: "신규 모델 양산 일정 협의",
        summary: "2025년 신모델 양산 준비 현황 공유. 품질 기준 사전 협의.",
        handler: "김영수"
      }
    ]
  },
  {
    contactId: "CC-004",
    customer: "현대모비스",
    name: "박성민",
    department: "차량용 디스플레이팀",
    position: "책임연구원",
    email: "sungmin.park@hyundai-mobis.com",
    phone: "+82-31-368-5678",
    preferredContact: "both",
    communicationHistory: [
      {
        date: "2024-12-02",
        type: "meeting",
        subject: "차량용 OLED 품질 기준 협의",
        summary: "차량용 디스플레이 온도 내구성 테스트 기준 논의. -40°C ~ 85°C 범위 검증.",
        handler: "박철수"
      },
      {
        date: "2024-11-18",
        type: "email",
        subject: "색상 시야각 개선 요청",
        summary: "운전석 기준 시야각 45도에서의 색상 변이 개선 요청.",
        handler: "정하나"
      }
    ]
  },
  {
    contactId: "CC-005",
    customer: "SK하이닉스",
    name: "최재원",
    department: "장비 품질팀",
    position: "선임",
    email: "jaewon.choi@sk.com",
    phone: "+82-31-5185-1234",
    preferredContact: "email",
    communicationHistory: [
      {
        date: "2024-11-28",
        type: "email",
        subject: "모니터용 OLED 패널 크랙 이슈",
        summary: "물류 과정 중 발생한 패널 크랙 관련 원인 분석 요청.",
        handler: "이미라"
      }
    ]
  },
  {
    contactId: "CC-006",
    customer: "한화솔루션",
    name: "정영호",
    department: "디스플레이소재팀",
    position: "수석연구원",
    email: "youngho.jung@hanwha.com",
    phone: "+82-42-865-5678",
    preferredContact: "phone",
    communicationHistory: [
      {
        date: "2024-11-22",
        type: "phone",
        subject: "32인치 모니터용 패널 품질 논의",
        summary: "줄무늬 패턴 불량 관련 IC 출력 편차 분석 결과 공유.",
        handler: "정하나"
      }
    ]
  }
];

// 품질 담당자 및 귀책부서 정보
export interface QualityManager {
  managerId: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  specialization: string[];
  currentCases: number;
}

export interface ResponsibleDepartment {
  departmentId: string;
  departmentName: string;
  manager: string;
  defectTypes: string[];
  escalationContact: string;
}

export const QUALITY_MANAGERS: QualityManager[] = [
  {
    managerId: "QM-001",
    name: "박철수",
    department: "품질보증팀",
    position: "수석 엔지니어",
    email: "cs.park@company.com",
    phone: "내선 1234",
    specialization: ["OLED 불량 분석", "Dead Pixel", "Mura"],
    currentCases: 3
  },
  {
    managerId: "QM-002",
    name: "이미라",
    department: "품질보증팀",
    position: "선임 엔지니어",
    email: "mr.lee@company.com",
    phone: "내선 1235",
    specialization: ["공정 분석", "수율 개선", "Line Defect"],
    currentCases: 5
  },
  {
    managerId: "QM-003",
    name: "정하나",
    department: "품질보증팀",
    position: "엔지니어",
    email: "hn.jung@company.com",
    phone: "내선 1236",
    specialization: ["고객 클레임", "외관 불량", "포장 불량"],
    currentCases: 2
  }
];

export const RESPONSIBLE_DEPARTMENTS: ResponsibleDepartment[] = [
  {
    departmentId: "RD-001",
    departmentName: "OLED 생산1팀",
    manager: "김생산",
    defectTypes: ["DEAD_PIXEL", "BRIGHT_SPOT", "LINE_DEFECT"],
    escalationContact: "생산기술팀장 (내선 2001)"
  },
  {
    departmentId: "RD-002",
    departmentName: "OLED 생산2팀",
    manager: "이생산",
    defectTypes: ["MURA", "COLOR_SHIFT", "UNIFORMITY"],
    escalationContact: "생산기술팀장 (내선 2001)"
  },
  {
    departmentId: "RD-003",
    departmentName: "증착공정팀",
    manager: "박증착",
    defectTypes: ["DEAD_PIXEL", "MURA", "LUMINANCE"],
    escalationContact: "공정기술팀장 (내선 2002)"
  },
  {
    departmentId: "RD-004",
    departmentName: "봉지공정팀",
    manager: "최봉지",
    defectTypes: ["MOISTURE", "PARTICLE", "SEAL_DEFECT"],
    escalationContact: "공정기술팀장 (내선 2002)"
  },
  {
    departmentId: "RD-005",
    departmentName: "자재팀",
    manager: "정자재",
    defectTypes: ["MATERIAL_DEFECT", "CONTAMINATION"],
    escalationContact: "자재관리팀장 (내선 3001)"
  }
];

// 메일 발송 템플릿
export interface EmailTemplate {
  templateId: string;
  templateName: string;
  subject: string;
  recipients: {
    type: "TO" | "CC";
    role: string;
  }[];
  bodyTemplate: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    templateId: "ET-001",
    templateName: "불량 분석 협의 요청",
    subject: "[품질분석] {defectType} 불량 분석 협의 요청 - {customer} {productModel}",
    recipients: [
      { type: "TO", role: "귀책부서 담당자" },
      { type: "TO", role: "품질담당자" },
      { type: "CC", role: "품질보증팀장" },
      { type: "CC", role: "생산기술팀장" }
    ],
    bodyTemplate: `안녕하세요.

{customer} 고객사의 {productModel} 제품에서 발생한 {defectType} 불량 건에 대해 분석 협의를 요청드립니다.

■ 불량 개요
- 접수번호: {caseId}
- 고객사: {customer}
- 제품: {productModel}
- LOT: {lotId}
- 불량유형: {defectType}
- 불량수량: {defectQty}개

■ 1차 분석 결과
{primaryAnalysis}

■ 협의 요청 사항
1. 귀책부서 확인 및 원인 분석 검토
2. 개선 대책 수립 일정 협의
3. 고객 피드백 내용 공유

회신 기한: {dueDate}

감사합니다.

{sender}
품질보증팀`
  },
  {
    templateId: "ET-002",
    templateName: "분석 결과 공유",
    subject: "[품질분석완료] {defectType} 불량 분석 결과 - {customer} {productModel}",
    recipients: [
      { type: "TO", role: "고객담당자" },
      { type: "CC", role: "영업담당자" },
      { type: "CC", role: "품질보증팀장" }
    ],
    bodyTemplate: `Dear {customerContact},

분석 결과를 공유드립니다.

■ Case Information
- Case ID: {caseId}
- Product: {productModel}
- LOT: {lotId}
- Defect Type: {defectType}

■ Root Cause Analysis
{rootCause}

■ Corrective Actions
{correctiveActions}

■ Preventive Actions
{preventiveActions}

Please let us know if you have any questions.

Best regards,
{sender}
Quality Assurance Team`
  }
];

// 상신 결재 정보
export interface ApprovalRequest {
  requestId: string;
  caseId: string;
  requestType: "분석결과 상신" | "긴급 에스컬레이션" | "개선대책 승인";
  status: "draft" | "pending" | "approved" | "rejected";
  approvalLine: {
    step: number;
    approver: string;
    position: string;
    status: "pending" | "approved" | "rejected";
    comment?: string;
    approvedAt?: string;
  }[];
  createdAt: string;
  summary: string;
}

export const APPROVAL_TEMPLATES = {
  analysisResult: {
    title: "품질 불량 분석 결과 보고서",
    approvalLine: [
      { step: 1, approver: "이미라", position: "품질보증팀 선임", status: "pending" as const },
      { step: 2, approver: "박철수", position: "품질보증팀 수석", status: "pending" as const },
      { step: 3, approver: "김부장", position: "품질보증팀장", status: "pending" as const }
    ],
    sections: [
      "1. 불량 개요",
      "2. 데이터 수집 결과",
      "3. 1차 분석 결과 (AI)",
      "4. 귀책부서 검토 의견",
      "5. 원인 분석 (5-Why, FTA 등)",
      "6. 시정 조치",
      "7. 예방 대책",
      "8. 일정 계획"
    ]
  }
};

// 분석 단계별 프롬프트 생성 함수
export function getCustomerContactPrompt(customer: string): string {
  const contact = CUSTOMER_CONTACTS.find(c => c.customer === customer);
  if (!contact) {
    return `${customer} 고객사의 담당자 정보를 조회할 수 없습니다.`;
  }

  return `## 고객 담당자 정보

### 담당자 상세
- **이름**: ${contact.name}
- **부서**: ${contact.department}
- **직책**: ${contact.position}
- **이메일**: ${contact.email}
- **전화번호**: ${contact.phone}
- **선호 연락 방식**: ${contact.preferredContact === 'email' ? '이메일' : contact.preferredContact === 'phone' ? '전화' : '이메일/전화'}

### 최근 커뮤니케이션 이력
${contact.communicationHistory.map(h => `
#### ${h.date} - ${h.type === 'email' ? '📧 이메일' : h.type === 'phone' ? '📞 전화' : '👥 미팅'}
- **제목**: ${h.subject}
- **내용**: ${h.summary}
- **담당자**: ${h.handler}
`).join('')}

---
*위 정보를 확인하고, 필요시 고객사에 연락하여 추가 정보를 요청하세요.*`;
}

export function getQualityReviewPrompt(defectType: string): string {
  const managers = QUALITY_MANAGERS;
  const recommendedManager = managers.find(m =>
    m.specialization.some(s => s.includes(defectType) || defectType.includes(s.split(' ')[0]))
  ) || managers[0];

  const responsibleDept = RESPONSIBLE_DEPARTMENTS.find(d =>
    d.defectTypes.includes(defectType)
  ) || RESPONSIBLE_DEPARTMENTS[0];

  return `## 품질담당자 및 귀책부서 확인

### 추천 품질담당자
| 항목 | 내용 |
|------|------|
| 담당자 | **${recommendedManager.name}** |
| 부서 | ${recommendedManager.department} |
| 직책 | ${recommendedManager.position} |
| 전문분야 | ${recommendedManager.specialization.join(', ')} |
| 이메일 | ${recommendedManager.email} |
| 연락처 | ${recommendedManager.phone} |
| 현재 담당 건수 | ${recommendedManager.currentCases}건 |

### 추정 귀책부서
| 항목 | 내용 |
|------|------|
| 부서명 | **${responsibleDept.departmentName}** |
| 부서장 | ${responsibleDept.manager} |
| 담당 불량유형 | ${responsibleDept.defectTypes.join(', ')} |
| 에스컬레이션 | ${responsibleDept.escalationContact} |

### 기타 품질담당자 목록
${managers.filter(m => m.managerId !== recommendedManager.managerId).map(m => `
- **${m.name}** (${m.position}) - ${m.specialization.join(', ')} [담당 ${m.currentCases}건]`).join('')}

### 기타 관련 부서
${RESPONSIBLE_DEPARTMENTS.filter(d => d.departmentId !== responsibleDept.departmentId).slice(0, 3).map(d => `
- **${d.departmentName}** - ${d.defectTypes.join(', ')}`).join('')}

---
*품질담당자와 귀책부서를 확정하고, 다음 단계로 진행하세요.*`;
}

export function getEmailDraftPrompt(params: {
  caseId: string;
  customer: string;
  productModel: string;
  lotId: string;
  defectType: string;
  primaryAnalysis: string;
}): string {
  const template = EMAIL_TEMPLATES[0];
  const contact = CUSTOMER_CONTACTS.find(c => c.customer === params.customer);
  const responsibleDept = RESPONSIBLE_DEPARTMENTS.find(d =>
    d.defectTypes.includes(params.defectType)
  ) || RESPONSIBLE_DEPARTMENTS[0];
  const qualityManager = QUALITY_MANAGERS[0];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);

  return `## 분석 협의 메일 발송

### 메일 정보
- **템플릿**: ${template.templateName}
- **제목**: ${template.subject
    .replace('{defectType}', params.defectType)
    .replace('{customer}', params.customer)
    .replace('{productModel}', params.productModel)}

### 수신자
| 구분 | 수신자 | 이메일 |
|------|--------|--------|
| TO | ${responsibleDept.departmentName} 담당자 | ${responsibleDept.manager.toLowerCase().replace(' ', '.')}@company.com |
| TO | 품질담당자 (${qualityManager.name}) | ${qualityManager.email} |
| CC | 품질보증팀장 | qa.manager@company.com |
| CC | 생산기술팀장 | prod.manager@company.com |

### 메일 본문 미리보기

---

**제목: ${template.subject
    .replace('{defectType}', params.defectType)
    .replace('{customer}', params.customer)
    .replace('{productModel}', params.productModel)}**

안녕하세요.

${params.customer} 고객사의 ${params.productModel} 제품에서 발생한 ${params.defectType} 불량 건에 대해 분석 협의를 요청드립니다.

■ 불량 개요
- 접수번호: ${params.caseId}
- 고객사: ${params.customer}
- 제품: ${params.productModel}
- LOT: ${params.lotId}
- 불량유형: ${params.defectType}

■ 1차 분석 결과
${params.primaryAnalysis || 'AI 기반 1차 분석 결과가 여기에 포함됩니다.'}

■ 협의 요청 사항
1. 귀책부서 확인 및 원인 분석 검토
2. 개선 대책 수립 일정 협의
3. 고객 피드백 내용 공유

회신 기한: ${dueDate.toISOString().split('T')[0]}

감사합니다.

품질보증팀

---

### 첨부파일
- [ ] 1차 분석 보고서.pdf
- [ ] 데이터 수집 결과.xlsx
- [ ] 불량 이미지.zip

---
*위 내용을 확인하고 [메일 발송] 버튼을 클릭하여 발송하세요.*`;
}

export function getApprovalRequestPrompt(params: {
  caseId: string;
  customer: string;
  productModel: string;
  defectType: string;
  analysisResult: string;
}): string {
  const template = APPROVAL_TEMPLATES.analysisResult;
  const today = new Date().toISOString().split('T')[0];

  return `## 분석결과 상신

### 결재 정보
- **문서 종류**: ${template.title}
- **접수번호**: ${params.caseId}
- **기안일**: ${today}
- **기안자**: 현재 사용자

### 결재선
| 순서 | 결재자 | 직책 | 상태 |
|------|--------|------|------|
${template.approvalLine.map(a => `| ${a.step} | ${a.approver} | ${a.position} | ⏳ 대기 |`).join('\n')}

### 보고서 구성
${template.sections.map((s, i) => `${i + 1}. ${s.replace(/^\d+\.\s*/, '')}`).join('\n')}

### 보고서 미리보기

---

# 품질 불량 분석 결과 보고서

## 1. 불량 개요
| 항목 | 내용 |
|------|------|
| 접수번호 | ${params.caseId} |
| 고객사 | ${params.customer} |
| 제품 | ${params.productModel} |
| 불량유형 | ${params.defectType} |
| 접수일 | ${today} |

## 2. 분석 결과 요약
${params.analysisResult || 'AI 분석 결과 및 담당자 검토 의견이 여기에 포함됩니다.'}

## 3. 귀책부서 및 담당자
- 귀책부서: OLED 생산1팀
- 품질담당자: 박철수 수석

## 4. 시정 조치
1. 즉시 조치: 해당 LOT 격리 및 전수 검사
2. 단기 조치: 공정 파라미터 조정 및 모니터링 강화
3. 장기 조치: 설비 개선 및 작업 표준 개정

## 5. 일정 계획
| 항목 | 완료 예정일 |
|------|------------|
| 원인 분석 완료 | ${new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]} |
| 시정 조치 완료 | ${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]} |
| 고객 회신 | ${new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0]} |

---

### 첨부 문서
- [ ] 상세 분석 보고서
- [ ] 데이터 수집 결과
- [ ] 시정조치 계획서

---
*내용을 확인하고 [상신] 버튼을 클릭하여 결재를 요청하세요.*`;
}
