import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 GEMINI_API_KEY 環境變數，請於 Settings > Secrets 面板確認金鑰設定。');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Initial shared FHIR R4 Data Repository (demonstrating cross-app interoperability)
export interface SharedFhirRecord {
  id: string;
  resourceType: 'Observation' | 'Condition' | 'CarePlan' | 'QuestionnaireResponse' | 'MedicationStatement' | 'DiagnosticReport';
  patientId: string;
  patientName: string;
  sourceAppId: string;
  sourceAppName: string;
  authorRole: string;
  createdAt: string;
  codeSystem: string;
  code: string;
  display: string;
  valueSummary: string;
  status: 'final' | 'active' | 'completed' | 'amended';
  alertLevel: 'normal' | 'warning' | 'critical';
  rawFhirJson: Record<string, unknown>;
}

const sharedFhirRepository: SharedFhirRecord[] = [
  {
    id: 'obs-wound-101',
    resourceType: 'Observation',
    patientId: 'pat-001',
    patientName: '林陳阿妹 (78歲 · 居家照護)',
    sourceAppId: 'app-nurse-wound',
    sourceAppName: '居家傷口照護紀錄系統 (護理師 A)',
    authorRole: '居家護理師 (Nurse A)',
    createdAt: '2026-11-17 09:15',
    codeSystem: 'LOINC',
    code: '39135-9',
    display: '薦骨壓瘡傷口評估 (第 3 期)',
    valueSummary: '面積 4.2 × 3.5 cm · 深度 0.8 cm · 滲液中量漿液性 · 疼痛 4/10 分',
    status: 'final',
    alertLevel: 'warning',
    rawFhirJson: {
      resourceType: 'Observation',
      id: 'obs-wound-101',
      meta: {
        profile: ['https://fhir.micro-ig.tw/StructureDefinition/HomeWoundObservation'],
      },
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }] }],
      code: {
        coding: [
          { system: 'http://loinc.org', code: '39135-9', display: 'Wound assessment panel' },
          { system: 'http://snomed.info/sct', code: '421076008', display: 'Pressure ulcer of sacral region' },
        ],
      },
      subject: { reference: 'Patient/pat-001', display: '林陳阿妹' },
      effectiveDateTime: '2026-11-17T09:15:00+08:00',
      performer: [{ display: '居家護理師 (Nurse A)' }],
      component: [
        { code: { coding: [{ system: 'http://loinc.org', code: '39125-0', display: 'Length of Wound' }] }, valueQuantity: { value: 4.2, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '39126-8', display: 'Width of Wound' }] }, valueQuantity: { value: 3.5, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '39127-6', display: 'Depth of Wound' }] }, valueQuantity: { value: 0.8, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '72514-3', display: 'Pain severity - 0-10 verbal numeric rating' }] }, valueInteger: 4 },
      ],
    },
  },
  {
    id: 'cond-dm-102',
    resourceType: 'Condition',
    patientId: 'pat-001',
    patientName: '林陳阿妹 (78歲 · 居家照護)',
    sourceAppId: 'app-doctor-tracker',
    sourceAppName: '共病與傷口癒合病情追蹤 (醫師 B)',
    authorRole: '家庭醫學科主治醫師 (Doctor B)',
    createdAt: '2026-11-17 10:05',
    codeSystem: 'SNOMED-CT',
    code: '44054006',
    display: '第二型糖尿病合併周邊微血管病變',
    valueSummary: 'HbA1c 7.8% · 建議調整居家敷料換藥頻率並持續監測餐後血糖',
    status: 'active',
    alertLevel: 'warning',
    rawFhirJson: {
      resourceType: 'Condition',
      id: 'cond-dm-102',
      meta: {
        profile: ['https://fhir.micro-ig.tw/StructureDefinition/ChronicProblemCondition'],
      },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: 'Type 2 diabetes mellitus' }],
      },
      subject: { reference: 'Patient/pat-001', display: '林陳阿妹' },
      recordedDate: '2026-11-17T10:05:00+08:00',
      note: [{ text: '參考護理師 A 上傳之薦骨傷口 FHIR Observation (obs-wound-101)，因血糖偏高影響組織肉芽生長，請維持高蛋白飲食。' }],
    },
  },
  {
    id: 'obs-vitals-103',
    resourceType: 'Observation',
    patientId: 'pat-001',
    patientName: '林陳阿妹 (78歲 · 居家照護)',
    sourceAppId: 'app-patient-self',
    sourceAppName: '個人居家健康自主管理 (病人 C / 家屬)',
    authorRole: '病人家屬 (Patient C)',
    createdAt: '2026-11-17 12:30',
    codeSystem: 'LOINC',
    code: '85354-9',
    display: '居家血壓與餐後血糖自我監測',
    valueSummary: '收縮壓 136 / 舒張壓 82 mmHg · 午餐後血糖 168 mg/dL · 體溫 36.7 °C',
    status: 'final',
    alertLevel: 'normal',
    rawFhirJson: {
      resourceType: 'Observation',
      id: 'obs-vitals-103',
      meta: {
        profile: ['https://fhir.micro-ig.tw/StructureDefinition/PatientHomeVitalSigns'],
      },
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }],
      },
      subject: { reference: 'Patient/pat-001', display: '林陳阿妹' },
      effectiveDateTime: '2026-11-17T12:30:00+08:00',
      component: [
        { code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: 136, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: 82, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '1521-4', display: 'Glucose [Mass/volume] in Serum or Plasma --post meal' }] }, valueQuantity: { value: 168, unit: 'mg/dL', system: 'http://unitsofmeasure.org', code: 'mg/dL' } },
      ],
    },
  },
  {
    id: 'careplan-home-104',
    resourceType: 'CarePlan',
    patientId: 'pat-001',
    patientName: '林陳阿妹 (78歲 · 居家照護)',
    sourceAppId: 'app-agency-care',
    sourceAppName: '跨專業居家照護管理系統 (照護機構 D)',
    authorRole: '居服督導員 (Care Agency D)',
    createdAt: '2026-11-17 14:20',
    codeSystem: 'SNOMED-CT',
    code: '719091000000102',
    display: '整合型居家壓瘡翻身與營養照護計畫',
    valueSummary: '每 2 小時協助翻身減壓 · 每日補充乳清蛋白 30g · 下次居家護理訪視 11/20',
    status: 'active',
    alertLevel: 'normal',
    rawFhirJson: {
      resourceType: 'CarePlan',
      id: 'careplan-home-104',
      meta: {
        profile: ['https://fhir.micro-ig.tw/StructureDefinition/IntegratedHomeCarePlan'],
      },
      status: 'active',
      intent: 'plan',
      title: '整合型居家壓瘡翻身與營養照護計畫',
      subject: { reference: 'Patient/pat-001', display: '林陳阿妹' },
      period: { start: '2026-11-17', end: '2026-12-17' },
      addresses: [{ reference: 'Condition/cond-dm-102' }],
      supportingInfo: [{ reference: 'Observation/obs-wound-101' }, { reference: 'Observation/obs-vitals-103' }],
    },
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. Get all shared FHIR records from the common platform repository
  app.get('/api/fhir/records', (_req, res) => {
    res.json({ records: sharedFhirRepository });
  });

  // 2. Post a new clinical record from ANY personalized app into the shared FHIR R4 Server
  app.post('/api/fhir/records', (req, res) => {
    try {
      const {
        resourceType,
        patientId,
        patientName,
        sourceAppId,
        sourceAppName,
        authorRole,
        codeSystem,
        code,
        display,
        valueSummary,
        alertLevel,
        rawFhirJson,
      } = req.body;

      const now = new Date();
      const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newRecord: SharedFhirRecord = {
        id: `fhir-${Date.now().toString(36)}`,
        resourceType: resourceType || 'Observation',
        patientId: patientId || 'pat-001',
        patientName: patientName || '林陳阿妹 (78歲 · 居家照護)',
        sourceAppId: sourceAppId || 'custom-app',
        sourceAppName: sourceAppName || '自訂臨床微應用',
        authorRole: authorRole || '場景建構者',
        createdAt: formattedTime,
        codeSystem: codeSystem || 'LOINC',
        code: code || '39135-9',
        display: display || '臨床評估紀錄',
        valueSummary: valueSummary || '已完成標準化紀錄寫入',
        status: 'final',
        alertLevel: alertLevel || 'normal',
        rawFhirJson: rawFhirJson || {
          resourceType: resourceType || 'Observation',
          id: `fhir-${Date.now().toString(36)}`,
          status: 'final',
          effectiveDateTime: now.toISOString(),
        },
      };

      sharedFhirRepository.unshift(newRecord);
      res.json({ record: newRecord, totalCount: sharedFhirRepository.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : '寫入 FHIR 資料伺服器時發生錯誤';
      res.status(500).json({ error: message });
    }
  });

  // 3. AI Application Factory: Generate or Iteratively Refine a Personalized FHIR Micro-IG Application
  app.post('/api/factory/generate-app', async (req, res) => {
    try {
      const {
        roleName,
        scenarioProblem,
        dataRequirements,
        workflowPreference,
        refinementInstruction,
        currentAppSpec,
      } = req.body;

      const ai = getGenAI();

      const prompt = refinementInstruction && currentAppSpec
        ? `你現在是「基於 FHIR Micro-IG 之應用系統自助式生產體系 (AI Application Factory)」的核心架構師與 AI 協作代理。
目前使用者正在測試與迭代修改他們的個人化醫療照護微應用。
【既有應用規格 JSON】：
${JSON.stringify(currentAppSpec, null, 2)}

【使用者的即時協作修改指令】：
「${refinementInstruction}」

請根據使用者的修改要求，更新這個個人化應用與對應的 FHIR Micro-IG 規格：
1. 確保「基礎標準化、應用個別化、資料互通化、治理共同化」四大原則。
2. 在 microIgElements 與 formFields 中新增或調整對應的資料欄位，並綁定真實合理的 FHIR R4 Resource 路徑（例如 Observation.component、Condition、CarePlan、QuestionnaireResponse、MedicationStatement、DiagnosticReport 等）以及國際標準代碼（LOINC 或 SNOMED-CT）。
3. 更新 workflowSteps、rbacPermissions 與 governanceChecks，並記錄本次 AI 協作演進摘要（evolutionLog）。
4. 全部文字說明請使用繁體中文（台灣醫療資訊慣用術語）。`
        : `你現在是「基於 FHIR Micro-IG 之應用系統自助式生產體系 (AI Application Factory)」的核心架構師與 AI 協作代理。
傳統軟體開發模式中，少數工程師服務大量不同需求的使用者（如同一個媳婦、十個公婆）；現在我們讓場景使用者直接描述需求，在共用平台與 FHIR Micro-IG 標準上建構專屬應用。

請根據以下使用者描述的場景需求，自動設計並產生完整的「個人化應用 + FHIR Micro-IG 規格 + 互動式臨床表單 + 資安與互通性治理檢核」：
- 使用者角色與身分：${roleName || '臨床專科護理師'}
- 要解決什麼問題與目標：${scenarioProblem || '建立居家傷口照護與感染風險追蹤紀錄'}
- 需要輸入及查詢哪些資料：${dataRequirements || '傷口長寬深、滲液性質、周邊皮膚紅腫、疼痛指數、敷料種類'}
- 希望如何呈現與工作流程：${workflowPreference || '結構化快速輸入表單、異常指標警示、自動轉成 FHIR Observation 與主治醫師及居服機構共享'}

設計要求：
1. 挑選此場景所需的共用 FHIR 模組（從 Patient, Problem, Observation, CarePlan, Questionnaire, Medication, DiagnosticReport 中選擇）。
2. 定義明確的 FHIR Micro-IG 資料欄位（含 FHIR Path、資料型態、基數 Cardinality 如 1..1 或 0..1、LOINC / SNOMED-CT 標準代碼與顯示名稱）。
3. 產生 5 到 7 個可直接互動輸入的臨床表單欄位（formFields），型態限定為 'number' | 'select' | 'text' | 'scale'，並提供預設測試值（defaultValue）讓使用者能立刻以模擬病人進行測試。
4. 產生 4 個工作流程步驟（workflowSteps）與 4 項共同治理檢核結果（governanceChecks：涵蓋基礎標準化、應用個別化、資料互通化、治理共同化）。
5. 全部文字請使用繁體中文（台灣醫療照護與醫學資訊慣用術語）。`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appTitle: { type: Type.STRING, description: '個人化應用系統名稱' },
              rolePersona: { type: Type.STRING, description: '建構者角色名稱與職稱' },
              versionTag: { type: Type.STRING, description: '版本號，例如 v1.1.0-micro-ig' },
              problemStatement: { type: Type.STRING, description: '解決的核心臨床或照護問題摘要' },
              profileUrl: { type: Type.STRING, description: 'FHIR Micro-IG Canonical URL' },
              primaryResourceType: {
                type: Type.STRING,
                description: '主要產出的 FHIR Resource 型別 (Observation, Condition, CarePlan, QuestionnaireResponse, MedicationStatement, DiagnosticReport)',
              },
              primaryCodeSystem: { type: Type.STRING, description: '主要國際標準代碼系統，如 LOINC 或 SNOMED-CT' },
              primaryCode: { type: Type.STRING, description: '主要代碼，例如 39135-9' },
              primaryDisplay: { type: Type.STRING, description: '主要代碼臨床名稱' },
              selectedModules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '使用的共用模組清單，如 Patient, Observation, CarePlan 等',
              },
              microIgElements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    elementId: { type: Type.STRING },
                    fhirPath: { type: Type.STRING },
                    label: { type: Type.STRING },
                    dataType: { type: Type.STRING },
                    cardinality: { type: Type.STRING },
                    terminologySystem: { type: Type.STRING },
                    terminologyCode: { type: Type.STRING },
                    clinicalRule: { type: Type.STRING },
                  },
                  required: ['elementId', 'fhirPath', 'label', 'dataType', 'cardinality', 'terminologySystem', 'terminologyCode', 'clinicalRule'],
                },
              },
              formFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fieldKey: { type: Type.STRING },
                    label: { type: Type.STRING },
                    inputType: { type: Type.STRING, description: 'number, select, text, or scale' },
                    unit: { type: Type.STRING },
                    defaultValue: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    fhirPath: { type: Type.STRING },
                    loincOrSnomedCode: { type: Type.STRING },
                    warningThresholdHint: { type: Type.STRING },
                  },
                  required: ['fieldKey', 'label', 'inputType', 'unit', 'defaultValue', 'options', 'fhirPath', 'loincOrSnomedCode', 'warningThresholdHint'],
                },
              },
              workflowSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.STRING },
                    title: { type: Type.STRING },
                    actor: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['stepNumber', 'title', 'actor', 'description'],
                },
              },
              governanceChecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pillar: { type: Type.STRING, description: '基礎標準化 / 應用個別化 / 資料互通化 / 治理共同化' },
                    checkItem: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'passed 或 warning' },
                    detail: { type: Type.STRING },
                  },
                  required: ['pillar', 'checkItem', 'status', 'detail'],
                },
              },
              evolutionNote: {
                type: Type.STRING,
                description: 'AI Agent 建構或修改此應用的架構說明與互通性保障摘要',
              },
            },
            required: [
              'appTitle',
              'rolePersona',
              'versionTag',
              'problemStatement',
              'profileUrl',
              'primaryResourceType',
              'primaryCodeSystem',
              'primaryCode',
              'primaryDisplay',
              'selectedModules',
              'microIgElements',
              'formFields',
              'workflowSteps',
              'governanceChecks',
              'evolutionNote',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({ spec: parsed });
    } catch (error) {
      console.error('Gemini API Error:', error);
      const message = error instanceof Error ? error.message : 'AI 應用工廠生成失敗';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FHIR Micro-IG Application Factory Server running on http://localhost:${PORT}`);
  });
}

startServer();
