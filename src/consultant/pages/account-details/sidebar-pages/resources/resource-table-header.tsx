import React from 'react';
import TextButton from '../../../../../components/button/text-button';

interface ResourceTableHeaderProps {
    title?: string;
    titleIcon?: React.ReactNode;
    headerButtons?: {
        label: string;
        variant: 'text' | 'outlined' | 'contained';
        onClick: () => void;
    }[];
}

const ResourceTableHeader: React.FC<ResourceTableHeaderProps> = ({ title = '',
    titleIcon,
    headerButtons = [], }) => {
    return (
        <div className='border-1 border-gray-300 mr-2'>
            <div className='flex items-center border-b-1 border-gray-300 justify-between p-4'>
                {title && (
                    <div className='flex gap-2 items-center'>
                        {titleIcon && (
                            <div className='bg-pink-100 p-2 rounded-lg mr-2'>
                                {titleIcon}
                            </div>
                        )}
                        <h1 className='text-xl font-medium'>{title}</h1>
                    </div>
                )}

                {headerButtons.length > 0 && (
                    <div className='flex gap-2'>
                        {headerButtons.map((button, index) => (
                            <TextButton
                                key={index}
                                label={button.label}
                                variant={button.variant}
                                // onClick={
                                //     button.label === 'View' ? toggleViewMode : button.onClick
                                // }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResourceTableHeader