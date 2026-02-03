'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  X, Trash2, ExternalLink, Receipt, Loader2, Calendar, Briefcase 
} from 'lucide-react';

interface ExpenseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Refresh dashboard totals when an item is deleted
}

export default function ExpenseHistoryModal({ isOpen, onClose, onUpdate }: ExpenseHistoryModalProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchExpenses();
  }, [isOpen]);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch expenses AND the related project title
    const { data, error } = await supabase
      .from('expenses')
      .select('*, sow_documents(title)') 
      .order('date_incurred', { ascending: false });

    if (!error && data) setExpenses(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, receiptPath: string | null) => {
    if (!confirm("Delete this expense permanently?")) return;
    setDeletingId(id);

    // 1. Delete from DB
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (!error) {
        // 2. (Optional) Try to delete the image from storage to save space
        // This fails silently if the path is complex, which is fine for now.
        if (receiptPath) {
            const path = receiptPath.split('/').pop(); // Simple attempt
            // await supabase.storage.from('receipts').remove([path]); 
        }
        
        // 3. Remove from UI immediately
        setExpenses(expenses.filter(e => e.id !== id));
        onUpdate(); // Tell parent dashboard to update the "Total" number
    } else {
        alert("Error deleting");
    }
    setDeletingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" /> Expense History
          </h2>
          <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
               <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
               <p className="text-sm font-medium">Loading receipts...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300"><Receipt className="w-8 h-8" /></div>
               <h3 className="text-gray-900 font-bold">No expenses found</h3>
               <p className="text-gray-500 text-sm mt-1">Start tracking your costs to see them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-all hover:border-gray-300 group">
                   
                   {/* Left: Info */}
                   <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-gray-400">
                          {expense.vendor_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-900">{expense.vendor_name}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                <Calendar className="w-3 h-3" /> {new Date(expense.date_incurred).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {expense.sow_documents?.title || 'Unknown Project'}
                              </span>
                              <span className="text-gray-400">• {expense.category}</span>
                          </div>
                      </div>
                   </div>

                   {/* Right: Actions */}
                   <div className="flex items-center gap-4 self-end sm:self-center">
                       <span className="text-lg font-bold text-gray-900">
                          ${expense.amount.toFixed(2)}
                       </span>
                       
                       <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>

                       <div className="flex items-center gap-2">
                           {expense.receipt_url ? (
                               <a 
                                 href={expense.receipt_url} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                 title="View Receipt"
                               >
                                  <ExternalLink className="w-4 h-4" />
                               </a>
                           ) : (
                               <span className="p-2 text-gray-300 cursor-not-allowed"><ExternalLink className="w-4 h-4" /></span>
                           )}
                           
                           <button 
                             onClick={() => handleDelete(expense.id, expense.receipt_url)}
                             disabled={deletingId === expense.id}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             title="Delete"
                           >
                              {deletingId === expense.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                           </button>
                       </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Summary */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Total Items: {expenses.length}</span>
            <span className="font-bold text-gray-900">Total: ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</span>
        </div>

      </div>
    </div>
  );
}