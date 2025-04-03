import { Button, ButtonOwnProps, SxProps, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface TextButtonProps {
  label: string;
  sx?: SxProps<Theme>;
  variant?: 'contained' | 'text' | 'outlined' | 'filled';
  color?: ButtonOwnProps['color'];
  loading?: boolean;
  onClick?: () => void;
}

const StyledButton = styled(Button)<{
  variantType: 'contained' | 'text' | 'outlined' | 'filled';
}>(({ theme, variantType, color }) => {
  const secondaryColor = theme.palette.secondary.main;
  const whiteColor = theme.palette.common.white;
  const isFilled = variantType === 'filled';
  const colorInherit = color === 'inherit';
  return {
    backgroundColor: isFilled ? secondaryColor : 'transparent',
    height: '35px',
    color: colorInherit
      ? theme.palette.grey[600]
      : isFilled
        ? whiteColor
        : secondaryColor,
    border:
      variantType === 'outlined'
        ? `1px solid ${colorInherit ? theme.palette.grey[400] : secondaryColor}`
        : 'none',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '0px',
    '&:hover': {
      backgroundColor: colorInherit ? theme.palette.grey[700] : secondaryColor,
      color: whiteColor,
    },
  };
});

const TextButton: React.FC<TextButtonProps> = ({
  variant = 'contained',
  label,
  ...rest
}) => {
  return (
    <StyledButton variantType={variant} {...rest}>
      {label}
    </StyledButton>
  );
};

export default TextButton;
