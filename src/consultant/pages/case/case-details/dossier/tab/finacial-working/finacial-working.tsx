


const FinancialWorking = () => {


    return (
        <div className="min-h-screen bg-gray-50 p-6">
           
                <>
                    {/* Financial Data Tables - Styled like ConditionManager panels (SelectorSkeleton/CategorySelector) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3  animate-fadeIn">
                        {/* Regular Credit Table */}
                        <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden shadow-none'>
                            <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
                                <h3 className='text-sm font-semibold text-[#425A76]'>Regular Credit</h3>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="space-y-4 text-[13px] text-[#425A76]">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">9 Total Qualified Research Expenses</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">10 Fixed-base percentage</span>
                                        <span className="font-medium">3%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">11 Average Annual Gross Receipts</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">12 Multiply line 11 by percentage on line 10</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">13 Subtract line 12 from line 9</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">14 Multiply line 9 by 50%</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">15 Enter smaller of line 13 or line 14</span>
                                        <span className="font-medium">---</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">17 Electing reduced credit under 280C</span>
                                        <span className="font-medium">No</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded text-xs">
                                        <span className="text-gray-800 font-medium">Multiply line 16 by 15.8% (by 20% if line 17 is "No")</span>
                                        <span className="font-bold text-blue-700">---</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ASC Credit Table */}
                        <div className='bg-gray-50 rounded-lg border border-[#CBD6E2] overflow-hidden shadow-none'>
                            <div className='bg-gray-50 px-4 py-3 border-b border-[#CBD6E2]'>
                                <h3 className='text-sm font-semibold text-[#425A76]'>ASC Credit</h3>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="space-y-4 text-[13px] text-[#425A76]">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">28 Total Qualified Research Expenses</span>
                                        <span className="font-medium">63,181,458</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">29 Total QREs for prior 3 tax years</span>
                                        <span className="font-medium">165,370,013</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">30 Divide line 29 by 6.0</span>
                                        <span className="font-medium">27,561,669</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">31 Subtract line 30 from line 28</span>
                                        <span className="font-medium">35,619,790</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Enter 14%. If QREs in any of the 3 years is zero, enter 6%</span>
                                        <span className="font-medium">14%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">32 Multiply line 31 by the percentage above</span>
                                        <span className="font-medium">4,986,771</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">33 Add lines 23 and 32</span>
                                        <span className="font-medium">4,986,771</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">34 Electing reduced credit under 280C</span>
                                        <span className="font-medium">No</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded text-xs">
                                        <span className="text-gray-800 font-medium">Multiply line 23 by 70% (Article line 23 if line 24 is "No")</span>
                                        <span className="font-bold text-green-700">4,984,771</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>

            {/* Custom CSS for animation */}
            <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
        </div>
    );
};

export default FinancialWorking;
