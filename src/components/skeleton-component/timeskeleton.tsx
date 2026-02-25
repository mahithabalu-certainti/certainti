import SingleSkeleton from './singleskeleton';

// Width of time column (px) — keep in sync with the absolute line position
const TIME_COL_W = 62;
const DOT_COL_W = 24;
// The vertical line sits at the horizontal center of the dot column:
// TIME_COL_W + DOT_COL_W / 2 = 62 + 12 = 74px from group container left
const LINE_LEFT = TIME_COL_W + DOT_COL_W / 2;

interface TimelineSkeletonProps {
  /** Number of skeleton rows to render. Defaults to 7 for initial load. */
  count?: number;
  /** When true, omits outer padding/background so it nests inside the scroll container. */
  inline?: boolean;
}

const TimelineSkeleton: React.FC<TimelineSkeletonProps> = ({
  count = 7,
  inline = false,
}) => {
  const rows = Array.from({ length: count }, (_, i) => i + 1);

  const inner = (
    <div style={{ position: 'relative' }}>
      {/* Vertical Line */}
      <div
        style={{
          position: 'absolute',
          left: `${LINE_LEFT}px`,
          top: inline ? '0px' : '-25px',
          bottom: '8px',
          width: '1px',
          background: '#CBD6E2',
          zIndex: 0,
        }}
      />

      {rows.map((item) => (
        <div
          key={item}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            paddingBottom: '14px',
            position: 'relative',
          }}
        >
          {/* Time Skeleton */}
          <div
            style={{
              width: `${TIME_COL_W}px`,
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              paddingRight: '10px',
              paddingTop: '4px',
            }}
          >
            <SingleSkeleton width={45} height={14} variant='text' />
          </div>

          {/* Dot Skeleton */}
          <div
            style={{
              width: `${DOT_COL_W}px`,
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ background: '#fff', borderRadius: '4px' }}>
              <SingleSkeleton width={22} height={22} variant='rounded' />
            </div>
          </div>

          {/* Content Skeleton */}
          <div style={{ flex: 1, paddingLeft: '6px' }}>
            <div style={{ marginBottom: '6px' }}>
              <SingleSkeleton width='70%' height={16} variant='text' />
            </div>
            <SingleSkeleton width='40%' height={12} variant='text' />
          </div>
        </div>
      ))}
    </div>
  );

  if (inline) {
    return <div style={{ paddingTop: '8px' }}>{inner}</div>;
  }

  return (
    <div style={{ padding: '12px 16px 8px 16px', background: '#fff' }}>
      <div style={{ marginBottom: '16px' }}>
        {/* Date Badge Skeleton */}
        <div style={{ marginBottom: '14px' }}>
          <SingleSkeleton width={100} height={24} variant='rounded' />
        </div>
        {inner}
      </div>
    </div>
  );
};

export default TimelineSkeleton;
