import React, { useState, useMemo } from 'react';
import { SearchIcon } from '../../../../../assets';
import { Trigger } from '../helper';
import { TriggerCard } from './data-card';
import PageSkeleton from './page-skeleton';
import { useWorkflowContext } from '../workflow-context';
import { useGetScopeEventList } from '../../../../service/workflow-builder/workflow-builder-service';
import { ScopeListResponse } from '../../../../types';

interface TriggerManagerProps {
  scopeListData?: ScopeListResponse;
  onSelect: (trigger: Trigger) => void;
}

const TriggerManager: React.FC<TriggerManagerProps> = ({
  scopeListData,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('all');
  const { rule } = useWorkflowContext();

  // Dynamically fetch scope event list (triggers) based on selected scope
  const eventListPayload = useMemo(
    () => ({
      scope_type_rid: selectedScope === 'all' ? '' : selectedScope,
      status_rid: '',
    }),
    [selectedScope]
  );

  const { data: eventListData, isLoading: isLoadingEvents } =
    useGetScopeEventList(eventListPayload);

  // Transform API data to match existing Trigger interface
  const triggers = useMemo(() => {
    if (!eventListData?.data) return [];

    return eventListData.data.map((event) => ({
      id: event.rid,
      name: event.event_name,
      description: event.description || '',
      category: event.scope_type_rid,
      badge: undefined,
    }));
  }, [eventListData]);

  // Transform scope list to match existing category structure
  const triggerCategories = useMemo(() => {
    if (!scopeListData?.data?.scopes)
      return [{ id: 'all', label: 'All Triggers' }];

    const categories = scopeListData.data.scopes.map((scope) => ({
      id: scope.rid,
      label: scope.name,
    }));

    return [{ id: 'all', label: 'All Triggers' }, ...categories];
  }, [scopeListData]);

  // 🔍 Filter triggers (client-side search)
  const filteredTriggers = useMemo(() => {
    return triggers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedScope === 'all' || t.category === selectedScope;
      return matchesSearch && matchesCategory;
    });
  }, [triggers, searchQuery, selectedScope]);

  // Group by category
  const groupedTriggers = useMemo(() => {
    const grouped: Record<string, Trigger[]> = {};
    filteredTriggers.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });
    return grouped;
  }, [filteredTriggers]);

  // Check if a trigger is selected
  const isTriggerSelected = (triggerId: string) => {
    return rule.trigger?.id === triggerId;
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='p-6 border-b border-[#CBD6E2] bg-gray-50 sticky top-0 z-20'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-2xl text-[#425A76] font-bold'>Add a Trigger</h2>
          {rule.trigger && (
            <div className='text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200'>
              ✓ Trigger Selected
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
            placeholder='Search Triggers...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-[2px] text-[12px] border border-[#CBD6E2] text-[#425A76] 
                       focus:outline-none focus:ring-1 focus:ring-blue-500'
            disabled={isLoadingEvents}
          />
        </div>

        {/* Category tabs (using scopes from API) */}
        <div className='flex flex-wrap gap-2'>
          {triggerCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => !isLoadingEvents && setSelectedScope(category.id)}
              disabled={isLoadingEvents}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer
                ${
                  selectedScope === category.id
                    ? 'bg-blue-100 text-blue-700 border-blue-600'
                    : 'border-[#CBD6E2] text-[#425A76] hover:bg-gray-50'
                }
                ${isLoadingEvents ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger list with skeleton loading */}
      <div className='flex-1 overflow-y-auto space-y-4 pb-4'>
        {/* Selected trigger highlight section - Always show if trigger is selected */}
        {rule.trigger && !isLoadingEvents && (
          <div className='px-6 pt-6'>
            <h3 className='text-sm font-semibold text-[#425A76] mb-3 uppercase'>
              Currently Selected
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
              <TriggerCard
                key={rule.trigger.id}
                trigger={rule.trigger}
                onSelect={(trigger) => onSelect(trigger as Trigger)}
                isSelected={true}
              />
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingEvents ? (
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
            {/* Category sections */}
            {selectedScope === 'all' ? (
              Object.entries(groupedTriggers).map(([categoryId, list]) => {
                const category = triggerCategories.find(
                  (c) => c.id === categoryId
                );
                if (!category || category.id === 'all') return null;

                // Filter out already selected trigger from this category
                const filteredList = list.filter(
                  (trigger) => trigger.id !== rule.trigger?.id
                );
                if (filteredList.length === 0) return null;

                return (
                  <div key={categoryId} className='px-6 space-y-2'>
                    <h3
                      className='text-sm font-semibold text-[#425A76] uppercase sticky top-0
                                 bg-gray-50 z-10 py-2'
                    >
                      {category.label}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                      {filteredList.map((trigger) => (
                        <TriggerCard
                          key={trigger.id}
                          trigger={trigger}
                          onSelect={(trigger) => onSelect(trigger as Trigger)}
                          isSelected={isTriggerSelected(trigger.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : groupedTriggers[selectedScope]?.length ? (
              <div className='px-6 space-y-2'>
                <h3
                  className='text-sm font-semibold text-[#425A76] uppercase sticky top-0
                             bg-gray-50 z-10 py-2'
                >
                  {triggerCategories.find((c) => c.id === selectedScope)?.label}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                  {groupedTriggers[selectedScope]
                    .filter((trigger) => trigger.id !== rule.trigger?.id) // Exclude already selected
                    .map((trigger) => (
                      <TriggerCard
                        key={trigger.id}
                        trigger={trigger}
                        onSelect={(trigger) => onSelect(trigger as Trigger)}
                        isSelected={isTriggerSelected(trigger.id)}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <div className='text-center py-10 text-[#425A76] text-sm'>
                No triggers found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TriggerManager;
