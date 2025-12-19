import React, { useState, useMemo } from 'react';
import { SearchIcon } from '../../../../../assets';
import { Action } from '../helper';
import { ActionCard } from './data-card';
import PageSkeleton from './page-skeleton';
import { useWorkflowContext } from '../workflow-context';
import { useGetActionTypes } from '../../../../service/workflow-builder/workflow-builder-service';
import { ActionCategoryTypeResponse } from '../../../../types';

interface ActionManagerProps {
  actionCategoryData?: ActionCategoryTypeResponse;
  isLoadingActionCategories?: boolean;
}

const ActionManager = ({
  actionCategoryData,
  isLoadingActionCategories,
}: ActionManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { rule, addAction, deleteAction } = useWorkflowContext();

  const { data: actionTypeData, isLoading: isLoadingActionTypes } =
    useGetActionTypes({
      scope_rid: rule.trigger?.category || '',
      action_type_rid: selectedCategory === 'all' ? '' : selectedCategory,
      status_rid: '',
    });

  // Transform action category data to categories
  const actionCategories = useMemo(() => {
    if (!actionCategoryData?.data)
      return [{ id: 'all', label: 'All Actions', rid: '' }];

    const categories = actionCategoryData.data.map((category) => ({
      id: category.rid,
      label: category.name,
      rid: category.rid,
    }));

    return [{ id: 'all', label: 'All Actions', rid: '' }, ...categories];
  }, [actionCategoryData]);

  // Transform action type data to actions (main data source)
  const actionsData = useMemo(() => {
    if (!actionTypeData?.data) return [];

    return actionTypeData.data.map((actionType) => ({
      id: actionType.rid,
      name: actionType.name,
      description: actionType.description || '',
      category: actionType.action_type_rid || 'uncategorized',
      categoryName: actionType.action_type_name || 'Uncategorized',
    }));
  }, [actionTypeData]);

  // Filter actions (client-side search)
  const filteredActions = useMemo(() => {
    return actionsData.filter((action) => {
      const matchesSearch =
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase());

      // When "all" is selected, show all actions (no category filter)
      // When a specific category is selected, filter by category
      const matchesCategory =
        selectedCategory === 'all' || action.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [actionsData, searchQuery, selectedCategory]);

  // Group by category (only when "All" is selected)
  const groupedActions = useMemo(() => {
    const grouped: Record<string, typeof actionsData> = {};

    filteredActions.forEach((action) => {
      // Use category ID for grouping
      const categoryId = action.category;
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(action);
    });

    return grouped;
  }, [filteredActions]);

  const isActionAlreadyAdded = (actionId: string) =>
    rule.actions.some((action) => action.id === actionId);

  const handleActionSelect = (action: Action) => {
    if (isActionAlreadyAdded(action.id)) {
      // If already added, disable click - don't remove
      return;
    }
    addAction(action);
  };

  // Show full loader only on initial load
  if (isLoadingActionCategories) {
    return <PageSkeleton />;
  }

  // Show message if no trigger is selected
  if (!rule.trigger?.id) {
    return (
      <div className='h-full flex flex-col items-center justify-center p-6'>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-200'>
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-[#425A76] mb-2'>
            Select a Trigger First
          </h3>
          <p className='text-sm text-gray-500'>
            Please select a trigger to see available actions.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get category name by ID
  const getCategoryNameById = (categoryId: string) => {
    if (categoryId === 'all' || categoryId === '') return 'All Actions';
    if (categoryId === 'uncategorized') return 'Uncategorized';

    const category = actionCategories.find((c) => c.id === categoryId);
    return category?.label || categoryId;
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='p-6 border-b border-[#CBD6E2] bg-gray-50 sticky top-0 z-20'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-2xl text-[#425A76] font-bold'>Add Actions</h2>
          {rule.actions.length > 0 && (
            <div className='text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200'>
              ✓ {rule.actions.length} Action
              {rule.actions.length !== 1 ? 's' : ''} Added
            </div>
          )}
        </div>

        {/* Search box */}
        <div className='relative mb-3'>
          <React.Suspense fallback={null}>
            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 [&>path]:stroke-[#425A76]' />
          </React.Suspense>
          <input
            type='text'
            placeholder='Search Actions...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-[2px] text-[12px] border border-[#CBD6E2] text-[#425A76] 
                       focus:outline-none focus:ring-1 focus:ring-blue-500'
            disabled={isLoadingActionTypes}
          />
        </div>

        {/* Category tabs */}
        <div className='flex flex-wrap gap-2'>
          {actionCategories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                !isLoadingActionTypes && setSelectedCategory(category.id)
              }
              disabled={isLoadingActionTypes}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer
                ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-blue-600'
                    : 'border-[#CBD6E2] text-[#425A76] hover:bg-gray-50'
                }
                ${isLoadingActionTypes ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action list with skeleton loading */}
      <div className='flex-1 overflow-y-auto space-y-4 pb-4 min-h-[calc(100vh-397px)] max-h-[calc(100vh-397px)]'>
        {/* Selected actions highlight section */}
        {rule.actions.length > 0 && !isLoadingActionTypes && (
          <div className='px-6 pt-6'>
            <h3 className='text-sm font-semibold text-[#425A76] mb-3 uppercase'>
              Added Actions
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
              {rule.actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onSelect={() => {}}
                  isSelected={true}
                  isAlreadyAdded={true}
                  onDelete={() => deleteAction(action.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingActionTypes ? (
          <div className='py-3'>
            <PageSkeleton
              showHeader={false}
              showCategories={true}
              showCards={true}
              cardsPerCategory={8}
            />
          </div>
        ) : (
          <>
            {/* When "All" is selected - Show grouped by category */}
            {selectedCategory === 'all' ? (
              Object.entries(groupedActions).map(([categoryId, list]) => {
                // Get category name for display
                const categoryName = getCategoryNameById(categoryId);

                // Show all actions in category, including already added ones
                return (
                  <div key={categoryId} className='px-6 space-y-2'>
                    <h3
                      className='text-sm font-semibold text-[#425A76] uppercase sticky top-0
                                 bg-gray-50 z-10 py-2'
                    >
                      {categoryName}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                      {list.map((action) => {
                        const isAlreadyAdded = rule.actions.some(
                          (a) => a.id === action.id
                        );
                        return (
                          <ActionCard
                            key={action.id}
                            action={action}
                            onSelect={() => handleActionSelect(action)}
                            isAlreadyAdded={isAlreadyAdded}
                            disabled={isAlreadyAdded} // Disable if already added
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : filteredActions.length > 0 ? (
              // When specific category is selected - Show all actions in that category
              <div className='px-6 space-y-2'>
                <h3
                  className='text-sm font-semibold text-[#425A76] uppercase sticky top-0
                             bg-gray-50 z-10 py-2'
                >
                  {actionCategories.find((c) => c.id === selectedCategory)
                    ?.label || selectedCategory}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                  {filteredActions.map((action) => {
                    const isAlreadyAdded = rule.actions.some(
                      (a) => a.id === action.id
                    );
                    return (
                      <ActionCard
                        key={action.id}
                        action={action}
                        onSelect={() => handleActionSelect(action)}
                        isAlreadyAdded={isAlreadyAdded}
                        disabled={isAlreadyAdded} // Disable if already added
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className='text-center py-10 text-[#425A76] text-sm'>
                No actions found{' '}
                {searchQuery ? 'for your search' : 'in this category'}.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActionManager;
