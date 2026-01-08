module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx,svg}",
    ],
    safelist: [
      // Safelist for colorCode enum values to ensure dynamic classes are generated
      'bg-[#9747FF]',  // manageTemplateBgcolor
      'bg-[#BE3EB5]',  // manageAccountBgcolor
      'bg-[#3992ec]',  // accountBgColor
      'bg-[#ba60eb]',  // projectBgColor
      'bg-[#3EBEB5]',  // caseBgColor
      'bg-[#7F81F4]',  // notesBgColor
      'bg-[#e64c94]',  // taskBgColor
      'bg-[#d16dd3]',  // attachmentBgColor
      'text-[#FFFFFF]', // manageAccountTextColor
      'text-[#fff]',   // accountTextColor, projectTextColor, caseTextColor
      '[&>path]:stroke-[#FFFFFF]',
      '[&>path]:stroke-[#fff]',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }