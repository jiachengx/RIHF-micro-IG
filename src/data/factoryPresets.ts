export interface MicroIgElement {
  elementId: string;
  fhirPath: string;
  label: string;
  dataType: string;
  cardinality: string;
  terminologySystem: string;
  terminologyCode: string;
  clinicalRule: string;
}

export interface AppFormField {
  fieldKey: string;
  label: string;
  inputType: 'number' | 'select' | 'text' | 'scale';
  unit: string;
  defaultValue: string;
  options: string[];
  fhirPath: string;
  loincOrSnomedCode: string;
  warningThresholdHint: string;
}

export interface WorkflowStep {
  stepNumber: string;
  title: string;
  actor: string;
  description: string;
}

export interface GovernanceCheck {
  pillar: string;
  checkItem: string;
  status: 'passed' | 'warning';
  detail: string;
}

export interface PersonalizedAppSpec {
  id: string;
  shortLabel: string;
  appTitle: string;
  rolePersona: string;
  versionTag: string;
  problemStatement: string;
  profileUrl: string;
  primaryResourceType: 'Observation' | 'Condition' | 'CarePlan' | 'QuestionnaireResponse' | 'MedicationStatement' | 'DiagnosticReport';
  primaryCodeSystem: string;
  primaryCode: string;
  primaryDisplay: string;
  selectedModules: string[];
  microIgElements: MicroIgElement[];
  formFields: AppFormField[];
  workflowSteps: WorkflowStep[];
  governanceChecks: GovernanceCheck[];
  evolutionNote: string;
}

export interface ReusableModuleSpec {
  moduleId: string;
  fhirResource: string;
  chineseName: string;
  summary: string;
  coreElements: string;
  standardSystems: string;
  reusedByApps: string;
}

export const REUSABLE_FHIR_MODULES: ReusableModuleSpec[] = [
  {
    moduleId: 'mod-patient',
    fhirResource: 'Patient',
    chineseName: '病人基本資料模組',
    summary: '統一管理跨應用之病人識別碼、人口學資料、緊急聯絡人與照護機構歸屬。',
    coreElements: 'identifier · name · gender · birthDate · telecom · address · generalPractitioner',
    standardSystems: 'TW Core Patient · OID 身分證與病歷號規範',
    reusedByApps: '護理師 A · 醫師 B · 病人 C · 照護機構 D',
  },
  {
    moduleId: 'mod-problem',
    fhirResource: 'Condition',
    chineseName: '病人問題管理模組 (Problem)',
    summary: '結構化紀錄慢性病、壓瘡分期、術後併發症與待解決照護問題。',
    coreElements: 'clinicalStatus · verificationStatus · category · severity · code · bodySite · onsetDateTime',
    standardSystems: 'SNOMED-CT · ICD-10-CM',
    reusedByApps: '護理師 A · 醫師 B · 照護機構 D',
  },
  {
    moduleId: 'mod-observation',
    fhirResource: 'Observation',
    chineseName: '觀察與生理監測模組',
    summary: '支援生命徵象、居家血糖、傷口長寬深量測、滲液評估與 IoT 穿戴式設備數值。',
    coreElements: 'status · category · code · subject · effectiveDateTime · valueQuantity · component',
    standardSystems: 'LOINC · UCUM 度量單位標準',
    reusedByApps: '護理師 A · 醫師 B · 病人 C · 照護機構 D',
  },
  {
    moduleId: 'mod-careplan',
    fhirResource: 'CarePlan',
    chineseName: '跨專業照護計畫模組',
    summary: '整合醫師醫囑、護理換藥計畫、營養師飲食建議與居服員日常翻身排程。',
    coreElements: 'status · intent · category · title · period · addresses · activity · goal',
    standardSystems: 'SNOMED-CT Care Plan · TW Core CarePlan',
    reusedByApps: '醫師 B · 照護機構 D',
  },
  {
    moduleId: 'mod-questionnaire',
    fhirResource: 'Questionnaire',
    chineseName: '結構化評估問卷模組',
    summary: '提供巴氏量表 (Barthel Index)、Braden 壓瘡風險量表、疼痛與生活品質自評問卷。',
    coreElements: 'url · status · subjectType · item.linkId · item.code · item.type · item.answerOption',
    standardSystems: 'LOINC Assessment Scales · HL7 SDC',
    reusedByApps: '護理師 A · 病人 C · 照護機構 D',
  },
  {
    moduleId: 'mod-medication',
    fhirResource: 'MedicationStatement',
    chineseName: '用藥紀錄與順從性模組',
    summary: '追蹤口服降血糖藥、抗生素敷料、止痛藥物使用紀錄與居家服藥順從度。',
    coreElements: 'status · medicationCodeableConcept · subject · effectivePeriod · dosage · reasonReference',
    standardSystems: 'RxNorm · 健保用藥品項代碼 (ATC)',
    reusedByApps: '醫師 B · 病人 C',
  },
  {
    moduleId: 'mod-diagnostic',
    fhirResource: 'DiagnosticReport',
    chineseName: '照護與診斷報告模組 (含 Media)',
    summary: '彙整傷口多模態影像追蹤報告、細菌培養檢驗與定期居家訪視總結報告。',
    coreElements: 'status · category · code · effectiveDateTime · result · media · conclusion',
    standardSystems: 'LOINC Report Codes · DICOM / Media Attachment',
    reusedByApps: '護理師 A · 醫師 B',
  },
];

