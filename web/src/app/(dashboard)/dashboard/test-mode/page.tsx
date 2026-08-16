import { listTestModeScenarios } from '@/lib/test-mode/runner';
import TestModeClient from './test-mode-client';

export default function TestModePage() {
  return <TestModeClient scenarios={listTestModeScenarios()} />;
}
