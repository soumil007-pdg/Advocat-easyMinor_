'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import { ChatSkeleton } from '@/app/components/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';
import { 
  Download, 
  Link as LinkIcon, 
  ArrowRight, 
  Plus, 
  Trash2,
  UploadCloud,
  FileText,
  Scale,
  CheckCircle,
  AlertTriangle,
  Gavel
} from 'lucide-react';

// --- 1. Professional Typography & "Legal Brief" Styling ---
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Inter:wght@400;500;600;800&display=swap');
    
    /* The "Legal Paper" Look */
    .prose-brief { 
      font-family: 'Merriweather', serif; 
      color: #334155; 
      line-height: 1.8;
      font-size: 1.05rem;
    }
    
    .prose-brief h1, .prose-brief h2, .prose-brief h3 {
      font-family: 'Inter', sans-serif;
      color: #171717;
      font-weight: 800;
      margin-top: 1.5em;
      margin-bottom: 0.6em;
      letter-spacing: -0.02em;
    }
    
    .prose-brief h3 {
      font-size: 1.25rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.5rem;
    }

    .prose-brief strong {
      color: #000;
      font-weight: 700;
    }

    .prose-brief ul {
      list-style-type: disc;
      padding-left: 1.2em;
      margin-bottom: 1em;
    }

    .prose-brief li {
      margin-bottom: 0.4em;
    }

    .prose-brief a {
      color: #FF5B33;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
      font-weight: 600;
    }

    /* Custom Scrollbar for Citations */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  `}</style>
);

// --- Helper: Citation Parser ---
const parseCitations = (text) => {
  if (!text) return [];
  const citations = [];
  
  const linkRegex = /(https?:\/\/[^\s\)]+)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const pre = text.substring(Math.max(0, match.index - 10), match.index);
    if (!pre.endsWith('](')) citations.push({ type: 'link', title: match[1], href: match[1] });
  }
  
  const actRegex = /((?:Section|Article|Order|Rule)\s+\d+[A-Za-z]*|(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+Act(?:,\s+\d{4})?)/g;
  while ((match = actRegex.exec(text)) !== null) {
    if (!['The', 'Act', 'Section'].includes(match[0])) {
        citations.push({ type: 'act', title: match[0], href: null });
    }
  }
  
  const unique = [];
  const seen = new Set();
  citations.forEach(c => {
      if (!seen.has(c.title)) {
          seen.add(c.title);
          unique.push(c);
      }
  });
  return unique;
};

// --- Schema (Human-Friendly) ---
const schema = z.object({
  caseTitle: z.string().min(1, "Please give your case a name"),
  plaintiffName: z.string().min(1, "Your Name is required"),
  defendantName: z.string().min(1, "Opponent Name is required"),
  caseType: z.string().min(1, "Case Type is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  causeDate: z.string().optional(),
  description: z.string().min(10, "Please describe what happened (at least 10 chars)"),
  reliefSought: z.string().optional(), 
  suitValue: z.string().optional(),
  priorActions: z.string().optional(),
  certificateStatus: z.string().optional(),
  certificateFile: z.any().optional(),
  witnesses: z.array(z.object({
    name: z.string().min(1, "Witness Name is required"),
    connection: z.string().min(1, "Connection is required"),
    knowledge: z.string().min(1, "Knowledge is required"),
  })).optional(),
  evidence: z.array(z.object({
    type: z.enum(['documents', 'photos', 'testimony', 'other']),
    description: z.string().min(1, "Evidence Description is required"),
    fileName: z.string().optional() 
  })).optional(),
});

const indianStates = [
  { name: 'Andhra Pradesh' }, { name: 'Arunachal Pradesh' }, { name: 'Assam' }, { name: 'Bihar' }, 
  { name: 'Chhattisgarh' }, { name: 'Goa' }, { name: 'Gujarat' }, { name: 'Haryana' }, 
  { name: 'Himachal Pradesh' }, { name: 'Jharkhand' }, { name: 'Karnataka' }, { name: 'Kerala' }, 
  { name: 'Madhya Pradesh' }, { name: 'Maharashtra' }, { name: 'Manipur' }, { name: 'Meghalaya' }, 
  { name: 'Mizoram' }, { name: 'Nagaland' }, { name: 'Odisha' }, { name: 'Punjab' }, 
  { name: 'Rajasthan' }, { name: 'Sikkim' }, { name: 'Tamil Nadu' }, { name: 'Telangana' }, 
  { name: 'Tripura' }, { name: 'Uttar Pradesh' }, { name: 'Uttarakhand' }, { name: 'West Bengal' }, 
  { name: 'Delhi' }, { name: 'Jammu and Kashmir' }, { name: 'Ladakh' }, { name: 'Puducherry' }
];

export default function CaseAdvisor() {
  const { isLoggedIn, loading } = useAuth(true); // Use the auth hook
  const [step, setStep] = useState(1);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [witnesses, setWitnesses] = useState([]); 
  const [evidence, setEvidence] = useState([]);
  const [activeCitations, setActiveCitations] = useState([]);
  const router = useRouter();

  const methods = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange', 
    defaultValues: {
      caseTitle: '', plaintiffName: '', defendantName: '', caseType: '', state: '', city: '',
      causeDate: '', description: '', reliefSought: '', suitValue: '',
      priorActions: '', certificateStatus: '', certificateFile: null,
      witnesses: [], evidence: [],
    },
  });
  
  const { register, handleSubmit, formState: { errors, dirtyFields }, watch, getValues, setValue, trigger } = methods;

  // Value Formatter
  const [displaySuitValue, setDisplaySuitValue] = useState('');
  const handleSuitValueChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue.length > 15) return;
    setValue('suitValue', rawValue, { shouldValidate: true });
    setDisplaySuitValue(rawValue ? new Intl.NumberFormat('en-IN').format(rawValue) : '');
  };

  // Dynamic Fields
  const addWitness = () => {
    const current = getValues('witnesses') || [];
    setValue('witnesses', [...current, { name: '', connection: '', knowledge: '' }]);
    setWitnesses([...current, {}]);
  };
  const removeWitness = (index) => {
    const current = getValues('witnesses');
    const updated = current.filter((_, i) => i !== index);
    setValue('witnesses', updated);
    setWitnesses(updated);
  };

  const addEvidence = () => {
    const current = getValues('evidence') || [];
    setValue('evidence', [...current, { type: 'documents', description: '', fileName: '' }]);
    setEvidence([...current, {}]);
  };
  const removeEvidence = (index) => {
    const current = getValues('evidence');
    const updated = current.filter((_, i) => i !== index);
    setValue('evidence', updated);
    setEvidence(updated);
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) setValue(`evidence.${index}.fileName`, file.name);
  };

  const handleCertFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // We update status to 'Attached' internally for submission
      setValue('certificateStatus', `Have Certificate: ${file.name}`);
      setValue('certificateFile', e.target.files);
    }
  };

  // Input Styling Helper
  const getInputClass = (fieldName, isError) => {
    const base = "w-full p-3 border rounded-lg bg-gray-800 text-white focus:outline-none transition-all duration-200 ";
    if (isError) return base + "border-red-500 focus:ring-2 focus:ring-red-500";
    
    let isDirty = false;
    if (typeof fieldName === 'string') isDirty = dirtyFields[fieldName];
    else if (Array.isArray(fieldName)) isDirty = fieldName.some(f => dirtyFields[f]);

    if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        let current = dirtyFields;
        for (const part of parts) {
            if (current && current[part]) current = current[part];
            else { current = undefined; break; }
        }
        if (current) isDirty = true;
    }

    if (isDirty) return base + "border-green-500 focus:ring-2 focus:ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
    return base + "border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500";
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setResult('');
    setActiveCitations([]); 
    setStep(4); 
    
    try {
      const payload = {
        ...data,
        certificateFile: data.certificateFile?.[0]?.name || "Not uploaded",
        evidence: data.evidence?.map(item => ({
          type: item.type,
          description: item.description,
          attachedFile: item.fileName || "No file attached" 
        }))
      };

      const res = await fetch('/api/case-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });
      const apiData = await res.json();
      
      if (res.ok) {
        setResult(apiData.text);
        const citations = parseCitations(apiData.text);
        setActiveCitations(citations);
        toast.success('Analysis Complete!');
      } else {
        toast.error(apiData.message || 'Analysis failed.');
        setStep(3); 
      }
    } catch (err) {
      toast.error('Connection Error. Please try again.');
      setStep(3);
    }
    setIsLoading(false);
  };

  const onError = (errors) => {
    const firstErrorKey = Object.keys(errors)[0];
    const errorMsg = errors[firstErrorKey]?.message || "Please check missing fields";
    if (firstErrorKey === 'witnesses') toast.error("Please fill in all Witness details.");
    else if (firstErrorKey === 'evidence') toast.error("Please describe your Evidence.");
    else toast.error(errorMsg);
  };

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ['caseTitle', 'plaintiffName', 'defendantName', 'caseType', 'state', 'city'];
    if (step === 2) fields = ['description'];
    
    const isValid = await trigger(fields);
    if (isValid) setStep(s => s + 1);
    else toast.error('Please fill required fields');
  };

  // --- PDF Export Logic ---
  const handleExportPDF = () => {
    if (!result) { toast.error("No analysis to export yet."); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    let yPos = 20; 

    // PDF Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text("Advocat-Easy Case Report", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Strategic Analysis & Roadmap", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 6;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Case Info Block
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Case: ${getValues('caseTitle') || 'Untitled Case'}`, margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Client: ${getValues('plaintiffName')} | Opponent: ${getValues('defendantName')}`, margin, yPos);
    yPos += 10;

    // Body Text
    const splitText = result.split('\n');
    doc.setFontSize(11);
    
    splitText.forEach(line => {
        if (yPos > 280) { doc.addPage(); yPos = 20; }
        const cleanLine = line.replace(/\*\*/g, '').replace(/###/g, '').trim();

        if (line.startsWith('###')) {
            yPos += 4;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text(cleanLine, margin, yPos);
            yPos += 2;
            doc.setDrawColor(44, 62, 80);
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, margin + 80, yPos);
            yPos += 8;
        } else if (line.includes('**')) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0);
            const wrappedText = doc.splitTextToSize(cleanLine, maxLineWidth);
            doc.text(wrappedText, margin, yPos);
            yPos += (wrappedText.length * 6) + 2;
        } else if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(50);
            const bulletText = `•  ${cleanLine.replace(/^[\*\-]\s*/, '')}`;
            const wrappedText = doc.splitTextToSize(bulletText, maxLineWidth);
            doc.text(wrappedText, margin + 2, yPos);
            yPos += (wrappedText.length * 6) + 2;
        } else if (line.trim().length > 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(20);
            const wrappedText = doc.splitTextToSize(cleanLine, maxLineWidth);
            doc.text(wrappedText, margin, yPos);
            yPos += (wrappedText.length * 6) + 2;
        } else {
            yPos += 4;
        }
    });

    doc.save(`${getValues('caseTitle') || 'Advocat_Report'}.pdf`);
    toast.success("PDF Downloaded");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white">Loading...</div>;
  if (!isLoggedIn) return null;

  return (
    <>
      <FontLoader />
      <div className="min-h-screen w-full bg-[#121212] text-white py-20 pb-20 font-sans">
        
        {/* --- Progress Header --- */}
        <div className="max-w-5xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between mb-6">
             <h1 className="text-3xl font-extrabold flex items-center gap-3">
                <Gavel className="text-[#FF5B33]" size={32} /> 
                Case Strategist
             </h1>
             <div className="text-sm text-gray-400 font-mono">Step {step} of 4</div>
          </div>
          
          {/* Custom Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8 overflow-hidden">
             <div className="bg-[#FF5B33] h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step/4)*100}%` }}></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
            
            {/* --- INPUT STEPS (Dark Mode) --- */}
            {step < 4 && (
                <div className="bg-[#1E1E1E] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-2xl font-bold border-b border-gray-700 pb-4 mb-6 text-white">The Basics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Case Name</label>
                                <input {...register('caseTitle')} className={getInputClass('caseTitle', errors.caseTitle)} placeholder="e.g. Flat 302 Dispute" />
                                </div>
                                <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Category</label>
                                <select {...register('caseType')} className={getInputClass('caseType', errors.caseType)}>
                                    <option value="">Select Type</option>
                                    <option value="contract">Contract / Agreement</option>
                                    <option value="property">Property / Real Estate</option>
                                    <option value="family">Family / Matrimonial</option>
                                    <option value="consumer">Consumer Dispute</option>
                                    <option value="tort">Civil Wrong / Damages</option>
                                    <option value="other">Other</option>
                                </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Your Name</label>
                                    <input {...register('plaintiffName')} placeholder="Full Name" className={getInputClass('plaintiffName', errors.plaintiffName)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Opposing Party</label>
                                    <input {...register('defendantName')} placeholder="Opponent Name" className={getInputClass('defendantName', errors.defendantName)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">State</label>
                                    <select {...register('state')} className={getInputClass('state', errors.state)}>
                                    <option value="">Select State</option>
                                    {indianStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">City</label>
                                    <input {...register('city')} placeholder="City / District" className={getInputClass('city', errors.city)} />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="button" onClick={nextStep} className="w-full bg-[#FF5B33] hover:bg-[#e04f2a] text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(255,91,51,0.3)]">Next: The Facts <ArrowRight size={20}/></button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-2xl font-bold border-b border-gray-700 pb-4 mb-6 text-white">The Facts</h3>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">What Happened?</label>
                                <textarea {...register('description')} rows={6} placeholder="Describe the situation in detail..." className={getInputClass('description', errors.description)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Desired Outcome</label>
                                <textarea {...register('reliefSought')} rows={2} placeholder="e.g. Refund, Apology, Eviction" className={getInputClass('reliefSought', errors.reliefSought)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Start Date</label>
                                    <input type="date" lang="en-GB" {...register('causeDate')} className={getInputClass('causeDate', errors.causeDate)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Financial Value</label>
                                    <input value={displaySuitValue} onChange={handleSuitValueChange} placeholder="₹ Amount" className={getInputClass('suitValue', errors.suitValue)} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-semibold text-white">Back</button>
                                <button type="button" onClick={nextStep} className="w-2/3 bg-[#FF5B33] hover:bg-[#e04f2a] text-white py-4 rounded-xl font-bold text-lg">Next: Evidence</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-2xl font-bold border-b border-gray-700 pb-4 mb-6 text-white">Evidence & Witnesses</h3>
                            
                            {/* 1. Evidence List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-blue-400 uppercase tracking-wider">1. Evidence Files</label>
                                    <button type="button" onClick={addEvidence} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-900/50 flex items-center gap-1"><Plus size={14}/> Add</button>
                                </div>
                                {evidence.length === 0 && <div className="p-4 border border-dashed border-gray-700 rounded-lg text-center text-gray-500 text-sm">No evidence added yet.</div>}
                                {evidence.map((e, i) => (
                                    <div key={i} className="p-4 bg-[#121212] border border-gray-700 rounded-xl space-y-3 relative">
                                        <button type="button" onClick={() => removeEvidence(i)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <select {...register(`evidence.${i}.type`)} className={getInputClass(`evidence.${i}.type`, false)}>
                                                <option value="documents">Document</option>
                                                <option value="photos">Photo/Video</option>
                                                <option value="testimony">Statement</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="md:col-span-2">
                                                <label className="flex items-center justify-center w-full p-3 border border-gray-600 bg-[#1E1E1E] rounded-lg cursor-pointer hover:border-[#FF5B33] transition group">
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors truncate">
                                                        <UploadCloud size={18} /> {watch(`evidence.${i}.fileName`) || "Attach Proof"}
                                                    </div>
                                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, i)} />
                                                </label>
                                            </div>
                                        </div>
                                        <input {...register(`evidence.${i}.description`)} placeholder="What does this prove?" className={getInputClass(`evidence.${i}.description`, errors.evidence?.[i]?.description)} />
                                    </div>
                                ))}
                            </div>

                            {/* 2. Witness List */}
                            <div className="space-y-4 pt-4 border-t border-gray-800">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-green-400 uppercase tracking-wider">2. Witnesses</label>
                                    <button type="button" onClick={addWitness} className="text-xs bg-green-900/30 text-green-400 px-3 py-1 rounded hover:bg-green-900/50 flex items-center gap-1"><Plus size={14}/> Add</button>
                                </div>
                                {witnesses.length === 0 && <div className="p-4 border border-dashed border-gray-700 rounded-lg text-center text-gray-500 text-sm">No witnesses added.</div>}
                                {witnesses.map((w, i) => (
                                    <div key={i} className="p-4 bg-[#121212] border border-gray-700 rounded-xl space-y-3 relative">
                                        <button type="button" onClick={() => removeWitness(i)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input {...register(`witnesses.${i}.name`)} placeholder="Name" className={getInputClass(`witnesses.${i}.name`, errors.witnesses?.[i]?.name)} />
                                            <input {...register(`witnesses.${i}.connection`)} placeholder="Relation" className={getInputClass(`witnesses.${i}.connection`, errors.witnesses?.[i]?.connection)} />
                                        </div>
                                        <input {...register(`witnesses.${i}.knowledge`)} placeholder="What do they know?" className={getInputClass(`witnesses.${i}.knowledge`, errors.witnesses?.[i]?.knowledge)} />
                                    </div>
                                ))}
                            </div>

                            {/* 3. 65B Certificate Section (IMPROVED) */}
                            <div className="p-6 bg-yellow-900/10 border border-yellow-700/30 rounded-xl">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg"><AlertTriangle className="text-yellow-500" size={20}/></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-500 mb-1">Electronic Evidence (Sec 65B)</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Mandatory for admissibility of WhatsApp, Emails, CCTV, etc. <br/>
                                            <span className="text-yellow-600/80 italic">Note: There is no central "Code" for this. It is a signed affidavit.</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Question */}
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="has65B" 
                                            className="accent-yellow-500 w-4 h-4"
                                            onChange={() => setValue('certificateStatus', 'Have Certificate')} 
                                        />
                                        <span className="text-sm text-gray-300">Yes, I have signed it</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="has65B" 
                                            className="accent-yellow-500 w-4 h-4"
                                            onChange={() => {
                                                setValue('certificateStatus', 'Need Drafting');
                                                setValue('certificateFile', null);
                                            }}
                                        />
                                        <span className="text-sm text-gray-300">No, I need to draft it</span>
                                    </label>
                                </div>

                                {/* Conditional UI based on choice */}
                                {watch('certificateStatus')?.includes('Have Certificate') ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-yellow-700/40 bg-[#121212] rounded-lg cursor-pointer hover:bg-yellow-900/10 transition group">
                                            <div className="flex flex-col items-center gap-2 text-sm text-gray-400 group-hover:text-yellow-500 transition-colors">
                                                <UploadCloud size={24} /> 
                                                <span className="font-medium">{watch('certificateFile')?.[0]?.name || "Upload Signed 65B Affidavit (PDF)"}</span>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                className="hidden" 
                                                onChange={handleCertFileChange}
                                            />
                                        </label>
                                    </div>
                                ) : watch('certificateStatus') === 'Need Drafting' ? (
                                    <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20 text-xs text-yellow-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={14} />
                                            <span>Noted. Advocat will include a <strong>65B Draft Template</strong> in your final strategy.</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-semibold text-white">Back</button>
                                <button type="submit" className="w-2/3 bg-[#FF5B33] hover:bg-[#e04f2a] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-900/20">Generate Strategy</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- RESULT STEP (The "Paper" View) --- */}
            {step === 4 && (
              <div className="animate-in zoom-in-95 duration-500">
                 <div className="bg-white rounded-lg shadow-2xl overflow-hidden min-h-[80vh] flex flex-col md:flex-row">
                    
                    {/* Left: The Document */}
                    <div className="flex-1 p-8 md:p-12 bg-white text-slate-900">
                       <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                           <div>
                               <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Legal Strategy Report</h2>
                               <p className="text-slate-500 text-sm">Prepared for: <span className="font-semibold text-slate-900">{getValues('plaintiffName')}</span></p>
                           </div>
                           <Scale className="text-[#FF5B33]" size={40} />
                       </div>

                       <div className="prose-brief">
                           {isLoading ? (
                               <div className="space-y-6">
                                   <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                   <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                                   <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                                   <div className="h-32 bg-slate-50 rounded animate-pulse"></div>
                               </div>
                           ) : (
                               <ReactMarkdown>{result}</ReactMarkdown>
                           )}
                       </div>
                    </div>

                    {/* Right: The Reference Rail */}
                    <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 text-slate-800 shrink-0">
                        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <LinkIcon size={14}/> Citations & Acts
                        </h3>
                        
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1,2,3].map(i => <div key={i} className="h-12 bg-white rounded-lg animate-pulse border border-slate-100"></div>)}
                            </div>
                        ) : (
                            <ul className="space-y-3 custom-scrollbar overflow-y-auto max-h-[calc(100vh-200px)]">
                                {activeCitations.length === 0 ? (
                                    <li className="text-sm text-slate-400 italic">No specific acts cited in this brief.</li>
                                ) : (
                                    activeCitations.map((c, i) => (
                                        <li key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-orange-200 transition-colors text-sm">
                                            {c.type === 'link' ? (
                                                <a href={c.href} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline flex items-start gap-2">
                                                    <LinkIcon size={14} className="mt-1 shrink-0"/> 
                                                    <span className="break-words">{c.title}</span>
                                                </a>
                                            ) : (
                                                <div className="flex items-start gap-2 text-slate-700 font-medium">
                                                    <Gavel size={14} className="mt-1 shrink-0 text-purple-600"/>
                                                    <span>{c.title}</span>
                                                </div>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}

                        {/* Action Buttons in Sidebar */}
                        <div className="mt-8 space-y-3 pt-6 border-t border-slate-200">
                            <button onClick={handleExportPDF} disabled={isLoading || !result} className="w-full bg-[#171717] text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition disabled:opacity-50">
                                <Download size={16}/> Download PDF
                            </button>
                            <button onClick={() => {setStep(1); methods.reset(); setWitnesses([]); setEvidence([]);}} className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold text-sm hover:bg-slate-50 transition">
                                New Analysis
                            </button>
                        </div>
                    </div>

                 </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </>
  );
}