export const SIMULATED_PATIENTS = [
  {
    id: 'pat-001',
    name: '林陳阿妹 (78歲 · 居家照護)',
    summary: '薦骨第 3 期壓瘡 · 第二型糖尿病 · 巴氏量表 35 分',
    nhiId: 'A201849***',
    primaryCareTeam: '社區居家護理所 A / 家醫科陳醫師 / 安心居服機構',
  },
  {
    id: 'pat-002',
    name: '張志明 (64歲 · 術後出院準備)',
    summary: '右小腿糖尿病足清創術後 · 高血壓 · 居家遠距傷口追蹤',
    nhiId: 'F120983***',
    primaryCareTeam: '社區居家護理所 A / 整形外科林醫師',
  },
  {
    id: 'pat-003',
    name: '王美玉 (82歲 · 日間照顧中心)',
    summary: '左髖關節置換術後復健 · 輕度失智 · 居家防跌與營養監測',
    nhiId: 'B200412***',
    primaryCareTeam: '安心居服機構 / 復健科黃醫師',
  },
];

export const PRESET_APPLICATIONS: PersonalizedAppSpec[] = [
  {
    id: 'app-nurse-wound',
    shortLabel: '護理師 A · 傷口照護應用',
    appTitle: '居家傷口照護與多模態評估紀錄系統',
    rolePersona: '護理師 A (社區居家護理師)',
    versionTag: 'v1.4.0 · Micro-IG 認證',
    problemStatement: '解決居家訪視時紙本紀錄繁瑣、傷口尺寸與滲液描述不一致，且主治醫師與居服員無法即時同步傷口惡化風險之問題。',
    profileUrl: 'https://fhir.micro-ig.tw/StructureDefinition/HomeWoundObservation',
    primaryResourceType: 'Observation',
    primaryCodeSystem: 'LOINC',
    primaryCode: '39135-9',
    primaryDisplay: 'Wound assessment panel (居家傷口結構化評估組套)',
    selectedModules: ['Patient', 'Problem', 'Observation', 'DiagnosticReport'],
    microIgElements: [
      {
        elementId: 'Observation.subject',
        fhirPath: 'Observation.subject',
        label: '照護對象參照 (Patient Reference)',
        dataType: 'Reference(Patient)',
        cardinality: '1..1',
        terminologySystem: 'TW Core Patient',
        terminologyCode: 'Patient/pat-001',
        clinicalRule: '必填，綁定共用平台統一病人識別碼',
      },
      {
        elementId: 'Observation.bodySite',
        fhirPath: 'Observation.bodySite',
        label: '傷口解剖部位',
        dataType: 'CodeableConcept',
        cardinality: '1..1',
        terminologySystem: 'SNOMED-CT',
        terminologyCode: '54735007 (Sacral region)',
        clinicalRule: '限定使用 SNOMED-CT 解剖部位代碼集',
      },
      {
        elementId: 'Observation.component:length',
        fhirPath: 'Observation.component[length].valueQuantity',
        label: '傷口長度 (Length)',
        dataType: 'Quantity (cm)',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '39125-0',
        clinicalRule: '單位固定為 UCUM cm，數值範圍 0.1 - 50.0',
      },
      {
        elementId: 'Observation.component:width',
        fhirPath: 'Observation.component[width].valueQuantity',
        label: '傷口寬度 (Width)',
        dataType: 'Quantity (cm)',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '39126-8',
        clinicalRule: '單位固定為 UCUM cm，數值範圍 0.1 - 50.0',
      },
      {
        elementId: 'Observation.component:depth',
        fhirPath: 'Observation.component[depth].valueQuantity',
        label: '傷口深度 (Depth)',
        dataType: 'Quantity (cm)',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '39127-6',
        clinicalRule: '深度 > 1.0 cm 時自動標記第 3/4 期深部組織警示',
      },
      {
        elementId: 'Observation.component:exudate',
        fhirPath: 'Observation.component[exudate].valueCodeableConcept',
        label: '滲液量與性質',
        dataType: 'CodeableConcept',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '39116-9',
        clinicalRule: '膿性或惡臭滲液時觸發感染風險通報',
      },
      {
        elementId: 'Observation.component:pain',
        fhirPath: 'Observation.component[pain].valueInteger',
        label: '換藥疼痛評分 (NRS 0-10)',
        dataType: 'integer',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '72514-3',
        clinicalRule: '0 至 10 整數，>= 6 分提示評估換藥前止痛處置',
      },
    ],
    formFields: [
      {
        fieldKey: 'woundSite',
        label: '傷口部位与分期',
        inputType: 'select',
        unit: '',
        defaultValue: '薦骨部 (Sacrum) · 壓瘡第 3 期',
        options: [
          '薦骨部 (Sacrum) · 壓瘡第 3 期',
          '右足跟 (Right Heel) · 糖尿病足潰瘍',
          '左大轉子 (Left Trochanter) · 壓瘡第 2 期',
          '下肢靜脈潰瘍 (Venous Ulcer)',
        ],
        fhirPath: 'Observation.bodySite',
        loincOrSnomedCode: 'SNOMED 54735007',
        warningThresholdHint: '深部部位需同步檢視減壓氣墊床設定',
      },
      {
        fieldKey: 'lengthCm',
        label: '傷口長度 (Length)',
        inputType: 'number',
        unit: 'cm',
        defaultValue: '3.8',
        options: [],
        fhirPath: 'Observation.component[length].valueQuantity',
        loincOrSnomedCode: 'LOINC 39125-0',
        warningThresholdHint: '較前次縮小代表肉芽組織生長良好',
      },
      {
        fieldKey: 'widthCm',
        label: '傷口寬度 (Width)',
        inputType: 'number',
        unit: 'cm',
        defaultValue: '3.2',
        options: [],
        fhirPath: 'Observation.component[width].valueQuantity',
        loincOrSnomedCode: 'LOINC 39126-8',
        warningThresholdHint: '自動計算面積 = 長 × 寬',
      },
      {
        fieldKey: 'depthCm',
        label: '傷口深度 (Depth)',
        inputType: 'number',
        unit: 'cm',
        defaultValue: '0.6',
        options: [],
        fhirPath: 'Observation.component[depth].valueQuantity',
        loincOrSnomedCode: 'LOINC 39127-6',
        warningThresholdHint: '> 1.0 cm 觸發深部潛行腔洞警示',
      },
      {
        fieldKey: 'exudateType',
        label: '滲液量與外觀性質',
        inputType: 'select',
        unit: '',
        defaultValue: '少量漿液性 (清澈淡黃)',
        options: [
          '無滲液 (乾燥上皮化)',
          '少量漿液性 (清澈淡黃)',
          '中量血水樣 (粉紅微紅)',
          '大量膿性伴隨異味 (疑似感染警示)',
        ],
        fhirPath: 'Observation.component[exudate].valueCodeableConcept',
        loincOrSnomedCode: 'LOINC 39116-9',
        warningThresholdHint: '大量膿性將自動標記為警示狀態並通知醫師 B',
      },
      {
        fieldKey: 'dressingUsed',
        label: '本次處置與敷料選擇',
        inputType: 'select',
        unit: '',
        defaultValue: '生理食鹽水清潔 + 親水性泡棉敷料 (Hydrocellular Foam)',
        options: [
          '生理食鹽水清潔 + 親水性泡棉敷料 (Hydrocellular Foam)',
          '抗菌銀離子敷料 (Ag+ Alginate) + 二層紗布固定',
          '水凝膠清創膠 (Hydrogel) + 透明薄膜敷料',
          '負壓傷口治療系統 (NPWT) 管路照護',
        ],
        fhirPath: 'Observation.note[0].text',
        loincOrSnomedCode: 'SNOMED 182531007',
        warningThresholdHint: '記錄敷料耗材供居家照護機構 D 備料',
      },
      {
        fieldKey: 'painScore',
        label: '換藥時疼痛指數 (NRS 0-10)',
        inputType: 'scale',
        unit: '分',
        defaultValue: '3',
        options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        fhirPath: 'Observation.component[pain].valueInteger',
        loincOrSnomedCode: 'LOINC 72514-3',
        warningThresholdHint: '>= 6 分觸發換藥止痛醫囑建議',
      },
    ],
    workflowSteps: [
      {
        stepNumber: '01',
        title: '居家訪視床邊評估與拍攝',
        actor: '護理師 A',
        description: '開啟個人化傷口照護表單，輸入長寬深、滲液與疼痛評分，系統自動計算傷口面積變化。',
      },
      {
        stepNumber: '02',
        title: 'FHIR Micro-IG 標準化封裝',
        actor: 'AI 轉換引擎',
        description: '自動將表單欄位映射為帶 LOINC 39135-9 與 SNOMED-CT 代碼之 FHIR Observation 與 Media 資源。',
      },
      {
        stepNumber: '03',
        title: '寫入共用 FHIR 資料伺服器',
        actor: '共用基礎平台',
        description: '透過 OAuth / RBAC 權限檢核與稽核軌跡，安全存入多模態 FHIR Server。',
      },
      {
        stepNumber: '04',
        title: '跨角色即時互通與協同照護',
        actor: '醫師 B / 機構 D',
        description: '醫師 B 於病情追蹤應用即時檢視傷口縮小趨勢；照護機構 D 同步更新翻身與敷料準備計畫。',
      },
    ],
    governanceChecks: [
      {
        pillar: '基礎標準化',
        checkItem: 'FHIR R4 結構與國際術語綁定檢核',
        status: 'passed',
        detail: '100% 欄位對齊 LOINC (39135-9, 39125-0, 39126-8) 與 UCUM 度量單位，無私有未定義欄位。',
      },
      {
        pillar: '應用個別化',
        checkItem: '居家護理師單手快速點選介面最佳化',
        status: 'passed',
        detail: '依護理師 A 實務回饋精簡為 7 個核心臨床欄位，免除傳統 HIS 住院系統 40+ 個無關欄位。',
      },
      {
        pillar: '資料互通化',
        checkItem: '跨應用讀寫相容性驗證',
        status: 'passed',
        detail: '寫入之 Observation 資源可直接被醫師 B 病情面板與機構 D 照護計畫引用 (supportingInfo)。',
      },
      {
        pillar: '治理共同化',
        checkItem: 'RBAC 最小權限與資安稽核政策',
        status: 'passed',
        detail: '限定授權照護團隊存取，所有修改皆保留 FHIR Provenance 簽章與版本紀錄。',
      },
    ],
    evolutionNote: '由居家護理師 A 描述傷口訪視痛點，經 AI 協作 3 次迭代（新增滲液異味警示與敷料耗材連動），無須中央資訊部門排程即完成部署。',
  },
  {
    id: 'app-doctor-tracker',
    shortLabel: '醫師 B · 病情追蹤應用',
    appTitle: '慢性共病與傷口癒合縱向病情追蹤台',
    rolePersona: '醫師 B (家庭醫學科 / 整合照護主治醫師)',
    versionTag: 'v1.2.0 · Micro-IG 認證',
    problemStatement: '醫師巡診或遠距會診時，需同時對照病人的血糖控制、營養指標與居家傷口癒合速度，傳統系統分散於不同畫面難以綜合判讀。',
    profileUrl: 'https://fhir.micro-ig.tw/StructureDefinition/ChronicProblemCondition',
    primaryResourceType: 'Condition',
    primaryCodeSystem: 'SNOMED-CT',
    primaryCode: '44054006',
    primaryDisplay: 'Chronic comorbidity & wound healing clinical review (共病與傷口整合評估)',
    selectedModules: ['Patient', 'Problem', 'Observation', 'Medication', 'CarePlan'],
    microIgElements: [
      {
        elementId: 'Condition.code',
        fhirPath: 'Condition.code',
        label: '主要臨床診斷問題',
        dataType: 'CodeableConcept',
        cardinality: '1..1',
        terminologySystem: 'SNOMED-CT',
        terminologyCode: '44054006 / 421076008',
        clinicalRule: '綁定 SNOMED-CT 與健保 ICD-10-CM 雙代碼映射',
      },
      {
        elementId: 'Condition.clinicalStatus',
        fhirPath: 'Condition.clinicalStatus',
        label: '問題臨床狀態',
        dataType: 'CodeableConcept',
        cardinality: '1..1',
        terminologySystem: 'HL7 Condition Clinical Status',
        terminologyCode: 'active | recurrence | remission | resolved',
        clinicalRule: '必填，反映目前共病與傷口控制情形',
      },
      {
        elementId: 'Observation.hba1c',
        fhirPath: 'Observation.valueQuantity (HbA1c)',
        label: '糖化血色素 (HbA1c)',
        dataType: 'Quantity (%)',
        cardinality: '0..1',
        terminologySystem: 'LOINC',
        terminologyCode: '4548-4',
        clinicalRule: '> 7.5% 時提示高血糖延緩傷口癒合風險',
      },
      {
        elementId: 'Condition.note',
        fhirPath: 'Condition.note[0].text',
        label: '跨團隊醫療處置與換藥醫囑指導',
        dataType: 'Annotation',
        cardinality: '1..1',
        terminologySystem: 'FHIR Annotation',
        terminologyCode: 'Clinical Directive',
        clinicalRule: '同步推播至護理師 A 與照護機構 D',
      },
    ],
    formFields: [
      {
        fieldKey: 'primaryDiagnosis',
        label: '核心追蹤診斷問題',
        inputType: 'select',
        unit: '',
        defaultValue: '第二型糖尿病合併薦骨壓瘡癒合遲緩',
        options: [
          '第二型糖尿病合併薦骨壓瘡癒合遲緩',
          '周邊動脈阻塞性疾病合併下肢潰瘍',
          '術後傷口局部蜂窩性組織炎風險',
          '慢性腎臟病第 4 期合併低白蛋白營養不良',
        ],
        fhirPath: 'Condition.code',
        loincOrSnomedCode: 'SNOMED 44054006',
        warningThresholdHint: '自動關聯病人問題清單 (Problem List)',
      },
      {
        fieldKey: 'healingTrajectory',
        label: '傷口與共病整合臨床判定',
        inputType: 'select',
        unit: '',
        defaultValue: '穩定改善中 (肉芽組織新生 >= 70%)',
        options: [
          '穩定改善中 (肉芽組織新生 >= 70%)',
          '癒合停滯 (需調整減壓或血糖用藥)',
          '疑似感染惡化 (需開立細菌培養與抗生素)',
          '已達臨床癒合標準 (可調降訪視頻率)',
        ],
        fhirPath: 'Condition.clinicalStatus',
        loincOrSnomedCode: 'HL7 active/remission',
        warningThresholdHint: '疑似感染惡化將觸發緊急居家訪視通知',
      },
      {
        fieldKey: 'latestHba1c',
        label: '最近期糖化血色素 (HbA1c)',
        inputType: 'number',
        unit: '%',
        defaultValue: '7.4',
        options: [],
        fhirPath: 'Observation.valueQuantity',
        loincOrSnomedCode: 'LOINC 4548-4',
        warningThresholdHint: '目標控制於 < 7.5% 以促進微血管修復',
      },
      {
        fieldKey: 'serumAlbumin',
        label: '血清白蛋白 (Albumin 營養指標)',
        inputType: 'number',
        unit: 'g/dL',
        defaultValue: '3.3',
        options: [],
        fhirPath: 'Observation.valueQuantity',
        loincOrSnomedCode: 'LOINC 1751-7',
        warningThresholdHint: '< 3.5 g/dL 建議照護機構 D 強化高蛋白營養補充',
      },
      {
        fieldKey: 'physicianDirective',
        label: '跨團隊醫囑與照護調整指示',
        inputType: 'text',
        unit: '',
        defaultValue: '傷口面積較上週縮小 15%，請維持親水性泡棉敷料每 3 日換藥，並請家屬持續紀錄餐後血糖。',
        options: [],
        fhirPath: 'Condition.note[0].text',
        loincOrSnomedCode: 'LOINC 51847-2',
        warningThresholdHint: '寫入後即時同步至護理師 A 及居服機構 D',
      },
    ],
    workflowSteps: [
      {
        stepNumber: '01',
        title: '自動聚合跨來源 FHIR 資料',
        actor: '醫師 B 專屬應用',
        description: '自動從 FHIR Server 讀取護理師 A 的傷口 Observation 與病人 C 的居家血糖紀錄。',
      },
      {
        stepNumber: '02',
        title: '共病與癒合速率綜合判讀',
        actor: '醫師 B',
        description: '同屏檢視傷口面積曲線、HbA1c 與白蛋白數值，判斷是否需調整抗生素或降血糖藥物。',
      },
      {
        stepNumber: '03',
        title: '簽署標準化問題與醫囑更新',
        actor: 'AI 轉換引擎',
        description: '產出符合 TW Core Condition 與 CarePlan 標準之結構化評估紀錄。',
      },
      {
        stepNumber: '04',
        title: '回饋照護團隊執行閉環',
        actor: '護理師 A / 機構 D',
        description: '更新後的臨床指示即時顯示於護理師與居服員的各自應用中。',
      },
    ],
    governanceChecks: [
      {
        pillar: '基礎標準化',
        checkItem: 'SNOMED-CT 問題清單與 LOINC 檢驗代碼對齊',
        status: 'passed',
        detail: '診斷問題與檢驗指標均採用國際標準編碼，支援跨院電子病歷交換。',
      },
      {
        pillar: '應用個別化',
        checkItem: '問題導向縱向追蹤視圖 (Problem-Oriented View)',
        status: 'passed',
        detail: '依醫師 B 臨床決策習慣，將傷口尺寸與血糖趨勢整合於單一決策面板。',
      },
      {
        pillar: '資料互通化',
        checkItem: '雙向參照護理師 A 與病人 C 之 Observation',
        status: 'passed',
        detail: '無須重複輸入生命徵象與傷口數據，直接透過 FHIR Reference 串聯。',
      },
      {
        pillar: '治理共同化',
        checkItem: '醫囑簽章與責任歸屬稽核',
        status: 'passed',
        detail: '符合醫療機構電子病歷製作及管理辦法之身分驗證與時間戳記規範。',
      },
    ],
    evolutionNote: '醫師 B 針對多重慢性病居家個案，要求將白蛋白營養指標與傷口癒合進度並列呈現，AI 即時完成跨模組視圖組合。',
  },
  {
    id: 'app-patient-self',
    shortLabel: '病人 C · 個人健康管理',
    appTitle: '病人與家屬居家健康自主紀錄助手',
    rolePersona: '病人 C / 主要照顧家屬',
    versionTag: 'v1.1.0 · Micro-IG 認證',
    problemStatement: '長輩與家屬在家量測血壓、血糖與觀察傷口滲血時，常忘記數值或不知何時該聯絡護理師，需要字體清晰、免專業術語的回報介面。',
    profileUrl: 'https://fhir.micro-ig.tw/StructureDefinition/PatientHomeVitalSigns',
    primaryResourceType: 'Observation',
    primaryCodeSystem: 'LOINC',
    primaryCode: '85354-9',
    primaryDisplay: 'Patient home vital signs & self-monitoring panel (居家生理量測與自評紀錄)',
    selectedModules: ['Patient', 'Observation', 'Questionnaire', 'Medication'],
    microIgElements: [
      {
        elementId: 'Observation.systolic',
        fhirPath: 'Observation.component[systolic].valueQuantity',
        label: '收縮壓 (Systolic BP)',
        dataType: 'Quantity (mmHg)',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '8480-6',
        clinicalRule: '單位 mm[Hg]，>= 160 mmHg 觸發紅燈關懷提醒',
      },
      {
        elementId: 'Observation.glucose',
        fhirPath: 'Observation.component[glucose].valueQuantity',
        label: '餐後血糖 (Postprandial Glucose)',
        dataType: 'Quantity (mg/dL)',
        cardinality: '0..1',
        terminologySystem: 'LOINC',
        terminologyCode: '1521-4',
        clinicalRule: '單位 mg/dL，>= 200 或 < 70 mg/dL 觸發異常通知',
      },
      {
        elementId: 'Observation.dressingCheck',
        fhirPath: 'Observation.component[dressing].valueString',
        label: '居家敷料外觀自我檢查',
        dataType: 'string',
        cardinality: '1..1',
        terminologySystem: 'LOINC',
        terminologyCode: '75325-1',
        clinicalRule: '家屬白話選項自動映射為臨床觀察代碼',
      },
    ],
    formFields: [
      {
        fieldKey: 'systolicBp',
        label: '今日收縮壓 (高壓)',
        inputType: 'number',
        unit: 'mmHg',
        defaultValue: '132',
        options: [],
        fhirPath: 'Observation.component[systolic].valueQuantity',
        loincOrSnomedCode: 'LOINC 8480-6',
        warningThresholdHint: '理想範圍 110 - 140 mmHg',
      },
      {
        fieldKey: 'diastolicBp',
        label: '今日舒張壓 (低壓)',
        inputType: 'number',
        unit: 'mmHg',
        defaultValue: '78',
        options: [],
        fhirPath: 'Observation.component[diastolic].valueQuantity',
        loincOrSnomedCode: 'LOINC 8462-4',
        warningThresholdHint: '理想範圍 60 - 90 mmHg',
      },
      {
        fieldKey: 'postMealGlucose',
        label: '餐後 2 小時血糖值',
        inputType: 'number',
        unit: 'mg/dL',
        defaultValue: '156',
        options: [],
        fhirPath: 'Observation.component[glucose].valueQuantity',
        loincOrSnomedCode: 'LOINC 1521-4',
        warningThresholdHint: '穩定血糖有助於傷口快速長肉癒合',
      },
      {
        fieldKey: 'dressingStatusHome',
        label: '今日傷口紗布/敷料外觀狀況',
        inputType: 'select',
        unit: '',
        defaultValue: '敷料乾爽服貼、無滲血脫落',
        options: [
          '敷料乾爽服貼、無滲血脫落',
          '邊緣微翹但未滲濕 (已協助加固)',
          '紗布滲濕超過一半 (請護理師評估提早換藥)',
          '傷口周圍發紅發熱或長輩喊痛',
        ],
        fhirPath: 'Observation.component[dressing].valueString',
        loincOrSnomedCode: 'LOINC 75325-1',
        warningThresholdHint: '若選滲濕或發紅，系統將自動通知居家護理師 A',
      },
      {
        fieldKey: 'medicationTaken',
        label: '今日早晚常規藥物與高蛋白補充',
        inputType: 'select',
        unit: '',
        defaultValue: '已按時服藥並完成高蛋白飲品補充',
        options: [
          '已按時服藥並完成高蛋白飲品補充',
          '已服藥，但食慾不佳僅喝半杯營養品',
          '漏服一次藥物 (已補服)',
        ],
        fhirPath: 'MedicationStatement.status',
        loincOrSnomedCode: 'SNOMED 418633004',
        warningThresholdHint: '自動同步至個人健康存摺與醫師追蹤面板',
      },
    ],
    workflowSteps: [
      {
        stepNumber: '01',
        title: '家屬白話文每日輕鬆回報',
        actor: '病人 C / 家屬',
        description: '使用大字體、零醫學術語的友善表單輸入血壓、血糖與敷料外觀。',
      },
      {
        stepNumber: '02',
        title: 'AI 自動轉譯為標準 FHIR 資源',
        actor: 'AI 轉換引擎',
        description: '將「紗布滲濕超過一半」等生活語言自動轉譯為標準 LOINC Observation 結構。',
      },
      {
        stepNumber: '03',
        title: '異常數值即時預警',
        actor: '共用基礎平台',
        description: '若血糖過高或敷料滲濕，主動推播提醒至護理師 A 與照護機構 D。',
      },
      {
        stepNumber: '04',
        title: '個人健康資料自主掌握',
        actor: '病人 C',
        description: '病人與家屬可隨時檢視長期趨勢圖，掌握自己的健康與照護進度。',
      },
    ],
    governanceChecks: [
      {
        pillar: '基礎標準化',
        checkItem: '藍牙血壓血糖計與 LOINC 85354-9 標準映射',
        status: 'passed',
        detail: '家屬手動輸入或 IoT 量測皆產出相同規格之 FHIR Observation。',
      },
      {
        pillar: '應用個別化',
        checkItem: '高齡友善大字體與白話選項轉譯介面',
        status: 'passed',
        detail: '將複雜醫學欄位隱藏於幕後，前端僅呈現家屬看得懂的日常問題。',
      },
      {
        pillar: '資料互通化',
        checkItem: '家屬回報數據即時匯入醫療團隊視圖',
        status: 'passed',
        detail: '醫師 B 與護理師 A 可直接調閱家屬每日上傳之連續生理趨勢。',
      },
      {
        pillar: '治理共同化',
        checkItem: '病人知情同意與授權範圍管理 (Consent)',
        status: 'passed',
        detail: '由病人 C 自主授權哪些醫療與長照機構可讀取其居家紀錄。',
      },
    ],
    evolutionNote: '由病患家屬提出「看不懂專業醫學名詞、希望能用日常描述回報紗布狀況」，AI 自動建立白話選項與 FHIR 標準碼雙向映射表。',
  },
  {
    id: 'app-agency-care',
    shortLabel: '照護機構 D · 居家照護管理',
    appTitle: '長照居服機構跨專業翻身減壓與交班系統',
    rolePersona: '照護機構 D (居家服務督導 / 居服員團隊)',
    versionTag: 'v1.3.0 · Micro-IG 認證',
    problemStatement: '居服員每日到宅協助沐浴、翻身與備餐，但過去無法得知護理師最新的傷口忌水指示或醫師的高蛋白飲食建議，導致照護斷層。',
    profileUrl: 'https://fhir.micro-ig.tw/StructureDefinition/IntegratedHomeCarePlan',
    primaryResourceType: 'CarePlan',
    primaryCodeSystem: 'SNOMED-CT',
    primaryCode: '719091000000102',
    primaryDisplay: 'Integrated home care & pressure relief schedule (整合型居家減壓與營養照護計畫)',
    selectedModules: ['Patient', 'CarePlan', 'Observation', 'Questionnaire'],
    microIgElements: [
      {
        elementId: 'CarePlan.title',
        fhirPath: 'CarePlan.title',
        label: '居家日常照護計畫名稱',
        dataType: 'string',
        cardinality: '1..1',
        terminologySystem: 'TW Core CarePlan',
        terminologyCode: 'HomeCarePlan',
        clinicalRule: '明確標示翻身頻率、皮膚保護與營養補充目標',
      },
      {
        elementId: 'CarePlan.activity:positioning',
        fhirPath: 'CarePlan.activity[0].detail.description',
        label: '翻身擺位與減壓氣墊床檢核',
        dataType: 'string',
        cardinality: '1..1',
        terminologySystem: 'SNOMED-CT',
        terminologyCode: '225290002 (Positioning patient)',
        clinicalRule: '每 2 小時左/右/平躺交替，避免薦骨直接受壓',
      },
      {
        elementId: 'CarePlan.activity:nutrition',
        fhirPath: 'CarePlan.activity[1].detail.description',
        label: '高蛋白傷口修復備餐執行紀錄',
        dataType: 'string',
        cardinality: '1..1',
        terminologySystem: 'SNOMED-CT',
        terminologyCode: '386373004 (Nutrition therapy)',
        clinicalRule: '對應醫師 B 之白蛋白與血糖控制目標',
      },
    ],
    formFields: [
      {
        fieldKey: 'repositionSchedule',
        label: '翻身減壓與氣墊床壓力檢核',
        inputType: 'select',
        unit: '',
        defaultValue: '已完成每 2 小時 30 度側臥減壓 · 氣墊床運作正常',
        options: [
          '已完成每 2 小時 30 度側臥減壓 · 氣墊床運作正常',
          '已完成翻身，但尾骶部支撐枕需更換',
          '個案因疼痛抗拒右側臥 (已改採左側臥減壓並回報護理師)',
        ],
        fhirPath: 'CarePlan.activity[0].detail.description',
        loincOrSnomedCode: 'SNOMED 225290002',
        warningThresholdHint: '依據護理師 A 傷口部位自動提示避開受壓區',
      },
      {
        fieldKey: 'skinMoistureProtection',
        label: '失禁皮膚清潔與傷口防水保護',
        inputType: 'select',
        unit: '',
        defaultValue: '沐浴時已使用防水保護膜覆蓋薦骨敷料 · 周邊塗抹隔離霜',
        options: [
          '沐浴時已使用防水保護膜覆蓋薦骨敷料 · 周邊塗抹隔離霜',
          '擦澡清潔完成，敷料保持完整乾燥',
          '排泄物不慎汙染敷料外緣 (已清潔並通報護理師 A 安排換藥)',
        ],
        fhirPath: 'CarePlan.activity[1].detail.description',
        loincOrSnomedCode: 'SNOMED 225358003',
        warningThresholdHint: '汙染敷料將自動發送跨系統交班提醒',
      },
      {
        fieldKey: 'proteinIntakeG',
        label: '今日居服協助蛋白質攝取估計量',
        inputType: 'number',
        unit: '公克 (g)',
        defaultValue: '65',
        options: [],
        fhirPath: 'Observation.valueQuantity',
        loincOrSnomedCode: 'LOINC 9059-7',
        warningThresholdHint: '壓瘡修復建議每日每公斤體重 1.2 - 1.5g 蛋白質',
      },
      {
        fieldKey: 'handoverNote',
        label: '居服督導跨專業交班備註',
        inputType: 'text',
        unit: '',
        defaultValue: '今日長輩精神良好，午餐食用蒸魚與無糖豆漿，薦骨防水敷料完整無滲漏。',
        options: [],
        fhirPath: 'CarePlan.note[0].text',
        loincOrSnomedCode: 'LOINC 81218-0',
        warningThresholdHint: '同步寫入共用 FHIR Server 供全體照護團隊查閱',
      },
    ],
    workflowSteps: [
      {
        stepNumber: '01',
        title: '同步接收醫療端最新照護重點',
        actor: '照護機構 D',
        description: '居服督導系統自動讀取護理師 A 的傷口部位與醫師 B 的營養醫囑。',
      },
      {
        stepNumber: '02',
        title: '居服員到宅執行減壓與備餐打卡',
        actor: '第一線居服員',
        description: '透過行動端勾選翻身角度、敷料防水保護與蛋白質攝取量。',
      },
      {
        stepNumber: '03',
        title: '產生 FHIR CarePlan 與執行紀錄',
        actor: 'AI 轉換引擎',
        description: '將居服日常照顧紀錄標準化為 FHIR CarePlan 與 Observation。',
      },
      {
        stepNumber: '04',
        title: '醫療與長照無縫閉環交班',
        actor: '全體照護團隊',
        description: '若居服員發現敷料受汙染，護理師 A 的應用立即收到換藥排程通知。',
      },
    ],
    governanceChecks: [
      {
        pillar: '基礎標準化',
        checkItem: 'TW Core CarePlan 與長照服務代碼映射',
        status: 'passed',
        detail: '居服照顧項目完整對應 SNOMED-CT 照護活動編碼與衛福部長照給付指標。',
      },
      {
        pillar: '應用個別化',
        checkItem: '居服員到宅任務清單式介面 (Task-Checklist UI)',
        status: 'passed',
        detail: '依居服機構排班與打卡流程量身打造，不強迫居服員閱讀複雜醫療表單。',
      },
      {
        pillar: '資料互通化',
        checkItem: '醫養結合雙向資料流 (Medical-LongTermCare Bridge)',
        status: 'passed',
        detail: '打破醫院 HIS 與長照居服系統資料孤島，以 FHIR Server 為單一真相來源。',
      },
      {
        pillar: '治理共同化',
        checkItem: '跨機構資料存取授權與稽核',
        status: 'passed',
        detail: '居服員僅能存取被指派時段與照護必要欄位，保障敏感病歷隱私。',
      },
    ],
    evolutionNote: '由居服機構督導提出「居服員需要知道哪塊紗布不能碰水、每天要補多少蛋白質」，AI 結合 CarePlan 模組自動生成到宅檢核表。',
  },
];

