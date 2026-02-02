import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ListItemText } from '@mui/material';
import { ActionIcon } from '../../assets';

interface ActionItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hide?: boolean;
}

interface ActionButtonProps {
  actions: ActionItem[];
  alignHorizontal?: 'left' | 'center' | 'right';
}

export default function TableActionButton({ 
  actions, 
  alignHorizontal = 'center' 
}: ActionButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className='relative inline-flex justify-center items-center w-full'>
      <IconButton
        disableRipple
        aria-label='more'
        id='action-button'
        size='small'
        aria-controls={open ? 'action-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <div
          className={`${open ? 'bg-[#EAF0F5]' : ''} border border-[#CBD6E2] rounded-[3px] cursor-pointer w-5 h-5 flex items-center justify-center`}
        >
          <ActionIcon alt='menu-icon' className='h-[13px]' />
        </div>
      </IconButton>

      <Menu
        sx={{
          paddingTop: 0,
          paddingBottom: 0,
          '& .MuiList-root': { padding: 0 },
        }}
        id='action-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'action-button' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: alignHorizontal }}
        transformOrigin={{ vertical: 'top', horizontal: alignHorizontal }}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: 'none',
            border: '1px solid #CBD6E2',
            borderRadius: '6px',
            position: 'absolute',
          },
        }}
      >
        {actions.map((item) => {
          if (item.hide) return null;
          return (
            <MenuItem
              key={item.label}
              onClick={() => {
                item.onClick();
                handleClose();
              }}
              disabled={item.disabled}
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: '#CBD6E2',
                backgroundColor: '#fff',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <ListItemText
                sx={{
                  span: {
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#2D3E4F',
                  },
                }}
              >
                {item.label}
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
