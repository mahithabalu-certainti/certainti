import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Rule,
  Trigger,
  Condition,
  Action,
  ConditionType,
  LogicalOperator,
} from './helper';

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
  updateLogicalOperator: (
    conditionId: string,
    operator: LogicalOperator
  ) => void;
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
  validatedConditionIds: Set<string>; // Track which conditions have been validated
  duplicateConditionIds: Set<string>; // Track which conditions are duplicates
  validateAndSave: () => boolean;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(
  undefined
);

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
  initialRule,
}) => {
  const [rule, setRule] = useState<Rule>(
    initialRule || {
      id: crypto.randomUUID(),
      name: 'Untitled rule',
      trigger: null,
      conditions: [],
      actions: [],
      conditionType: null,
      isActive: false,
    }
  );

  const [currentStep, setCurrentStep] = useState<
    'trigger' | 'conditions' | 'actions'
  >('trigger');
  const [validatedConditionIds, setValidatedConditionIds] = useState<Set<string>>(new Set());
  const [duplicateConditionIds, setDuplicateConditionIds] = useState<Set<string>>(new Set());

  // Update rule when initialRule is loaded (for edit mode)
  useEffect(() => {
    if (initialRule) {
      setRule(initialRule);
    }
  }, [initialRule]);

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

  const updateCondition = useCallback(
    (conditionId: string, updatedCondition: Condition) => {
      setRule((prev) => ({
        ...prev,
        conditions: prev.conditions.map((cond) =>
          cond.id === conditionId ? updatedCondition : cond
        ),
      }));
      
      // If this condition was validated and is now complete, remove it from validated set
      const isComplete = 
        updatedCondition.field &&
        updatedCondition.operator &&
        updatedCondition.value !== '' &&
        updatedCondition.value !== null &&
        updatedCondition.value !== undefined;
      
      if (isComplete && validatedConditionIds.has(conditionId)) {
        setValidatedConditionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(conditionId);
          return newSet;
        });
      }
      
      // If this condition was marked as duplicate, remove it from duplicate set when changed
      if (duplicateConditionIds.has(conditionId)) {
        setDuplicateConditionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(conditionId);
          return newSet;
        });
      }
    },
    [validatedConditionIds, duplicateConditionIds]
  );

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
    
    // Remove from validated set if it was there
    setValidatedConditionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(conditionId);
      return newSet;
    });
  }, []);

  const updateLogicalOperator = useCallback(
    (conditionId: string, operator: LogicalOperator) => {
      setRule((prev) => ({
        ...prev,
        conditions: prev.conditions.map((condition) =>
          condition.id === conditionId
            ? { ...condition, logicalOperator: operator }
            : condition
        ),
      }));
    },
    []
  );

  const setConditionType = useCallback(
    (conditionType: ConditionType | null) => {
      setRule((prev) => ({
        ...prev,
        conditionType,
      }));
    },
    []
  );

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

  // Check if all conditions are complete (have field, operator, and value)
  const areAllConditionsComplete =
    rule.conditions.length > 0 &&
    rule.conditions.every(
      (condition) =>
        condition.field &&
        condition.operator &&
        condition.value !== '' &&
        condition.value !== null &&
        condition.value !== undefined
    );

  // Allow proceeding to actions if user has started setting up conditions (has condition type)
  // or if they have no conditions at all (workflow without conditions is allowed)
  const canProceedToActions = areAllConditionsComplete;

  // Validate and save function
  const validateAndSave = useCallback(() => {
    // If there are no conditions, allow saving
    if (rule.conditions.length === 0) {
      setValidatedConditionIds(new Set());
      setDuplicateConditionIds(new Set());
      return true;
    }

    // Find incomplete conditions
    const incompleteConditionIds = rule.conditions
      .filter(
        (condition) =>
          !condition.field ||
          !condition.operator ||
          condition.value === '' ||
          condition.value === null ||
          condition.value === undefined
      )
      .map((condition) => condition.id);

    // Check for duplicate conditions
    const duplicateIds = new Set<string>();
    const seen = new Map<string, string>(); // Map of condition signature to first condition ID

    rule.conditions.forEach((condition) => {
      // Only check complete conditions for duplicates
      if (
        condition.field &&
        condition.operator &&
        condition.value !== '' &&
        condition.value !== null &&
        condition.value !== undefined
      ) {
        const signature = `${condition.category}|${condition.field}|${condition.operator}|${condition.value}`;
        
        if (seen.has(signature)) {
          // Mark both the original and duplicate as duplicates
          const originalId = seen.get(signature)!;
          duplicateIds.add(originalId);
          duplicateIds.add(condition.id);
        } else {
          seen.set(signature, condition.id);
        }
      }
    });

    // Check if all existing conditions are complete
    if (incompleteConditionIds.length > 0 || duplicateIds.size > 0) {
      // Mark these specific conditions as validated (to show errors)
      setValidatedConditionIds(new Set(incompleteConditionIds));
      setDuplicateConditionIds(duplicateIds);
      // Switch to conditions step to show errors
      setCurrentStep('conditions');
      return false;
    }

    // Validation passed - clear validated sets
    setValidatedConditionIds(new Set());
    setDuplicateConditionIds(new Set());
    return true;
  }, [rule.conditions]);

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
    validatedConditionIds,
    duplicateConditionIds,
    validateAndSave,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
