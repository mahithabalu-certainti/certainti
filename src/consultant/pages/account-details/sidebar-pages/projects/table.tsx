import {
  Button,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import React, { useState } from 'react';

interface Project {
  id: string;
  number: string;
  refId: string;
  industry: string;
  startDate: string;
  endDate: string;
  status: string;
}

const ProjectsTable: React.FC = () => {
  const [page, setPage] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setSelectedProjectId] = useState<string | null>(null);

  // Sample data
  const projects: Project[] = [
    {
      id: '2003001',
      number: 'TT2P001',
      refId: 'YLL2100234',
      industry: 'I.T',
      startDate: '8/9/2008',
      endDate: '8/4/2026',
      status: 'Active',
    },
    {
      id: '2003002',
      number: 'TT2P002',
      refId: '39158',
      industry: 'I.T',
      startDate: '27/11/2007',
      endDate: '27/1/2025',
      status: 'Active',
    },
    {
      id: '2003003',
      number: 'TT2P003',
      refId: '35289',
      industry: 'I.T',
      startDate: '15/7/2022',
      endDate: '11/9/2026',
      status: 'Active',
    },
    {
      id: '2003004',
      number: 'TT2P004',
      refId: 'Y.IN2203342',
      industry: 'I.T',
      startDate: '15/2/2019',
      endDate: '27/6/2026',
      status: 'Active',
    },
    {
      id: '2003005',
      number: 'TT2P005',
      refId: '46255',
      industry: 'I.T',
      startDate: '9/3/2016',
      endDate: '28/2/2026',
      status: 'Active',
    },
  ];

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    projectId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedProjectId(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectId(null);
  };

  // Calculate pagination values
  const startIndex = page * 5;
  const endIndex = startIndex + 5;
  const displayedProjects = projects.slice(startIndex, endIndex);
  const totalPages = Math.ceil(projects.length / 5);

  // Calculate display range for pagination text
  const from = projects.length === 0 ? 0 : startIndex + 1;
  const to = Math.min(endIndex, projects.length);

  const open = Boolean(anchorEl);

  return (
    <div className='p-4 bg-gray-50 rounded-lg'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <div className='bg-pink-100 p-2 rounded-lg mr-2'>
            <span role='img' aria-label='download'>
              📥
            </span>
          </div>
          <h1 className='text-xl font-medium'>Projects</h1>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outlined'
            className='border-orange-500 text-orange-500 hover:bg-orange-50'
          >
            <span role='img' aria-label='download'>
              📥
            </span>{' '}
            Download
          </Button>
          <Button
            variant='outlined'
            className='border-orange-500 text-orange-500 hover:bg-orange-50'
          >
            <span role='img' aria-label='add'>
              ➕
            </span>{' '}
            New
          </Button>
          <Button
            variant='outlined'
            className='border-orange-500 text-orange-500 hover:bg-orange-50'
          >
            <span role='img' aria-label='edit'>
              ✏️
            </span>{' '}
            Edit
          </Button>
        </div>
      </div>

      <TableContainer component={Paper} className='shadow-sm'>
        <Table>
          <TableHead className='bg-gray-50'>
            <TableRow>
              <TableCell className='font-bold'>Project Id</TableCell>
              <TableCell className='font-bold'>Project Number</TableCell>
              <TableCell className='font-bold'>Project Ref Id</TableCell>
              <TableCell className='font-bold'>Industry</TableCell>
              <TableCell className='font-bold'>Project Start Date</TableCell>
              <TableCell className='font-bold'>Project End Date</TableCell>
              <TableCell className='font-bold'>Status</TableCell>
              <TableCell className='font-bold'>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedProjects.map((project) => (
              <TableRow key={project.id} className='hover:bg-gray-50'>
                <TableCell>{project.id}</TableCell>
                <TableCell>{project.number}</TableCell>
                <TableCell>{project.refId}</TableCell>
                <TableCell>{project.industry}</TableCell>
                <TableCell>{project.startDate}</TableCell>
                <TableCell>{project.endDate}</TableCell>
                <TableCell>
                  <span className='text-green-600 font-medium'>
                    {project.status}
                  </span>
                </TableCell>
                <TableCell>
                  <IconButton
                    size='small'
                    onClick={(e) => handleMenuOpen(e, project.id)}
                    aria-controls={open ? 'project-menu' : undefined}
                    aria-haspopup='true'
                    aria-expanded={open ? 'true' : undefined}
                  >
                    <span role='img' aria-label='more'>
                      ⋮
                    </span>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className='flex items-center justify-between p-2 border-t'>
          <div className='px-4 py-2'>
            {/* Empty div for spacing to balance the layout */}
          </div>

          <div className='flex-grow flex justify-center items-center'>
            <Button variant='text' className='text-blue-600'>
              View All
            </Button>
          </div>
          <div className='px-4 py-2'>
            <span className='text-gray-600'>{`${from}-${to}`}</span>
            <IconButton
              size='small'
              disabled={page === 0}
              onClick={() => handleChangePage(null, page - 1)}
            >
              <span role='img' aria-label='previous'>
                ◀
              </span>
            </IconButton>
            <IconButton
              size='small'
              disabled={page >= totalPages - 1}
              onClick={() => handleChangePage(null, page + 1)}
            >
              <span role='img' aria-label='next'>
                ▶
              </span>
            </IconButton>
          </div>
        </div>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        id='project-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'action-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemText>
            <span role='img' aria-label='edit'>
              ✏️
            </span>{' '}
            Edit
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemText>
            <span role='img' aria-label='delete'>
              🗑️
            </span>{' '}
            Delete
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemText>
            <span role='img' aria-label='summary'>
              📊
            </span>{' '}
            View Summary
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemText>
            <span role='img' aria-label='activities'>
              📝
            </span>{' '}
            View Activities
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemText>
            <span role='img' aria-label='notes'>
              📓
            </span>{' '}
            View Notes
          </ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ProjectsTable;
