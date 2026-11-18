/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  Send,
  Plus,
  Search,
  Sliders,
  BookOpen,
  GitBranch,
  Activity,
  UserCheck,
  Code2,
} from 'lucide-react';
import {
  PRESET_APPLICATIONS,
  REUSABLE_FHIR_MODULES,
  SIMULATED_PATIENTS,
  ECOSYSTEM_ROLES,
  GLOBAL_STUDENT_TRACKS,
  PersonalizedAppSpec,
} from './data/factoryPresets';

interface SharedFhirRecord {
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

type WorkspaceSection = 'architecture' | 'factory' | 'interoperability' | 'ecosystem';
type FactorySubTab = 'live-app' | 'micro-ig' | 'governance';

const QUICK_AI_REFINEMENTS = [
  '增加「傷口周邊皮膚浸潤與紅腫範圍 (LOINC 39112-8)」欄位，並於紅腫擴大時觸發感染警示',
  '新增「居家換藥前止痛藥服用確認」欄位，並於疼痛指數 >= 6 分時自動提醒醫師 B 調整止痛處置',
  '加入「家屬照護技能自我信心評分 (0-10分)」欄位，低於 5 分時通知居服機構 D 加強到宅指導',
];

export default function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('architecture');
  const [paradigmMode, setParadigmMode] = useState<'ai-factory' | 'traditional'>('ai-factory');
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(3);

  // Applications list (includes the 4 canonical presets + any user-generated custom apps)
  const [apps, setApps] = useState<PersonalizedAppSpec[]>(PRESET_APPLICATIONS);
  const [activeAppId, setActiveAppId] = useState<string>(PRESET_APPLICATIONS[0].id);
  const [factorySubTab, setFactorySubTab] = useState<FactorySubTab>('live-app');

  // Simulated Patient & Form State inside the Factory Live App Preview
  const [selectedPatientId, setSelectedPatientId] = useState<string>(SIMULATED_PATIENTS[0].id);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState<boolean>(false);

