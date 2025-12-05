import { useState, useMemo } from 'react';
import { SearchIcon } from '../../../../../assets';
import {
  useGetScopeEventList,
  useGetScopeList,
} from '../../../../service/workflow-builder/workflow-builder-service';
import { Trigger } from '../helper';
import { TriggerCard } from './data-card';

interface TriggerManagerProps {
  onSelect: (trigger: Trigger) => void;
  selectedTriggerId?: string | null;
}

const TriggerManager: React.FC<TriggerManagerProps> = ({
  onSelect,
  selectedTriggerId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('all');

  // Fetch scope list (categories) - only load once
  const { data: scopeListData, isLoading: isLoadingScopes } = useGetScopeList();

  // Prepare payload for scope event list
  const eventListPayload = useMemo(
    () => ({
      scope_type_rid: selectedScope === 'all' ? '' : selectedScope,
      status_rid: '',
    }),
    [selectedScope]
  );

  // Fetch scope event list (triggers)
  const { data: eventListData, isLoading: isLoadingEvents } =
    useGetScopeEventList(eventListPayload);

  // Transform API data to match existing Trigger interface
  const triggers = useMemo(() => {
    if (!eventListData?.data) return [];

    return eventListData.data.map((event) => ({
      id: event.rid,
      name: event.event_name,
      description: event.description || '',
      category: event.scope_type_rid, // Using scope_type_rid as category ID
      badge: undefined, // No badge from API, can be added if needed
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

    return [{ id: 'all', label: 'All' }, ...categories];
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
    return selectedTriggerId === triggerId;
  };

  // Show full loader only on initial load
  if (isLoadingScopes) {
    return (
      <div className='h-full flex flex-col items-center justify-center p-6'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
        <p className='mt-3 text-[#425A76]'>Loading triggers...</p>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='p-6 border-b border-[#CBD6E2] sticky top-0 z-20'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-2xl text-[#425A76] font-bold'>Add a Trigger</h2>
          {selectedTriggerId && (
            <div className='text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200'>
              ✓ Trigger Selected
            </div>
          )}
        </div>

        {/* Search box */}
        <div className='relative mb-3'>
          <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 [&>path]:stroke-[#425A76]' />
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
        {/* Selected trigger highlight section */}
        {selectedTriggerId && !isLoadingEvents && (
          <div className='px-6 pt-6'>
            <h3 className='text-sm font-semibold text-[#425A76] mb-3 uppercase'>
              Currently Selected
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
              {triggers
                .filter((t) => t.id === selectedTriggerId)
                .map((trigger) => (
                  <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    onSelect={(trigger) => onSelect(trigger as Trigger)}
                    isSelected={true}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingEvents ? (
          <div className='px-6 py-3'>
            {[...Array(2)].map((_, outerIndex) => (
              <div key={outerIndex} className='space-y-4 mb-6'>
                {/* Skeleton for category header */}
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className='w-full flex items-start gap-3 p-3 rounded-md border border-[#CBD6E2] bg-gray-50 animate-pulse'
                    >
                      <div className='mt-0.5 p-1.5 rounded-md w-7 h-7 flex-shrink-0 bg-gray-300'></div>
                      <div className='flex-1 min-w-0 space-y-2'>
                        <div className='h-3 bg-gray-300 rounded w-3/4'></div>
                        <div className='h-2 bg-gray-200 rounded w-full'></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                  (trigger) => trigger.id !== selectedTriggerId
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
                    .filter((trigger) => trigger.id !== selectedTriggerId) // Exclude already selected
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
