import React, { createContext, useContext, useState, useCallback } from 'react';
import { Rule, Trigger, Condition, Action, ConditionType, LogicalOperator } from './helper';

interface WorkflowContextValue {
  // Rule state
  rule: Rule;
  
  // Step management
  currentStep: 'trigger' | 'conditions' | 'actions';
  
  // Trigger actions
  selectTrigger: (trigger: Trigger) => void;
  removeTrigger: () => void;
  
  // Condition actions
  addCondition: (condition: Condition) => void;
  updateCondition: (conditionId: string, updatedCondition: Condition) => void;
  deleteCondition: (conditionId: string) => void;
  updateLogicalOperator: (conditionId: string, operator: LogicalOperator) => void;
  setConditionType: (conditionType: ConditionType | null) => void;
  
  // Action actions
  addAction: (action: Action) => void;
  deleteAction: (actionId: string) => void;
  
  // Rule metadata
  updateRuleName: (name: string) => void;
  
  // Navigation
  goToStep: (step: 'trigger' | 'conditions' | 'actions') => void;
  
  // Validation
  canProceedToConditions: boolean;
  canProceedToActions: boolean;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: React.ReactNode;
  initialRule?: Rule;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ 
  children,
  initialRule 
}) => {
  const [rule, setRule] = useState<Rule>(initialRule || {
    id: crypto.randomUUID(),
    name: 'Untitled rule',
    trigger: null,
    conditions: [],
    actions: [],
    conditionType: null,
    isActive: false,
  });
  
  const [currentStep, setCurrentStep] = useState<'trigger' | 'conditions' | 'actions'>('trigger');

  // Trigger actions
  const selectTrigger = useCallback((trigger: Trigger) => {
    setRule((prev) => {
      const isChangingTrigger = prev.trigger && prev.trigger.id !== trigger.id;
      
      if (isChangingTrigger) {
        // Clear all downstream data when changing trigger
        return {
          ...prev,
          trigger,
          conditions: [],
          actions: [],
          conditionType: null,
        };
      }
      
      return {
        ...prev,
        trigger,
      };
    });
    
    setCurrentStep('conditions');
  }, []);

  const removeTrigger = useCallback(() => {
    setRule((prev) => ({
      ...prev,
      trigger: null,
      conditions: [],
      actions: [],
      conditionType: null,
    }));
    setCurrentStep('trigger');
  }, []);

  // Condition actions
  const addCondition = useCallback((condition: Condition) => {
    setRule((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          ...condition,
          logicalOperator: prev.conditions.length === 0 ? undefined : 'AND',
        },
      ],
    }));
  }, []);

  const updateCondition = useCallback((conditionId: string, updatedCondition: Condition) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((cond) =>
        cond.id === conditionId ? updatedCondition : cond
      ),
    }));
  }, []);

  const deleteCondition = useCallback((conditionId: string) => {
    setRule((prev) => {
      const newConditions = prev.conditions.filter((c) => c.id !== conditionId);
      
      return {
        ...prev,
        conditions: newConditions,
        // Clear actions and condition type if all conditions are removed
        actions: newConditions.length === 0 ? [] : prev.actions,
        conditionType: newConditions.length === 0 ? null : prev.conditionType,
      };
    });
  }, []);

  const updateLogicalOperator = useCallback((conditionId: string, operator: LogicalOperator) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? { ...condition, logicalOperator: operator }
          : condition
      ),
    }));
  }, []);

  const setConditionType = useCallback((conditionType: ConditionType | null) => {
    setRule((prev) => ({
      ...prev,
      conditionType,
    }));
  }, []);

  // Action actions
  const addAction = useCallback((action: Action) => {
    setRule((prev) => ({
      ...prev,
      actions: [...prev.actions, action],
    }));
  }, []);

  const deleteAction = useCallback((actionId: string) => {
    setRule((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== actionId),
    }));
  }, []);

  // Rule metadata
  const updateRuleName = useCallback((name: string) => {
    setRule((prev) => ({
      ...prev,
      name,
    }));
  }, []);

  // Navigation
  const goToStep = useCallback((step: 'trigger' | 'conditions' | 'actions') => {
    setCurrentStep(step);
  }, []);

  // Validation
  const canProceedToConditions = rule.trigger !== null;
  const canProceedToActions = rule.conditions.length > 0;

  const value: WorkflowContextValue = {
    rule,
    currentStep,
    selectTrigger,
    removeTrigger,
    addCondition,
    updateCondition,
    deleteCondition,
    updateLogicalOperator,
    setConditionType,
    addAction,
    deleteAction,
    updateRuleName,
    goToStep,
    canProceedToConditions,
    canProceedToActions,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
