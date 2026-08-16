export { WORLD_COUNTRIES, flagUrl, domainLogo, countryIsoFromLabelAr, mediaUrl } from './world-countries';
export type { WorldCountry } from './world-countries';

export type Role = 'STUDENT' | 'ADMIN';

export type ApplicationStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'قيد المراجعة',
  CONTACTED: 'تم التواصل',
  IN_PROGRESS: 'قيد المتابعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغى',
};

export interface UserPublic {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface CatalogUniversity {
  id: string;
  slug: string;
  labelAr: string;
  labelEn: string;
  logoUrl: string | null;
  countryId: string;
  majorIds: string[];
  majorStages: { majorId: string; stageIds: string[] }[];
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogCountry {
  id: string;
  slug: string;
  iso2: string | null;
  labelAr: string;
  labelEn: string;
  sortOrder: number;
  isActive: boolean;
  universities?: CatalogUniversity[];
}

export interface CatalogMajor {
  id: string;
  slug: string;
  fieldId: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  isCustom: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogField {
  id: string;
  slug: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  majors?: CatalogMajor[];
}

export interface CatalogStage {
  id: string;
  slug: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  years: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogResponse {
  countries: CatalogCountry[];
  fields: CatalogField[];
  majors: CatalogMajor[];
  stages: CatalogStage[];
}

export interface QuoteRequest {
  fieldId: string;
  majorId: string;
  stageId: string;
  countryId: string;
  universityId: string;
  customMajorLabel?: string;
}

export interface QuoteResponse {
  years: number;
  annualCostUsd: number | null;
  totalCostUsd: number | null;
}

export interface CompareItemDto {
  id: string;
  fieldId: string;
  majorId: string;
  stageId: string;
  countryId: string;
  universityId: string;
  customMajorLabel: string | null;
  years: number;
  annualCostUsd: number | null;
  totalCostUsd: number | null;
  createdAt: string;
  field: CatalogField;
  major: CatalogMajor;
  stage: CatalogStage;
  country: CatalogCountry;
  university: CatalogUniversity;
}

export interface ApplicationChoiceDto {
  id: string;
  preferenceOrder: number;
  fieldLabel: string;
  majorLabel: string;
  stageLabel: string;
  countryLabel: string;
  universityLabel: string;
  years: number;
  annualCostUsd: number | null;
  totalCostUsd: number | null;
}

export interface ApplicationDto {
  id: string;
  status: ApplicationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  choices: ApplicationChoiceDto[];
  user?: UserPublic;
}

export type GroupedApplicationMajor = {
  majorLabel: string;
  fieldLabel: string;
  stages: ApplicationChoiceDto[];
};

export type GroupedApplicationUniversity = {
  universityLabel: string;
  countryLabel: string;
  minOrder: number;
  majors: GroupedApplicationMajor[];
};

export function groupApplicationChoices(choices: ApplicationChoiceDto[]): GroupedApplicationUniversity[] {
  const unis: GroupedApplicationUniversity[] = [];
  const uniIndex = new Map<string, number>();

  for (const choice of choices) {
    const uniKey = `${choice.universityLabel}|||${choice.countryLabel}`;
    let index = uniIndex.get(uniKey);
    if (index == null) {
      index = unis.length;
      uniIndex.set(uniKey, index);
      unis.push({
        universityLabel: choice.universityLabel,
        countryLabel: choice.countryLabel,
        minOrder: choice.preferenceOrder,
        majors: [],
      });
    }
    const uni = unis[index];
    uni.minOrder = Math.min(uni.minOrder, choice.preferenceOrder);
    let major = uni.majors.find((m) => m.majorLabel === choice.majorLabel && m.fieldLabel === choice.fieldLabel);
    if (!major) {
      major = { majorLabel: choice.majorLabel, fieldLabel: choice.fieldLabel, stages: [] };
      uni.majors.push(major);
    }
    major.stages.push(choice);
  }

  unis.sort((a, b) => a.minOrder - b.minOrder);
  for (const uni of unis) {
    uni.majors.sort(
      (a, b) =>
        Math.min(...a.stages.map((s) => s.preferenceOrder)) - Math.min(...b.stages.map((s) => s.preferenceOrder)),
    );
    for (const major of uni.majors) {
      major.stages.sort((a, b) => a.preferenceOrder - b.preferenceOrder);
    }
  }
  return unis;
}

export interface AdminStats {
  students: number;
  applications: number;
  pendingApplications: number;
  countries: number;
  fields: number;
  majors: number;
  stages: number;
  universities: number;
}

export interface MajorPriceDto {
  universityId: string;
  majorId: string;
  stageId: string;
  costUsd: number | null;
  university?: CatalogUniversity;
  major?: CatalogMajor;
  stage?: CatalogStage;
}
