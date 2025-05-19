import { Button, ButtonOwnProps, SxProps, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface TextButtonProps {
  label: string;
  sx?: SxProps<Theme>;
  // variant?: 'contained' | 'text' | 'outlined' | 'filled';
  color?: ButtonOwnProps['color'];
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

// const StyledButton = styled(Button)<{
//   variantType: 'contained' | 'text' | 'outlined' | 'filled';
// }>(({ theme, variantType, color }) => {
//   const secondaryColor = theme.palette.secondary.main;
//   const whiteColor = theme.palette.common.white;
//   const isFilled = variantType === 'filled';
//   const colorInherit = color === 'inherit';
//   return {
//     backgroundColor: isFilled ? secondaryColor : 'transparent',
//     height: '32px !important',
//     color: colorInherit
//       ? theme.palette.grey[600]
//       : isFilled
//         ? whiteColor
//         : secondaryColor,
//     border:
//       variantType === 'outlined'
//         ? `1px solid ${colorInherit ? theme.palette.grey[400] : secondaryColor}`
//         : 'none',
//     textTransform: 'none',
//     fontSize: '14px',
//     fontWeight: '500',
//     padding: '8px 16px',
//     borderRadius: '2px',
//     '&:hover': {
//       backgroundColor: `${colorInherit ? theme.palette.grey[700] : secondaryColor} !important`,
//       color: `${whiteColor} !important`,
//     },
//     '&:disabled': {
//       backgroundColor: `${colorInherit ? theme.palette.grey[700] : theme.palette.secondary.light}`,
//       color: theme.palette.grey[100],
//     }
//   };
// });

const StyledButton = styled(Button)(() => {
  return {
    height: '32px !important',
    color: '#425A76',
    border: '1px solid #CBD6E2',
    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: '400',
    // padding: '8px 16px',
    borderRadius: '2px',
  }
});

const TextButton: React.FC<TextButtonProps> = ({
  label,
  ...rest
}) => {
  return (
    <StyledButton {...rest}>
      {label}
    </StyledButton>
  );
};

export default TextButton;
