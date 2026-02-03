'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  X, DollarSign, Loader2, Camera, Calendar, Tag, Store, Briefcase 
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  client_name: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[]; // 🆕 List of projects to choose from
  defaultProjectId?: string; // Optional: Pre-select if we are on a specific job page
  onSuccess?: () => void;
}

const CATEGORIES = ['Material', 'Labor', 'Permit', 'Fuel', 'Software', 'Other'];

export default function AddExpenseModal({ isOpen, onClose, projects, defaultProjectId, onSuccess }: AddExpenseModalProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Material');
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset/Init when opening
  useEffect(() => {
    if (isOpen && defaultProjectId) setSelectedProjectId(defaultProjectId);
    if (isOpen && !defaultProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
  }, [isOpen, defaultProjectId, projects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !amount || !selectedProjectId) return alert("Please fill in all fields.");

    setLoading(true);

    try {
      let receiptUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedProjectId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
        
        receiptUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          project_id: selectedProjectId,
          vendor_name: vendor,
          amount: parseFloat(amount),
          category: category,
          date_incurred: date,
          receipt_url: receiptUrl
        });

      if (insertError) throw insertError;

      // Cleanup
      setVendor('');
      setAmount('');
      setFile(null);
      setPreviewUrl(null);
      if (onSuccess) onSuccess();
      router.refresh(); 
      onClose();

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Log Expense</h2>
          <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Project Selector (Only show if multiple projects exist) */}
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Select Project</label>
             <select 
               className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-black outline-none cursor-pointer text-sm font-medium"
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
             >
                <option value="" disabled>-- Choose a Job --</option>
                {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.client_name})</option>
                ))}
             </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="block w-full pl-10 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-0 transition-all outline-none placeholder-gray-300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Store className="w-3 h-3" /> Vendor Name</label>
              <input type="text" placeholder="e.g. Home Depot" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Category</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
              <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Receipt Photo</label>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            
            {!file ? (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all group">
                <div className="bg-gray-100 p-3 rounded-full group-hover:bg-indigo-100"><Camera className="w-6 h-6" /></div>
                <span className="text-sm font-medium">Tap to snap receipt</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 flex items-center gap-3 p-3 bg-gray-50">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">{previewUrl && <img src={previewUrl} alt="Receipt" className="w-full h-full object-cover" />}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{file.name}</p></div>
                  <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Expense'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}