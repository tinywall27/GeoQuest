import type { ComponentType } from 'react';
export type LabInput = Record<string, number>;
export type LabMetric = {label: string; value: number; unit: string; digits?: number};
export type LabResult = {metrics: LabMetric[]; message: string};
export type LabControl = {key: string; label: string; options: {value: number; label: string}[]};
export type LabQuestion = {prompt: string; options: string[]; correct: number; explanation: string};
export interface LabDefinition {
 id: `GQ-T${string}`; slug: string; title: string; volume: 'G7A'|'G7B'|'G8A'|'G8B'; chapter: string;
 question: string; goal: string; prerequisites: string; misconception: string;
 steps: [string, string, string]; example: string; transfer: string;
 controls: LabControl[]; defaults: LabInput;
 comparison: {label: string; input: LabInput};
 evaluate: (input: LabInput) => LabResult;
 Diagram: ComponentType<{input: LabInput; result: LabResult}>;
 questions: [LabQuestion, LabQuestion];
 method: string; limitations: string[];
 sources: {title: string; publisher: string; url: string; verifiedAt: string}[];
}
