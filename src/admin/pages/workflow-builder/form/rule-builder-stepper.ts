import { useState, useCallback } from 'react';

export type StepperStep = 'trigger' | 'conditions' | 'actions';

interface UseRuleBuilderStepperProps {
  ruleId?: string;
  initialStep?: StepperStep;
}

export function useRuleBuilderStepper({
  initialStep = 'trigger',
}: UseRuleBuilderStepperProps) {
  const [currentStep, setCurrentStep] = useState<StepperStep>(initialStep);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(
    null
  );

  // ✅ Simple step navigation without URL params
  const goToTriggerStep = useCallback(() => {
    setCurrentStep('trigger');
    // Don't clear triggerId when going back - keep it selected
  }, []);

  const goToConditionsStep = useCallback((triggerId: string) => {
    setCurrentStep('conditions');
    setSelectedTriggerId(triggerId);
  }, []);

  const goToActionsStep = useCallback(() => {
    setCurrentStep('actions');
  }, []);

  const clearTriggerData = useCallback(() => {
    setSelectedTriggerId(null);
    setCurrentStep('trigger');
  }, []);

  const canProceedToConditions = selectedTriggerId !== null;
  const canProceedToActions = (conditionsCount: number) => conditionsCount > 0;

  return {
    currentStep,
    selectedTriggerId,
    goToTriggerStep,
    goToConditionsStep,
    goToActionsStep,
    clearTriggerData,
    canProceedToConditions,
    canProceedToActions,
    setSelectedTriggerId,
  };
}
