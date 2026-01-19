 
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  Rule,
  Trigger,
  Condition,
  Action,
  ConditionType,
  ConditionTypeEnum,
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
  validatedFieldErrors: Map<
    string,
    { field: boolean; operator: boolean; value: boolean }
  >; // Track field-level errors per condition
  ruleNameError: string | null; // Track rule name validation error
  showRuleNameError: boolean; // Track whether to show rule name error
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
      name: '',
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
  const [validatedConditionIds, setValidatedConditionIds] = useState<
    Set<string>
  >(new Set());
  const [duplicateConditionIds, setDuplicateConditionIds] = useState<
    Set<string>
  >(new Set());
  const [validatedFieldErrors, setValidatedFieldErrors] = useState<
    Map<string, { field: boolean; operator: boolean; value: boolean }>
  >(new Map());
  const [ruleNameError, setRuleNameError] = useState<string | null>(null);
  const [showRuleNameError, setShowRuleNameError] = useState(false);

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
      // Capture old condition data and related duplicates BEFORE updating
      let oldSignature: string | undefined;
      let relatedDuplicateIds: string[] = [];

      setRule((prev) => {
        // Store old condition before update
        const oldCondition = prev.conditions.find((c) => c.id === conditionId);

        if (oldCondition && duplicateConditionIds.has(conditionId)) {
          oldSignature = `${oldCondition.category}|${oldCondition.field}|${oldCondition.operator}|${oldCondition.value}`;

          // Find all conditions that have the same signature (including this one)
          relatedDuplicateIds = prev.conditions
            .filter((c) => {
              const sig = `${c.category}|${c.field}|${c.operator}|${c.value}`;
              return sig === oldSignature && duplicateConditionIds.has(c.id);
            })
            .map((c) => c.id);
        }

        const newConditions = prev.conditions.map((cond) =>
          cond.id === conditionId ? updatedCondition : cond
        );

        // Check if we're updating condition 1 and there's a condition 2 with AND operator
        if (prev.conditions.length === 2) {
          const updatedConditionIndex = prev.conditions.findIndex(
            (c) => c.id === conditionId
          );

          // If updating condition 1 (index 0)
          if (updatedConditionIndex === 0) {
            const condition2 = newConditions[1];

            // If condition 2 uses AND operator and now has the same field as updated condition 1
            if (
              condition2.logicalOperator === 'AND' &&
              updatedCondition.field &&
              condition2.field &&
              updatedCondition.field === condition2.field
            ) {
              // Auto-swap to OR operator instead of clearing data
              newConditions[1] = {
                ...condition2,
                logicalOperator: 'OR',
              };
            }
          }
        }

        return {
          ...prev,
          conditions: newConditions,
        };
      });

      // Clear individual field errors when fields are filled
      setValidatedFieldErrors((prev) => {
        const current = prev.get(conditionId);
        if (current) {
          const newErrors = { ...current };

          // Clear field error if field is now valid
          if (updatedCondition.field) {
            newErrors.field = false;
          }

          // Clear operator error if operator is now valid
          if (updatedCondition.operator) {
            newErrors.operator = false;
          }

          // Clear value error if value is now valid
          if (
            updatedCondition.value !== '' &&
            updatedCondition.value !== null &&
            updatedCondition.value !== undefined
          ) {
            newErrors.value = false;
          }

          // If all errors are cleared, remove from map
          if (!newErrors.field && !newErrors.operator && !newErrors.value) {
            const newMap = new Map(prev);
            newMap.delete(conditionId);
            return newMap;
          }

          // Update with new errors
          const newMap = new Map(prev);
          newMap.set(conditionId, newErrors);
          return newMap;
        }
        return prev;
      });

      // If this condition was validated and is now complete, remove it from validated set
      const isComplete =
        updatedCondition.field &&
        updatedCondition.operator &&
        updatedCondition.value !== '' &&
        updatedCondition.value !== null &&
        updatedCondition.value !== undefined;

      if (isComplete && validatedConditionIds.has(conditionId)) {
        setValidatedConditionIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(conditionId);
          return newSet;
        });
      }

      // Clear duplicate error when any field in this condition changes
      if (oldSignature && relatedDuplicateIds.length > 0) {
        setDuplicateConditionIds((prevDups) => {
          const newDups = new Set(prevDups);

          // Always remove duplicate error from the changed condition
          newDups.delete(conditionId);

          // If there were only 2 conditions with this signature and one changed,
          // the remaining one is no longer a duplicate
          if (relatedDuplicateIds.length === 2) {
            relatedDuplicateIds.forEach((id) => newDups.delete(id));
          }

          return newDups;
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
    setValidatedConditionIds((prev) => {
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
    setRule((prev) => {
      // Remove the action from actions array
      const newActions = prev.actions.filter((a) => a.id !== actionId);

      return {
        ...prev,
        actions: newActions,
      };
    });
  }, []);

  // Rule name validation
  const validateRuleName = useCallback((name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return 'Rule name is required';
    }

    if (trimmedName.length < 2) {
      return 'Rule name must be at least 2 characters';
    }

    if (trimmedName.length > 64) {
      return 'Rule name must not exceed 64 characters';
    }

    // Only letters, numbers, spaces, apostrophes('), and hyphens(-)
    const validPattern = /^[a-zA-Z0-9\s'-]+$/;
    if (!validPattern.test(trimmedName)) {
      return "Rule name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-)";
    }

    return null;
  }, []);

  // Rule metadata
  const updateRuleName = useCallback(
    (name: string) => {
      setRule((prev) => ({
        ...prev,
        name,
      }));

      // Clear error when user types (don't validate on change)
      if (showRuleNameError) {
        setShowRuleNameError(false);
        setRuleNameError(null);
      }
    },
    [showRuleNameError]
  );

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

  // Allow proceeding to actions if:
  // 1. Condition type is THEN (conditions are optional)
  // 2. All conditions are complete
  // 3. Condition type is selected but no conditions added yet (user can skip)
  const canProceedToActions = !!(
    rule.conditionType?.condition_type?.toLowerCase() ===
      ConditionTypeEnum.then ||
    areAllConditionsComplete ||
    (rule.conditionType && rule.conditions.length === 0)
  );

  // Validate and save function
  const validateAndSave = useCallback(() => {
    // Validate rule name first
    const nameError = validateRuleName(rule.name);
    setRuleNameError(nameError);
    setShowRuleNameError(true);

    if (nameError) {
      // Rule name is invalid, don't proceed
      return false;
    }

    // If condition type is THEN, skip condition validation entirely
    if (
      rule.conditionType?.condition_type?.toLowerCase() ===
      ConditionTypeEnum.then
    ) {
      setValidatedConditionIds(new Set());
      setDuplicateConditionIds(new Set());
      setValidatedFieldErrors(new Map());
      return true;
    }

    // If there are no conditions, allow saving
    if (rule.conditions.length === 0) {
      setValidatedConditionIds(new Set());
      setDuplicateConditionIds(new Set());
      setValidatedFieldErrors(new Map());
      return true;
    }

    // Track field-level errors for each condition
    const fieldErrors = new Map<
      string,
      { field: boolean; operator: boolean; value: boolean }
    >();

    // Find incomplete conditions and track which fields are invalid
    const incompleteConditionIds = rule.conditions
      .filter((condition) => {
        const fieldInvalid = !condition.field;
        const operatorInvalid = !condition.operator;
        const valueInvalid =
          condition.value === '' ||
          condition.value === null ||
          condition.value === undefined;

        const isIncomplete = fieldInvalid || operatorInvalid || valueInvalid;

        if (isIncomplete) {
          // Track which specific fields are invalid
          fieldErrors.set(condition.id, {
            field: fieldInvalid,
            operator: operatorInvalid,
            value: valueInvalid,
          });
        }

        return isIncomplete;
      })
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
      setValidatedFieldErrors(fieldErrors);
      // Switch to conditions step to show errors
      setCurrentStep('conditions');
      return false;
    }

    // Validation passed - clear validated sets
    setValidatedConditionIds(new Set());
    setDuplicateConditionIds(new Set());
    setValidatedFieldErrors(new Map());
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.conditions, rule.name, validateRuleName]);

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
    validatedFieldErrors,
    ruleNameError,
    showRuleNameError,
    validateAndSave,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
