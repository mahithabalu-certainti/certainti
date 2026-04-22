import type React from 'react';

interface UserAvatarProps {
  profileUrl?: string | null;
  initials: string;
  color?: string;
  size?: number; // px
  fontSize?: number; // px
  alt?: string;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  profileUrl,
  initials,
  color = '#999',
  size = 32,
  fontSize = 10,
  alt = 'user-avatar',
  className = '',
}) => {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white overflow-hidden flex-shrink-0 border ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize,
      }}
    >
      {profileUrl && (
        <img
          src={profileUrl}
          alt={alt}
          className='w-full h-full object-cover rounded-full'
          onError={(e) => {
            e.currentTarget.style.display = 'none'; // hide broken image
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
      )}

      {/* Initials fallback */}
      <span className={profileUrl ? 'hidden' : ''}>{initials}</span>
    </div>
  );
};

export default UserAvatar;
