"use client";

export default function Modal(){

    return(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 border-4 border-red-500">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Fetching New Token...</h2>
            </div>
        </div>
        
    )
}