  // AI Collaborative Refinement & Custom App Builder State
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('呼吸治療師 / 居家喘症照護師');
  const [newScenarioProblem, setNewScenarioProblem] = useState<string>(
    '針對慢性阻塞性肺病 (COPD) 居家使用氧氣製造機之長輩，建立血氧飽和度、呼吸困難評分與痰液性質追蹤表單'
  );
  const [newDataRequirements, setNewDataRequirements] = useState<string>(
    '血氧濃度 SpO2 (%)、氧氣流量 (L/min)、mMRC 呼吸困難分級、痰液顏色與量、吸入型支氣管擴張劑使用紀錄'
  );
  const [newWorkflowPreference, setNewWorkflowPreference] = useState<string>(
    '快速點選輸入，當 SpO2 < 90% 時立即標記紅燈警示，並同步寫入 FHIR Observation 供胸腔科醫師與居服員查閱'
  );
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessBanner, setAiSuccessBanner] = useState<string | null>(null);

  // Shared FHIR Repository Records
  const [fhirRecords, setFhirRecords] = useState<SharedFhirRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [recordResourceFilter, setRecordResourceFilter] = useState<string>('ALL');
  const [recordSearchQuery, setRecordSearchQuery] = useState<string>('');

  const activeApp = useMemo(
    () => apps.find((a) => a.id === activeAppId) || apps[0],
    [apps, activeAppId]
  );

  const selectedPatient = useMemo(
    () => SIMULATED_PATIENTS.find((p) => p.id === selectedPatientId) || SIMULATED_PATIENTS[0],
    [selectedPatientId]
  );

  // Sync form values when activeApp changes
  useEffect(() => {
    const initial: Record<string, string> = {};
    activeApp.formFields.forEach((field) => {
      initial[field.fieldKey] = field.defaultValue;
    });
    setFormValues(initial);
    setSubmissionStatus(null);
  }, [activeApp]);

  // Fetch shared FHIR records on mount
  const fetchFhirRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch('/api/fhir/records');
      if (res.ok) {
        const data = await res.json();
        setFhirRecords(data.records || []);
        if (data.records?.length > 0 && !selectedRecordId) {
          setSelectedRecordId(data.records[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load FHIR records:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchFhirRecords();
  }, []);

  // Build live FHIR R4 JSON preview from current form inputs
  const liveGeneratedFhirJson = useMemo(() => {
    const components = activeApp.formFields.map((field) => {
      const rawVal = formValues[field.fieldKey] ?? field.defaultValue;
      const numVal = Number(rawVal);
      const isNumeric = (field.inputType === 'number' || field.inputType === 'scale') && !Number.isNaN(numVal);

      return {
        fhirPath: field.fhirPath,
        code: {
          coding: [
            {
              system: field.loincOrSnomedCode.startsWith('SNOMED')
                ? 'http://snomed.info/sct'
                : 'http://loinc.org',
              code: field.loincOrSnomedCode.replace(/^(LOINC|SNOMED)\s+/i, ''),
              display: field.label,
            },
          ],
        },
        ...(isNumeric
          ? {
              valueQuantity: {
                value: numVal,
                unit: field.unit || 'score',
                system: 'http://unitsofmeasure.org',
              },
            }
          : {
              valueString: rawVal,
            }),
      };
    });

    return {
      resourceType: activeApp.primaryResourceType,
      meta: {
        profile: [activeApp.profileUrl],
        versionId: activeApp.versionTag,
      },
      status: activeApp.primaryResourceType === 'Condition' || activeApp.primaryResourceType === 'CarePlan' ? 'active' : 'final',
      code: {
        coding: [
          {
            system: activeApp.primaryCodeSystem === 'SNOMED-CT' ? 'http://snomed.info/sct' : 'http://loinc.org',
            code: activeApp.primaryCode,
            display: activeApp.primaryDisplay,
          },
        ],
      },
      subject: {
        reference: `Patient/${selectedPatient.id}`,
        display: selectedPatient.name,
      },
      performer: [
        {
          display: activeApp.rolePersona,
        },
      ],
      effectiveDateTime: new Date().toISOString(),
      component: components,
    };
  }, [activeApp, formValues, selectedPatient]);

  // Submit clinical form to shared FHIR Server
  const handleSaveToFhirServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRecord(true);
    setSubmissionStatus(null);

    try {
      const summaryParts = activeApp.formFields.slice(0, 4).map((f) => {
        const val = formValues[f.fieldKey] ?? f.defaultValue;
        return `${f.label}: ${val}${f.unit ? ` ${f.unit}` : ''}`;
      });

      const hasWarningValue = Object.values(formValues).some(
        (v) =>
          v.includes('膿性') ||
          v.includes('惡化') ||
          v.includes('滲濕') ||
          v.includes('汙染') ||
          Number(v) >= 7
      );

      const res = await fetch('/api/fhir/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: activeApp.primaryResourceType,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          sourceAppId: activeApp.id,
          sourceAppName: activeApp.appTitle,
          authorRole: activeApp.rolePersona,
          codeSystem: activeApp.primaryCodeSystem,
          code: activeApp.primaryCode,
          display: activeApp.primaryDisplay,
          valueSummary: summaryParts.join(' · '),
          alertLevel: hasWarningValue ? 'warning' : 'normal',
          rawFhirJson: liveGeneratedFhirJson,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '寫入失敗');
      }

      const data = await res.json();
      await fetchFhirRecords();
      if (data.record?.id) {
        setSelectedRecordId(data.record.id);
      }
      setSubmissionStatus(
        `已成功依 ${activeApp.profileUrl} 規格寫入共用 FHIR Server（資源 ID: ${data.record.id}）。其他角色的專屬應用現可即時調閱此筆結構化資料！`
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '寫入共用 FHIR Server 失敗');
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // Call Gemini AI to refine the current personalized app
  const handleAiRefinement = async (instructionText?: string) => {
    const instruction = (instructionText ?? refinementInput).trim();
    if (!instruction) return;

    setIsGeneratingAi(true);
    setAiError(null);
    setAiSuccessBanner(null);

    try {
      const res = await fetch('/api/factory/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refinementInstruction: instruction,
          currentAppSpec: activeApp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.spec) {
        throw new Error(data.error || 'AI 協作調整失敗');
      }

      const updatedSpec: PersonalizedAppSpec = {
        ...data.spec,
        id: activeApp.id,
        shortLabel: activeApp.shortLabel,
      };

      setApps((prev) => prev.map((a) => (a.id === activeApp.id ? updatedSpec : a)));
      setRefinementInput('');
      setAiSuccessBanner(`AI Agent 已依據您的指令完成「${updatedSpec.appTitle}」與 FHIR Micro-IG 規格更新！`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 協作請求失敗');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Call Gemini AI to build a brand-new personalized app from scratch
  const handleBuildNewCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAi(true);
    setAiError(null);
    setAiSuccessBanner(null);

    try {
      const res = await fetch('/api/factory/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: newRoleName,
          scenarioProblem: newScenarioProblem,
          dataRequirements: newDataRequirements,
          workflowPreference: newWorkflowPreference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.spec) {
        throw new Error(data.error || 'AI 生成新應用失敗');
      }

      const newId = `app-custom-${Date.now().toString(36)}`;
      const createdApp: PersonalizedAppSpec = {
        ...data.spec,
        id: newId,
        shortLabel: `${newRoleName.split('/')[0].trim()} · 專屬應用`,
      };

      setApps((prev) => [...prev, createdApp]);
      setActiveAppId(newId);
      setShowNewAppModal(false);
      setActiveSection('factory');
      setFactorySubTab('live-app');
      setAiSuccessBanner(`AI Application Factory 已為「${createdApp.rolePersona}」建構專屬應用與 FHIR Micro-IG！`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 建構失敗');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredFhirRecords = useMemo(() => {
    return fhirRecords.filter((rec) => {
      const matchesType = recordResourceFilter === 'ALL' || rec.resourceType === recordResourceFilter;
      const q = recordSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        rec.display.toLowerCase().includes(q) ||
        rec.valueSummary.toLowerCase().includes(q) ||
        rec.sourceAppName.toLowerCase().includes(q) ||
        rec.code.toLowerCase().includes(q) ||
        rec.patientName.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [fhirRecords, recordResourceFilter, recordSearchQuery]);

  const activeSelectedRecord = useMemo(
    () => filteredFhirRecords.find((r) => r.id === selectedRecordId) || filteredFhirRecords[0] || null,
    [filteredFhirRecords, selectedRecordId]
  );

  const sectionBreadcrumbs: Record<WorkspaceSection, string> = {
    architecture: '應用生產體系 / 01. 結構困境轉型與三層架構',
    factory: `應用生產體系 / 02. AI 應用生產工廠 / ${activeApp.shortLabel}`,
    interoperability: '應用生產體系 / 03. 四大治理與 FHIR 資料互通驗證',
    ecosystem: '應用生產體系 / 04. 自助生產體系生態系與跨領域分工',
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Left Workspace Sidebar (264px fixed width on desktop) */}
      <aside className="w-full lg:w-[268px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="text-base font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
              FHIR Micro-IG 應用工廠
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              基礎標準化 · 應用個別化 · 資料互通化
            </p>
          </div>

          {/* Primary Workspace Navigation */}
          <nav className="p-3 space-y-1" aria-label="主要工作區導覽">
            <button
              onClick={() => setActiveSection('architecture')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'architecture'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">01. 結構轉型與三層架構</span>
            </button>

            <button
              onClick={() => setActiveSection('factory')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'factory'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span className="truncate">02. AI 應用生產工廠</span>
            </button>

            <button
              onClick={() => setActiveSection('interoperability')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'interoperability'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="truncate">03. 四大治理與互通驗證</span>
            </button>

            <button
              onClick={() => setActiveSection('ecosystem')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'ecosystem'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">04. 生產體系與跨國協作</span>
            </button>
          </nav>

          {/* Direct Role Application Switcher ("十個公婆各自擁有專屬應用") */}
          <div className="px-4 pt-4 pb-2 border-t border-slate-200 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                個別化應用實例 (Micro-Apps)
              </span>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {apps.length} 套
              </span>
            </div>
            <div className="space-y-1">
              {apps.map((appItem) => {
                const isSelected = appItem.id === activeAppId && activeSection === 'factory';
                return (
                  <button
                    key={appItem.id}
                    onClick={() => {
                      setActiveAppId(appItem.id);
                      setActiveSection('factory');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{appItem.shortLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowNewAppModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 rounded-md transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增場景專屬應用</span>
            </button>
          </div>
        </div>

        {/* Shared FHIR Platform Summary Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800">
            共用基礎平台狀態
          </div>
          <div className="flex items-center justify-between">
            <span>共用 FHIR 模組數</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {REUSABLE_FHIR_MODULES.length} 組
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>互通臨床紀錄筆數</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {fhirRecords.length} 筆
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
            治理原則：基礎標準化 · 治理共同化
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb trail on left, 1 primary action button on right */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
          <div className="text-sm font-medium text-slate-700 truncate">
            {sectionBreadcrumbs[activeSection]}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowNewAppModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>AI 建構專屬應用</span>
            </button>
          </div>
        </header>

        {/* Global Notification Banners for AI Feedback */}
        {aiError && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={() => setAiError(null)}
              className="px-2.5 py-1 font-medium text-red-800 hover:bg-red-100 rounded whitespace-nowrap"
            >
              關閉
            </button>
          </div>
        )}

        {aiSuccessBanner && (
          <div className="mx-6 mt-4 p-3.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between gap-4 text-xs text-teal-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{aiSuccessBanner}</span>
            </div>
            <button
              onClick={() => setAiSuccessBanner(null)}
              className="px-2.5 py-1 font-medium text-teal-800 hover:bg-teal-100 rounded whitespace-nowrap"
            >
              了解
            </button>
          </div>
        )}

        {/* Main Viewport Container */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-8">
          {/* =====================================================================
              SECTION 01: 結構轉型與三層架構 (PARADIGM SHIFT & 3-TIER ARCHITECTURE)
             ===================================================================== */}
          {activeSection === 'architecture' && (
            <div className="space-y-8">
              {/* Hero Explanation & Paradigm Switcher */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                  <div className="space-y-2 max-w-3xl">
                    <div className="text-xs font-medium text-teal-800">
                      結構性困境解方 · 編號 261119 藍圖實踐
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-display">
                      從「一個媳婦、十個公婆」轉變為「基於 FHIR Micro-IG 之自助式生產體系」
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      傳統應用系統由少數開發人員維護單一系統，面對分散且持續變動的使用者需求，必然陷入排程瓶頸與系統臃腫。AI 時代的核心突破，是讓十個公婆各自有能力在「共用基礎平台」與「FHIR Micro-IG 資料標準」上，與 AI 協作建構適合自己的專屬應用。
                    </p>
                  </div>

                  {/* Interactive Mode Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start">
                    <button
                      onClick={() => setParadigmMode('traditional')}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        paradigmMode === 'traditional'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      傳統模式：單一系統瓶頸
                    </button>
                    <button
                      onClick={() => setParadigmMode('ai-factory')}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        paradigmMode === 'ai-factory'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AI 時代：共用基礎 · 個別建構
                    </button>
                  </div>
                </div>

                {/* Interactive Architecture Comparison Diagram */}
                {paradigmMode === 'traditional' ? (
                  <div className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                      {/* Column 1: Diverse Users */}
                      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3">
                        <div className="text-xs font-semibold text-slate-500">
                          大量不同需求的使用者（十個公婆）
                        </div>
                        <div className="space-y-2 text-xs text-slate-700">
                          <div className="p-2.5 bg-white border border-slate-200 rounded">
                            <span className="font-semibold text-slate-900">護理師 A：</span>
                            需要居家傷口長寬深與滲液快選表單
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded">
                            <span className="font-semibold text-slate-900">醫師 B：</span>
                            需要跨科共病、HbA1c 與傷口癒合趨勢對照
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded">
                            <span className="font-semibold text-slate-900">病人 C：</span>
                            需要大字體、白話文的居家血壓與紗布回報
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded">
                            <span className="font-semibold text-slate-900">照護機構 D：</span>
                            需要居服員每 2 小時翻身與備餐打卡清單
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Bottleneck */}
                      <div className="border border-amber-300 bg-amber-50/60 rounded-lg p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-900">
                            集中式開發瓶頸（一個媳婦）
                          </span>
                          <span className="text-xs font-mono text-amber-800 tabular-nums">
                            排程等待 &gt; 6 個月
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          少數系統開發人員 + 單一僵化應用系統
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          開發團隊掌握所有程式碼、資料庫與修改權；必須判斷哪些需求值得做、哪些不能做。為了滿足 A 使用者修改畫面，常破壞 B 使用者的既有流程。
                        </p>
                        <div className="pt-2 border-t border-amber-200/80 text-xs text-amber-950 space-y-1">
                          <div>· 固定功能、固定流程、共同耦合資料表</div>
                          <div>· 系統逐漸疊床架屋，變得複雜難以維護</div>
                          <div>· 使用者依然不滿意，資訊人員疲於奔命</div>
                        </div>
                      </div>

                      {/* Column 3: Structural Outcome */}
                      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-4">
                        <div className="text-xs font-semibold text-slate-500">
                          傳統模式結構性後果
                        </div>
                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">1. 需求傳遞失真</div>
                            <p className="text-slate-600 mt-0.5">
                              第一線護理師與工程師語言不通，反覆開會確認仍做出不合手的操作介面。
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">2. 畫面妥協與欄位爆炸</div>
                            <p className="text-slate-600 mt-0.5">
                              單一畫面塞入所有角色的欄位，居家訪視手機難以操作。
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">3. 創新停滯</div>
                            <p className="text-slate-600 mt-0.5">
                              80% 資源消耗在既有系統修補，無法針對新照護場景快速試驗。
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setParadigmMode('ai-factory')}
                          className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-md transition-colors"
                        >
                          切換檢視 AI 時代自助式生產體系 →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 space-y-6">
                    {/* Top Shared Platform Bar */}
                    <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-teal-300 font-medium">
                          第一層與第二層：共同平台及 FHIR Micro-IG 標準基礎
                        </div>
                        <div className="text-sm font-bold mt-0.5">
                          身分驗證 (OAuth/RBAC) · FHIR R4 資料管理 · 標準 API · 資安稽核 · 7 大可重用臨床模組
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection('interoperability')}
                        className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition-colors whitespace-nowrap self-start md:self-auto"
                      >
                        檢視共用 FHIR 資料伺服器 →
                      </button>
                    </div>

                    {/* 4 Individualized Role Applications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {apps.slice(0, 4).map((roleApp, idx) => (
                        <div
                          key={roleApp.id}
                          className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col justify-between hover:border-teal-600 transition-colors"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-mono tabular-nums">0{idx + 1}. 專屬應用</span>
                              <span>AI 協作建構</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {roleApp.shortLabel}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {roleApp.problemStatement}
                            </p>
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                              <div>
                                <span className="font-medium text-slate-700">核心資源：</span>
                                <span className="font-mono">{roleApp.primaryResourceType}</span>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">標準編碼：</span>
                                <span className="font-mono">
                                  {roleApp.primaryCodeSystem} {roleApp.primaryCode}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setActiveAppId(roleApp.id);
                              setActiveSection('factory');
                            }}
                            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <span>進入此角色應用與測試</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Shared Interoperability Banner */}
                    <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-teal-950">
                      <div className="space-y-0.5">
                        <div className="font-bold">
                          共用基礎、個別建構、各自演進 — 資料仍然 100% 互通
                        </div>
                        <p className="text-teal-800">
                          護理師 A 輸入的傷口紀錄、醫師 B 的共病醫囑、病人 C 的居家血糖與機構 D 的翻身計畫，皆轉換為標準 FHIR R4 資源並即時共享。
                        </p>
                      </div>
                      <span className="font-mono text-xs text-teal-900 shrink-0 tabular-nums">
                        FHIR R4 RESTful API
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* Three-Tier Application Architecture Interactive Explorer */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      重新劃分應用系統的三個層次
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      將「不應反覆修改的底層基礎」、「跨機構共用的標準臨床模組」與「AI 賦能的個人化應用」明確解耦。
                    </p>
                  </div>

                  {/* Tier Selector Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                    <button
                      onClick={() => setSelectedTier(1)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        selectedTier === 1
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      第 1 層：共用基礎設施
                    </button>
                    <button
                      onClick={() => setSelectedTier(2)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        selectedTier === 2
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      第 2 層：可重用 FHIR 模組
                    </button>
                    <button
                      onClick={() => setSelectedTier(3)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        selectedTier === 3
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      第 3 層：個人化應用
                    </button>
                  </div>
                </div>

                {/* Tier 1 Content */}
                {selectedTier === 1 && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      由專業平台與資安工程團隊負責，避免每個使用者重複開發，且不因個別使用者介面需求變動而反覆修改：
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: '01. 身分驗證及細粒度授權',
                          desc: '整合 OAuth 2.0、OIDC 與 SMART on FHIR 角色權限控管 (RBAC)，確保醫護、病患與居服員各司其職。',
                        },
                        {
                          title: '02. 多模態資料儲存及存取',
                          desc: '結合結構化 FHIR R4 資料庫與多模態醫療影像/音訊儲存伺服器 (Media / DocumentReference)。',
                        },
                        {
                          title: '03. 標準化 API 與資料交換',
                          desc: '提供統一 FHIR RESTful CRUD 與搜尋端點，支援跨院所、跨居家照護機構安全資料調閱。',
                        },
                        {
                          title: '04. 資安防護、稽核及備份',
                          desc: '自動記錄 FHIR AuditEvent 與 Provenance 資料溯源簽章，符合醫療資安與個資法規。',
                        },
                        {
                          title: '05. 標準化資料格式檢核',
                          desc: '內建 FHIR Profile Schema Validator 與 LOINC / SNOMED-CT 標準術語伺服器檢核。',
                        },
                        {
                          title: '06. 系統部署與版本管理',
                          desc: '提供容器化沙箱、微應用版本快照與一鍵回滾機制，確保個人化應用穩定運行。',
                        },
                      ].map((item) => (
                        <div key={item.title} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier 2 Content: 7 Reusable FHIR Modules */}
                {selectedTier === 2 && (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-600">
                      將醫療照護常用功能拆解為標準化可重複使用模組，由跨領域專業人員共同維護共同規格與擴充機制：
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                            <th className="py-3 px-4">FHIR 核心模組</th>
                            <th className="py-3 px-4">模組名稱與臨床功能</th>
                            <th className="py-3 px-4">關鍵結構化欄位 (FHIR Elements)</th>
                            <th className="py-3 px-4">國際標準編碼</th>
                            <th className="py-3 px-4">重用此模組之應用</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {REUSABLE_FHIR_MODULES.map((mod) => (
                            <tr key={mod.moduleId} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-mono font-semibold text-teal-800 whitespace-nowrap">
                                {mod.fhirResource}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{mod.chineseName}</div>
                                <div className="text-slate-500 mt-0.5">{mod.summary}</div>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                                {mod.coreElements}
                              </td>
                              <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                                {mod.standardSystems}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {mod.reusedByApps}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tier 3 Content: Personalized Applications */}
                {selectedTier === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50/50">
                      <div className="text-xs font-semibold text-teal-800">
                        使用者只需以自然語言描述 6 個核心問題
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        從「需求提出者」轉變為「應用建構者」
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 pt-1">
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          1. 我要解決什麼臨床或照護問題？
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          2. 使用者有哪些角色與職責？
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          3. 需要輸入及查詢哪些資料欄位？
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          4. 希望畫面如何呈現與預警？
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          5. 有哪些跨團隊工作流程？
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          6. 需要哪些資料讀寫與隱私權限？
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500">
                          AI Agent 自動生成與組裝產出
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          不必等候中央開發團隊排程，即時擁有專屬應用版本
                        </h3>
                        <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                          <div>· 自動設計符合角色操作習慣之 HTML / JavaScript 互動表單</div>
                          <div>· 自動映射 FHIR Micro-IG 資料規格（Observation、Media、CarePlan 等）</div>
                          <div>· 自動產生查詢統計介面、標準 API 串接與異常指標警示邏輯</div>
                          <div>· 支援以「模擬病人」直接測試，發現問題立即與 AI 對話修改</div>
                        </div>
                      </div>

                      <div className="pt-3 flex items-center gap-3">
                        <button
                          onClick={() => setActiveSection('factory')}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                        >
                          前往 AI 應用生產工廠實測 →
                        </button>
                        <button
                          onClick={() => setShowNewAppModal(true)}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          自訂新場景應用
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =====================================================================
              SECTION 02: AI 應用生產工廠 (SELF-SERVICE AI APPLICATION FACTORY)
             ===================================================================== */}
          {activeSection === 'factory' && (
            <div className="space-y-6">
              {/* Role Application Selector Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>目前檢視之個人化應用</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-teal-800">{activeApp.versionTag}</span>
                    <span aria-hidden="true">·</span>
                    <span>建構者：{activeApp.rolePersona}</span>
                  </div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">
                    {activeApp.appTitle}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl">
                    {activeApp.problemStatement}
                  </p>
                </div>

                {/* Role Switcher Segmented Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {apps.map((appItem) => (
                    <button
                      key={appItem.id}
                      onClick={() => setActiveAppId(appItem.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        appItem.id === activeAppId
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {appItem.shortLabel.split(' · ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7-Step Self-Service Lifecycle Strip (Demonstrating Nurse Wound Care Flow) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-500 mb-3">
                  自助式應用建構與演進流程（使用者從「需求提出者」變成「應用建構者」）
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                  {[
                    { step: '01', label: '描述臨床場景' },
                    { step: '02', label: 'AI 設計表單' },
                    { step: '03', label: '映射 FHIR 規格' },
                    { step: '04', label: '產生前端網頁' },
                    { step: '05', label: '模擬病人測試' },
                    { step: '06', label: '與 AI 協作修改' },
                    { step: '07', label: '資安檢核與上線' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center gap-2"
                    >
                      <span className="font-mono font-bold text-teal-800 tabular-nums">
                        {item.step}
                      </span>
                      <span className="font-medium text-slate-800 truncate">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factory Workspace Sub-Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
                  <button
                    onClick={() => setFactorySubTab('live-app')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      factorySubTab === 'live-app'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>互動應用預覽與模擬病人測試</span>
                  </button>
                  <button
                    onClick={() => setFactorySubTab('micro-ig')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      factorySubTab === 'micro-ig'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>FHIR Micro-IG 規格與結構定義</span>
                  </button>
                  <button
                    onClick={() => setFactorySubTab('governance')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      factorySubTab === 'governance'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>工作流程與四大治理檢核</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  共用模組組合：{activeApp.selectedModules.join(' · ')}
                </div>
              </div>

              {/* SUB-TAB 1: LIVE CLINICAL APP PREVIEW + SIMULATED PATIENT TEST + AI ITERATION */}
              {factorySubTab === 'live-app' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left 7 Columns: Generated Interactive Clinical Form */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                    {/* Simulated Patient Selector */}
                    <div className="pb-4 border-b border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="sim-patient-select"
                          className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                        >
                          <UserCheck className="w-4 h-4 text-teal-700" />
                          <span>選擇模擬測試病人 (Simulated Patient Sandbox)</span>
                        </label>
                        <span className="text-xs font-mono text-slate-500">
                          Patient/{selectedPatient.id}
                        </span>
                      </div>
                      <select
                        id="sim-patient-select"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                      >
                        {SIMULATED_PATIENTS.map((pat) => (
                          <option key={pat.id} value={pat.id}>
                            {pat.name} — {pat.summary}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-slate-500">
                        照護團隊歸屬：{selectedPatient.primaryCareTeam} · 識別碼：{selectedPatient.nhiId}
                      </div>
                    </div>

                    {/* Dynamic Clinical Input Form */}
                    <form onSubmit={handleSaveToFhirServer} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">
                          臨床資料輸入表單（AI 依據 Micro-IG 自動生成）
                        </h2>
                        <span className="text-xs font-mono text-slate-500 tabular-nums">
                          {activeApp.formFields.length} 個標準欄位
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeApp.formFields.map((field) => {
                          const isFullWidth =
                            field.inputType === 'select' ||
                            field.inputType === 'text' ||
                            field.inputType === 'scale';
                          const currentVal = formValues[field.fieldKey] ?? field.defaultValue;

                          return (
                            <div
                              key={field.fieldKey}
                              className={`${isFullWidth ? 'sm:col-span-2' : ''} space-y-1.5`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-semibold text-slate-800">
                                  {field.label}
                                  {field.unit ? ` (${field.unit})` : ''}
                                </label>
                                <span className="text-[11px] font-mono text-slate-500">
                                  {field.loincOrSnomedCode} · {field.fhirPath}
                                </span>
                              </div>

                              {field.inputType === 'select' ? (
                                <select
                                  value={currentVal}
                                  onChange={(e) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      [field.fieldKey]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                                >
                                  {(field.options.length > 0 ? field.options : [field.defaultValue]).map(
                                    (opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    )
                                  )}
                                </select>
                              ) : field.inputType === 'scale' ? (
                                <div className="flex items-center gap-1.5 pt-1">
                                  {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(
                                    (numStr) => {
                                      const active = String(currentVal) === numStr;
                                      const isHigh = Number(numStr) >= 6;
                                      return (
                                        <button
                                          key={numStr}
                                          type="button"
                                          onClick={() =>
                                            setFormValues((prev) => ({
                                              ...prev,
                                              [field.fieldKey]: numStr,
                                            }))
                                          }
                                          className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded border transition-colors tabular-nums ${
                                            active
                                              ? isHigh
                                                ? 'bg-amber-600 text-white border-amber-600'
                                                : 'bg-teal-700 text-white border-teal-700'
                                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {numStr}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <input
                                  type={field.inputType === 'number' ? 'number' : 'text'}
                                  step="any"
                                  value={currentVal}
                                  onChange={(e) =>
                                    setFormValues((prev) => ({
                                      ...prev,
                                      [field.fieldKey]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:border-teal-700"
                                />
                              )}

                              <div className="text-[11px] text-slate-500">
                                臨床檢核提示：{field.warningThresholdHint}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {submissionStatus && (
                        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-2">
                          <div className="font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                            <span>FHIR R4 標準資源已寫入共用平台</span>
                          </div>
                          <p>{submissionStatus}</p>
                          <button
                            type="button"
                            onClick={() => setActiveSection('interoperability')}
                            className="text-xs font-semibold text-teal-800 underline hover:text-teal-950"
                          >
                            前往「03. 四大治理與互通驗證」檢視跨應用同步結果 →
                          </button>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          目標資源：<span className="font-mono text-slate-800">{activeApp.primaryResourceType}</span> · 代碼：<span className="font-mono text-slate-800">{activeApp.primaryCodeSystem} {activeApp.primaryCode}</span>
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingRecord}
                          className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSubmittingRecord
                              ? '轉換 FHIR 並寫入中...'
                              : '寫入共用 FHIR Server 並驗證互通'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right 5 Columns: Live AI Iteration Box + Real-Time FHIR Payload Preview */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* AI Collaborative Iteration Panel ("發現問題後，直接與 AI 修改") */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-teal-800">
                            步驟 06 · 與 AI Agent 協作即時修改應用
                          </span>
                          <span className="text-[11px] text-slate-500">
                            免排隊等資訊室修改
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          測試發現欄位不足或流程需調整？直接告訴 AI
                        </h3>
                        <p className="text-xs text-slate-600">
                          輸入修改需求後，AI 將同步更新表單欄位、LOINC/SNOMED 代碼綁定與 FHIR Micro-IG 規格。
                        </p>
                      </div>

                      {/* Quick One-Click Prompts */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-medium text-slate-500">
                          點擊快速測試臨床迭代指令：
                        </div>
                        {QUICK_AI_REFINEMENTS.map((samplePrompt) => (
                          <button
                            key={samplePrompt}
                            type="button"
                            disabled={isGeneratingAi}
                            onClick={() => handleAiRefinement(samplePrompt)}
                            className="w-full text-left p-2 text-xs text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-md transition-colors"
                          >
                            「{samplePrompt}」
                          </button>
                        ))}
                      </div>

                      {/* Custom Instruction Input */}
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={refinementInput}
                          onChange={(e) => setRefinementInput(e.target.value)}
                          placeholder="例如：增加傷口氣味評估欄位，並加上細菌培養採檢日期..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                        />
                        <button
                          type="button"
                          disabled={isGeneratingAi || !refinementInput.trim()}
                          onClick={() => handleAiRefinement()}
                          className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {isGeneratingAi ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>AI 正在重構 Micro-IG 與表單組件...</span>
                            </>
                          ) : (
                            <>
                              <Sliders className="w-3.5 h-3.5" />
                              <span>執行 AI 即時修改應用</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">最近期演進紀錄：</span>
                        {activeApp.evolutionNote}
                      </div>
                    </div>

                    {/* Live FHIR R4 JSON Resource Preview */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-teal-700" />
                          <h3 className="text-sm font-bold text-slate-900">
                            即時轉換之 FHIR R4 標準資源預覽
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          application/fhir+json
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        左方個別化表單輸入的任何數值，皆在底層自動轉換為符合 <span className="font-mono text-slate-700">{activeApp.profileUrl}</span> 的標準結構：
                      </p>
                      <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[300px] leading-relaxed">
                        {JSON.stringify(liveGeneratedFhirJson, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: FHIR MICRO-IG SPECIFICATION TABLE */}
              {factorySubTab === 'micro-ig' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <div className="text-xs font-mono text-teal-800">
                        Canonical URL: {activeApp.profileUrl}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        FHIR Micro-IG 場景資料規格定義表 (StructureDefinition)
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        由熟悉臨床場景的醫護人員定義需求，AI 自動協助轉換為明確的 FHIR 資料欄位、基數與國際標準代碼。
                      </p>
                    </div>
                    <div className="text-xs font-mono text-slate-600 shrink-0 tabular-nums">
                      基準資源：{activeApp.primaryResourceType} ({activeApp.primaryCodeSystem} {activeApp.primaryCode})
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">临床欄位名稱</th>
                          <th className="py-3 px-4">FHIR R4 路徑 (Path)</th>
                          <th className="py-3 px-4">資料型態</th>
                          <th className="py-3 px-4">基數 (Card.)</th>
                          <th className="py-3 px-4">國際標準術語綁定</th>
                          <th className="py-3 px-4">場景驗證規則與臨床邏輯</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {activeApp.microIgElements.map((el) => (
                          <tr key={el.elementId} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {el.label}
                            </td>
                            <td className="py-3 px-4 font-mono text-teal-800">
                              {el.fhirPath}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {el.dataType}
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums text-slate-900 font-semibold">
                              {el.cardinality}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {el.terminologySystem} · {el.terminologyCode}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {el.clinicalRule}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: WORKFLOW & 4-PILLAR GOVERNANCE REPORT */}
              {factorySubTab === 'governance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clinical Workflow Steps */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        跨角色臨床工作流程 (Workflow Orchestration)
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        此個人化應用如何與共用 FHIR Server 及其他照護角色的專屬應用協同運作：
                      </p>
                    </div>
                    <div className="space-y-3">
                      {activeApp.workflowSteps.map((wf) => (
                        <div
                          key={wf.stepNumber}
                          className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-teal-800 tabular-nums">
                              STEP {wf.stepNumber} · {wf.title}
                            </span>
                            <span className="text-slate-500">
                              執行角色：{wf.actor}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {wf.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4-Pillar Governance Verification */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        四大核心治理原則自動化檢核報告
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        避免「每個人用 AI 任意開發造成欄位定義混亂、代碼不一與資安漏洞」：
                      </p>
                    </div>
                    <div className="space-y-3">
                      {activeApp.governanceChecks.map((chk, idx) => (
                        <div
                          key={`${chk.pillar}-${idx}`}
                          className="p-4 border border-slate-200 rounded-lg space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">
                              {chk.pillar} — {chk.checkItem}
                            </span>
                            <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>檢核通過</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {chk.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              SECTION 03: 四大治理與 FHIR 資料互通驗證 (SHARED FHIR REPOSITORY)
             ===================================================================== */}
          {activeSection === 'interoperability' && (
            <div className="space-y-6">
              {/* Top Governance Principle Header */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs font-medium text-teal-800">
                      防止各自開發造成混亂的核心機制
                    </div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display mt-0.5">
                      基礎標準化 · 應用個別化 · 資料互通化 · 治理共同化
                    </h1>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                      雖然護理師 A、醫師 B、病人 C 與照護機構 D 各自使用不同的 AI 生成應用介面，但底層皆遵照 FHIR Micro-IG 寫入同一座「FHIR Server / 多模態資料伺服器」，確保跨系統無縫理解與交換。
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveSection('factory')}
                    className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    返回應用工廠新增測試資料 →
                  </button>
                </div>

                {/* Filter & Search Bar for Shared FHIR Repository */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {['ALL', 'Observation', 'Condition', 'CarePlan'].map((rType) => (
                      <button
                        key={rType}
                        onClick={() => setRecordResourceFilter(rType)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          recordResourceFilter === rType
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {rType === 'ALL' ? '全部 FHIR 資源' : rType}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recordSearchQuery}
                      onChange={(e) => setRecordSearchQuery(e.target.value)}
                      placeholder="搜尋病人、LOINC 代碼或來源應用..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                    />
                  </div>
                </div>
              </section>

              {/* Master-Detail View of Shared FHIR Server Records */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Columns: FHIR Records Table */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      共用 FHIR Server 即時資料交換儲存庫
                    </h2>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      共 {filteredFhirRecords.length} 筆標準資源
                    </span>
                  </div>

                  {isLoadingRecords ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-14 bg-slate-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : filteredFhirRecords.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="text-sm font-semibold text-slate-800">
                        查無符合篩選條件的 FHIR 資源紀錄
                      </div>
                      <p className="text-xs text-slate-500">
                        請清除搜尋關鍵字，或前往 AI 應用生產工廠新增臨床測試紀錄。
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredFhirRecords.map((rec) => {
                        const isSelected = activeSelectedRecord?.id === rec.id;
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => setSelectedRecordId(rec.id)}
                            className={`w-full text-left p-4 transition-colors block space-y-1.5 ${
                              isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-mono font-semibold text-teal-800">
                                  {rec.resourceType}/{rec.id}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">
                                  {rec.codeSystem} {rec.code}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{rec.patientName}</span>
                              </div>
                              <span className="font-mono tabular-nums shrink-0">
                                {rec.createdAt}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <div className="text-sm font-bold text-slate-900">
                                {rec.display}
                              </div>
                              {rec.alertLevel === 'warning' && (
                                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 shrink-0">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>需跨團隊關注</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-700">
                              {rec.valueSummary}
                            </p>

                            <div className="text-[11px] text-slate-500">
                              寫入來源：{rec.sourceAppName} · 紀錄者：{rec.authorRole}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right 5 Columns: Cross-App Interoperability Inspector & Raw FHIR JSON */}
                <div className="lg:col-span-5 space-y-6">
                  {activeSelectedRecord && (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="border-b border-slate-200 pb-3">
                          <div className="text-xs font-mono text-teal-800">
                            跨應用資料互通解析 · {activeSelectedRecord.resourceType}/{activeSelectedRecord.id}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                            不同角色的專屬應用如何理解並使用此筆共同資料？
                          </h3>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/60">
                            <div className="font-semibold text-slate-900">
                              1. 護理師 A（傷口照護應用）視角：
                            </div>
                            <p className="text-slate-600 mt-0.5">
                              將此筆 <span className="font-mono">{activeSelectedRecord.codeSystem} {activeSelectedRecord.code}</span> 資料自動帶入居家訪視傷口癒合曲線，比對前後次換藥面積與滲液變化。
                            </p>
                          </div>

                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/60">
                            <div className="font-semibold text-slate-900">
                              2. 醫師 B（病情追蹤應用）視角：
                            </div>
                            <p className="text-slate-600 mt-0.5">
                              於巡診面板自動關聯該病患之糖尿病 HbA1c 與用藥紀錄，判斷是否需調整抗生素或敷料醫囑。
                            </p>
                          </div>

                          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/60">
                            <div className="font-semibold text-slate-900">
                              3. 病人 C 與照護機構 D 視角：
                            </div>
                            <p className="text-slate-600 mt-0.5">
                              家屬端轉譯為白話衛教提醒；居服機構 D 自動同步受壓部位與沐浴防水保護重點。
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            FHIR Server 儲存之標準 JSON Payload
                          </h3>
                          <span className="text-xs font-mono text-slate-500">
                            FHIR R4
                          </span>
                        </div>
                        <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[320px] leading-relaxed">
                          {JSON.stringify(activeSelectedRecord.rawFhirJson, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              SECTION 04: 自助生產體系生態系與跨領域分工 (ECOSYSTEM & GLOBAL TEAMS)
             ===================================================================== */}
          {activeSection === 'ecosystem' && (
            <div className="space-y-8">
              {/* 7 Ecosystem Roles Matrix */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-xs font-medium text-teal-800">
                    AI Application Factory（AI 應用生產工廠）生態系
                  </div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display mt-0.5">
                    七大生態系角色分工：不再由少數工程師服務所有使用者
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    未來不必由一家軟體公司開發一套大型系統銷售給幾千個使用者，而是建立分工合作的自助式應用生產平台：
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">生態系角色</th>
                        <th className="py-3 px-4">核心工作職責</th>
                        <th className="py-3 px-4">傳統開發模式痛點</th>
                        <th className="py-3 px-4">AI 自助生產體系轉變</th>
                        <th className="py-3 px-4">具體交付產出</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {ECOSYSTEM_ROLES.map((r) => (
                        <tr key={r.roleTitle} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{r.roleTitle}</div>
                            <div className="font-mono text-[11px] text-slate-500">{r.englishTag}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {r.coreResponsibility}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {r.traditionalPain}
                          </td>
                          <td className="py-3.5 px-4 text-teal-900 font-medium">
                            {r.aiEraTransformation}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                            {r.concreteOutput}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Cross-National / Cross-Disciplinary Student Innovation Tracks */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-xs font-medium text-teal-800">
                    全球參與者共同建構之創新生態系
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                    跨學校、跨國家、跨專業領域學生創新團隊協作藍圖
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    每個人只需負責一小部分專業（醫療場景、FHIR Micro-IG、AI Agent、IoT、前端、測試確效），透過共同標準與平台組合起來：
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GLOBAL_STUDENT_TRACKS.map((track) => (
                    <div
                      key={track.trackName}
                      className="p-5 border border-slate-200 rounded-lg bg-slate-50/40 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-900">
                          {track.trackName}
                        </h3>
                        <div className="text-xs text-teal-800 font-medium">
                          參與背景：{track.discipline}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {track.focusArea}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">標準交付物：</span>
                        {track.deliverable}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Paradigm Shift Summary Table: Software as a Product vs. Continuously Generated Service */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-display">
                    未來軟體典範轉移：從「固定產品」走向「持續生成的服務」
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    不要再把主要資源投入「開發一套讓所有人滿意的系統」，而應該投入「建構讓每個人都能創造適合自己應用的環境」。
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">比較維度</th>
                        <th className="py-3 px-4">傳統軟體產業模式</th>
                        <th className="py-3 px-4">AI 應用生態系（自助式生產體系）</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {[
                        {
                          dim: '核心導向',
                          trad: '產品導向（開發一次 → 銷售給所有人）',
                          ai: '問題及場景導向（提供共通平台與標準模組 → 依場景持續生成）',
                        },
                        {
                          dim: '建構方式',
                          trad: '集中式開發（少數工程師掌握所有修改權）',
                          ai: '分散式建構（第一線醫護與使用者直接參與建構）',
                        },
                        {
                          dim: '功能決策權',
                          trad: '少數人決定功能，使用者只能排隊請求修改',
                          ai: '使用者與場景專家參與決定，即時與 AI 協作調整',
                        },
                        {
                          dim: '系統版本型態',
                          trad: '統一產品版本（修改常互相干擾，維護成本遞增）',
                          ai: '多種個別化應用版本（各自演進，底層以 FHIR Micro-IG 互通）',
                        },
                        {
                          dim: '價值創造與治理',
                          trad: '靠銷售單一軟體授權獲利，開發人員是最大瓶頸',
                          ai: '平台、模組、AI Agent、資安維護、資料品質檢核與共同治理創造價值',
                        },
                      ].map((row) => (
                        <tr key={row.dim} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {row.dim}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {row.trad}
                          </td>
                          <td className="py-3 px-4 text-teal-900 font-semibold">
                            {row.ai}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Modal: AI Custom Scenario Application Builder */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold text-teal-800">
                  AI Application Factory · 自助式應用建構器
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  描述您的醫療照護場景，由 AI 自動產生專屬應用與 FHIR Micro-IG
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAppModal(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
              >
                關閉
              </button>
            </div>

            <form onSubmit={handleBuildNewCustomApp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block">
                  1. 使用者角色與專業領域
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block">
                  2. 我要解決什麼問題與臨床目標？
                </label>
                <textarea
                  rows={2}
                  required
                  value={newScenarioProblem}
                  onChange={(e) => setNewScenarioProblem(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block">
                  3. 需要輸入及查詢哪些資料欄位？
                </label>
                <textarea
                  rows={2}
                  required
                  value={newDataRequirements}
                  onChange={(e) => setNewDataRequirements(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block">
                  4. 希望如何呈現、有哪些工作流程與權限需求？
                </label>
                <textarea
                  rows={2}
                  required
                  value={newWorkflowPreference}
                  onChange={(e) => setNewWorkflowPreference(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI 正在設計 FHIR Micro-IG 與專屬應用...</span>
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>立即生成專屬應用與 FHIR 規格</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
