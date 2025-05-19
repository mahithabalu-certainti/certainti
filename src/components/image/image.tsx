import { Box, BoxProps } from '@mui/material';

interface ImageProps extends BoxProps {
  src: string;
  alt?: string;
}

export const Image = ({ src, alt, sx, ...props }: ImageProps) => {
  return <Box component='img' src={src} alt={alt} sx={sx} {...props} />;
};
