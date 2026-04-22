import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      style={{
        textAlign: 'center',
        height: '40px',
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#666',
        backgroundColor: '#fff',
      }}
    >
      &copy; {currentYear} Certainti.Ai. All Rights Reserved.
    </footer>
  );
};

export default Footer;