export interface EcosystemRoleSpec {
  roleTitle: string;
  englishTag: string;
  coreResponsibility: string;
  traditionalPain: string;
  aiEraTransformation: string;
  concreteOutput: string;
}

export const ECOSYSTEM_ROLES: EcosystemRoleSpec[] = [
  {
    roleTitle: '場景專家 (醫護 / 照護實務者)',
    englishTag: 'Domain Expert',
    coreResponsibility: '定義真實臨床問題、工作流程痛點及資料需求',
    traditionalPain: '只能寫需求單排隊等候資訊室，常因溝通落差做出不合用的系統',
    aiEraTransformation: '直接以自然語言與 AI 對話，主導定義場景需要的資料欄位與流程',
    concreteOutput: '臨床場景需求描述 · Micro-IG 欄位定義清單 · 模擬病人驗收回饋',
  },
  {
    roleTitle: 'AI Agent (應用建構與轉譯代理)',
    englishTag: 'AI Builder Agent',
    coreResponsibility: '設計表單、映射 FHIR Micro-IG、產生前端程式碼、測試與文件',
    traditionalPain: '過去無此角色，全靠少數軟體工程師手寫 CRUD 表單與 API 串接',
    aiEraTransformation: '即時將自然語言需求轉為符合 FHIR 標準的 HTML/JS 應用與驗證規則',
    concreteOutput: 'FHIR StructureDefinition · 互動式前端組件 · 自動化測試腳本與說明文件',
  },
  {
    roleTitle: '模組開發者 (標準組件工程師)',
    englishTag: 'Module Developer',
    coreResponsibility: '開發與維護可重複使用的核心功能模組 (Patient, Observation 等)',
    traditionalPain: '為每個專案重複造輪子，深陷各別客製化修改泥淖',
    aiEraTransformation: '專注打造高可靠度、具擴充機制的標準 FHIR 積木供全生態系組合',
    concreteOutput: '7 大醫療核心可重用模組 · 多模態影像與 IoT 轉接元件',
  },
  {
    roleTitle: '標準工作小組 (FHIR Micro-IG 社群)',
    englishTag: 'Standards Working Group',
    coreResponsibility: '維護特定場景的資料欄位規格、國際代碼綁定 (LOINC/SNOMED) 及交換規則',
    traditionalPain: '大型國家級 IG 制定耗時數年，難以快速回應第一線微場景需求',
    aiEraTransformation: '採用敏捷 FHIR Micro-IG 模式，針對單一臨床微場景快速收斂共同規格',
    concreteOutput: '傷口照護 / 居家血糖 / 長照交班等場景化 FHIR Micro-IG 規範',
  },
  {
    roleTitle: '平台管理者 (資安與基礎架構團隊)',
    englishTag: 'Platform Operator',
    coreResponsibility: '管理身分驗證 (OAuth/SMART on FHIR)、資料儲存、資安稽核、部署與授權',
    traditionalPain: '既要管底層資安又要改前端畫面，疲於奔命',
    aiEraTransformation: '固守第一層「共用基礎設施」，確保任何 AI 生成應用皆運行於安全沙箱與統一權限下',
    concreteOutput: '高可用 FHIR Server · RBAC 權限引擎 · 自動化資安與版本部署管道',
  },
  {
    roleTitle: '使用者 (醫護 / 病患 / 家屬 / 居服員)',
    englishTag: 'End User & Co-Creator',
    coreResponsibility: '日常使用個別化應用、提供即時回饋並持續與 AI 協作改善工作流程',
    traditionalPain: '被迫適應僵化難用的單一系統（「十個公婆遷就一個媳婦」）',
    aiEraTransformation: '擁有符合自身角色習慣的專屬應用版本，隨工作演進自主微調介面',
    concreteOutput: '高品質結構化臨床資料 · 持續演進的個人化工作流版本',
  },
  {
    roleTitle: '品質驗證者 (臨床與資安確效專家)',
    englishTag: 'Quality & Safety Validator',
    coreResponsibility: '驗證應用功能正確性、FHIR 資料互通性、臨床邏輯合理性與資安合規',
    traditionalPain: '人工測試耗時，且缺乏統一的資料交換檢核標準',
    aiEraTransformation: '結合自動化 FHIR Validator 與模擬病人測試案例，把關上架前品質',
    concreteOutput: '四大治理檢核簽核報告 · 跨應用資料互通性測試認證',
  },
];

