import { Button, ButtonOwnProps, SxProps, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface TextButtonProps {
  label: string;
  sx?: SxProps<Theme>;
  variant?: 'contained' | 'text' | 'outlined' | 'filled';
  color?: ButtonOwnProps['color'];
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const StyledButton = styled(Button)<{
  buttontype: 'contained' | 'text' | 'outlined' | 'filled';
}>(({ theme, buttontype, color }) => {
  const secondaryColor = theme.palette.secondary.main;
  const whiteColor = theme.palette.common.white;
  const isFilled = buttontype === 'filled';
  const colorInherit = color === 'inherit';
  return {
    backgroundColor: isFilled ? secondaryColor : 'transparent',
    height: '32px !important',
    color: colorInherit
      ? theme.palette.grey[600]
      : isFilled
        ? whiteColor
        : secondaryColor,
    border:
      buttontype === 'outlined'
        ? `1px solid ${colorInherit ? theme.palette.grey[400] : secondaryColor}`
        : 'none',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '2px',
    '&:hover': {
      backgroundColor: `${colorInherit ? theme.palette.grey[700] : secondaryColor} !important`,
      color: `${whiteColor} !important`,
    },
    '&:disabled': {
      backgroundColor: `${colorInherit ? theme.palette.grey[700] : theme.palette.secondary.light}`,
      color: theme.palette.grey[100],
    },
  };
});

const TextButton: React.FC<TextButtonProps> = ({
  variant = 'contained',
  label,
  ...rest
}) => {
  return (
    <StyledButton buttontype={variant} {...rest}>
      {label}
    </StyledButton>
  );
};

export default TextButton;
