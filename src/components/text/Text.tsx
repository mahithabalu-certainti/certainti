import { ITextProps } from './types';

const Text = ({ children, className, ...props }: ITextProps) => {
  return (
    <p {...props} className={className}>
      {children}
    </p>
  );
};

export default Text;