export interface StudentTrackSpec {
  trackName: string;
  discipline: string;
  focusArea: string;
  deliverable: string;
}

export const GLOBAL_STUDENT_TRACKS: StudentTrackSpec[] = [
  {
    trackName: '01. 醫療與長照實證場景組',
    discipline: '護理、醫學、高齡長照、公共衛生學系學生與臨床導師',
    focusArea: '深入居家傷口、慢性病共管、偏鄉照護等真實場域，梳理痛點與臨床工作流',
    deliverable: '結構化場景故事 (User Stories) 與臨床欄位字典',
  },
  {
    trackName: '02. FHIR Micro-IG 標準規格組',
    discipline: '醫學資訊 (Medical Informatics)、生物醫學工程學生',
    focusArea: '將臨床欄位對應至 FHIR R4 Resource、LOINC 與 SNOMED-CT，編寫輕量化 Micro-IG',
    deliverable: 'FHIR StructureDefinition、ValueSet 與範例 Bundle',
  },
  {
    trackName: '03. AI Agent 提示與程式碼生成組',
    discipline: '資工、AI 科學、軟體工程學生',
    focusArea: '訓練與調校能夠理解 Micro-IG 並自動產出高品質安全前端與 API 串接的 AI 代理',
    deliverable: '領域專屬 AI Application Factory 生成引擎',
  },
  {
    trackName: '04. IoT 醫療感測與多模態資料組',
    discipline: '電機、電子、物聯網工程學生',
    focusArea: '串接藍牙血壓計、連續血糖監測 (CGM) 與傷口光學影像，轉為標準 FHIR Observation/Media',
    deliverable: 'IoT-to-FHIR 邊緣閘道器與多模態上傳模組',
  },
  {
    trackName: '05. 個人化前端與人機互動組',
    discipline: '數位設計、人機互動 (HCI)、前端開發學生',
    focusArea: '針對護理師單手操作、高齡病人大字體、醫師高密度決策面板設計最佳化體驗',
    deliverable: '角色適應型 (Role-Adaptive) 響應式微應用樣板庫',
  },
  {
    trackName: '06. 測試、資安與品質驗證組',
    discipline: '資安、軟體測試、醫管法規學生',
    focusArea: '建立模擬病人資料集、FHIR Schema 自動驗證器、OWASP 資安掃描與權限合規檢核',
    deliverable: '自動化品質治理閘門 (Governance Gate) 與驗證報告',
  },
];
