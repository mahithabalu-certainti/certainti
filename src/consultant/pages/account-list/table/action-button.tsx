import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as React from 'react';
import { actionIcon } from '../../../../assets';
import { ListItemText } from '@mui/material';
import { ActionsDropdownItem } from '../../../../common-utils';

interface ActionButtonProps {
  onEdit: () => void;
  onDelete: () => void;
  isDisabled?: boolean;
  editCustomOption?: CustomOption;
  deleteCustomOption?: CustomOption;
}

interface CustomOption {
  hide?: boolean;
}

export default function ActionButton({
  onEdit,
  onDelete,
  isDisabled,
  editCustomOption,
  deleteCustomOption,
}: ActionButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const actionMenuItems: ActionsDropdownItem[] = [
    {
      label: 'Edit',
      onClick: () => onEdit(),
      hide: editCustomOption?.hide || isDisabled,
    },
    {
      label: 'Delete',
      onClick: () => onDelete(),
      hide: deleteCustomOption?.hide || isDisabled,
    },
  ];

  return (
    <div className='relative inline-flex justify-center items-center w-full'>
      <IconButton
        disableRipple
        aria-label='more'
        id='long-button'
        size='small'
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <div
          className={`${open ? 'bg-[#EAF0F5]' : ''} border border-[#CBD6E2] rounded-[3px] w-5 h-5 flex items-center justify-center`}
        >
          <img src={actionIcon} alt='menu-icon' className='h-[13px]' />
        </div>
      </IconButton>
      <Menu
        sx={{
          paddingTop: '0px',
          paddingBottom: '0px',
          '& .MuiList-root': {
            padding: 0,
          },
        }}
        id='action-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'action-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
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
        {actionMenuItems.map((item, i) => {
          if (item.hide) {
            return null;
          }
          return (
            <MenuItem
              key={i}
              sx={{
                display: 'flex',
                borderBottom: '1px solid',
                borderColor: '#CBD6E2',
                backgroundColor: '#fff',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
              onClick={() => {
                item.onClick();
                handleClose();
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
