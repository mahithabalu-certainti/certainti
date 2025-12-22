import {
  Button,
  ButtonOwnProps,
  SxProps,
  Theme,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface TextButtonProps {
  label?: string;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  // variant?: 'contained' | 'text' | 'outlined' | 'filled';
  color?: ButtonOwnProps['color'];
  loading?: boolean;
  disabled?: boolean;
  hide?: boolean;
  tooltipValue?: string;
  toolTipEnabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
const StyledButton = styled(Button)(() => {
  return {
    height: '24px !important',
    color: '#425A76',
    border: '1px solid #CBD6E2',
    boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 400,
    padding: '0px',
    borderRadius: '2px',
    '&:hover': {
      color: '#425A76 !important',
    },
  };
});

const TextButton: React.FC<TextButtonProps> = ({
  label,
  children,
  hide,
  loading,
  disabled,
  tooltipValue,
  toolTipEnabled,
  ...rest
}) => {
  if (hide) return null;
  return (
    <Tooltip
      title={toolTipEnabled ? tooltipValue : ''}
      arrow
      placement='top'
    >
      <span>
        <StyledButton disabled={disabled || loading} {...rest}>
          {loading ? (
            <CircularProgress size={14} thickness={5} color='inherit' />
          ) : (
            children || label
          )}
        </StyledButton>
      </span>
    </Tooltip>
  );
};

export default TextButton;
