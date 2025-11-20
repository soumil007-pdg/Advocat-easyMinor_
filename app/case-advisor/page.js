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
import { 
  Download, 
  BookCopy, 
  Link as LinkIcon, 
  ArrowRight, 
  Plus, 
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  Scale 
} from 'lucide-react';

// --- Styles ---
const CaseResultStyling = () => (
  <style>{`
    .case-result-prose { color: #e5e7eb; font-size: 1rem; line-height: 1.7; }
    .case-result-prose h3 { font-size: 1.25rem; font-weight: 600; color: #ffffff; margin-top: 1.5em; border-bottom: 1px solid #4b5563; padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .case-result-prose p { margin-bottom: 1em; }
    .case-result-prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
    .case-result-prose li { margin-bottom: 0.5em; }
    .case-result-prose strong { color: #60a5fa; font-weight: 600; } 
    .case-result-prose a { color: #60a5fa; text-decoration: underline; }
    
    /* Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
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

// --- Schema ---
const schema = z.object({
  caseTitle: z.string().min(1, "Case Title is required"),
  plaintiffName: z.string().min(1, "Plaintiff Name is required"),
  defendantName: z.string().min(1, "Defendant Name is required"),
  caseType: z.string().min(1, "Case Type is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  causeDate: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  reliefSought: z.string().optional(), 
  suitValue: z.string().optional(),
  priorActions: z.string().optional(),
  certificateStatus: z.string().optional(),
  certificateFile: z.any().optional(),
  urgency: z.string().optional(),
  witnesses: z.array(z.object({
    name: z.string().min(1, "Witness Name is required"),
    connection: z.string().min(1, "Witness Connection is required"),
    knowledge: z.string().min(1, "Witness Knowledge is required"),
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState(1);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [witnesses, setWitnesses] = useState([]); 
  const [evidence, setEvidence] = useState([]);
  const [isRefsOpen, setIsRefsOpen] = useState(true);
  const [activeCitations, setActiveCitations] = useState([]);
  const router = useRouter();

  const methods = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange', 
    defaultValues: {
      caseTitle: '', plaintiffName: '', defendantName: '', caseType: '', state: '', city: '',
      causeDate: '', description: '', reliefSought: '', suitValue: '',
      priorActions: '', certificateStatus: '', certificateFile: null, urgency: '',
      witnesses: [], evidence: [],
    },
  });
  
  const { register, handleSubmit, formState: { errors, dirtyFields }, watch, getValues, setValue, trigger } = methods;

  const watchedEvidence = watch('evidence');
  const watchedCertFile = watch('certificateFile');

  const watchedSuitValue = watch('suitValue');
  const [displaySuitValue, setDisplaySuitValue] = useState('');
  const handleSuitValueChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue.length > 15) return;
    setValue('suitValue', rawValue, { shouldValidate: true });
    setDisplaySuitValue(rawValue ? new Intl.NumberFormat('en-IN').format(rawValue) : '');
  };

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
      setValue('certificateStatus', `Attached: ${file.name}`);
      setValue('certificateFile', e.target.files);
    }
  };

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

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (!token) { router.push('/auth'); return; }
    setIsLoggedIn(true); 
    setUserEmail('User');
  }, []);

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
    console.log("Validation Errors:", errors);
    const firstErrorKey = Object.keys(errors)[0];
    const errorMsg = errors[firstErrorKey]?.message || "Please check missing fields";
    
    if (firstErrorKey === 'witnesses') toast.error("Please fill in all Witness details.");
    else if (firstErrorKey === 'evidence') toast.error("Please describe your Evidence.");
    else toast.error(`Missing: ${errorMsg}`);
  };

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ['caseTitle', 'plaintiffName', 'defendantName', 'caseType', 'state', 'city'];
    if (step === 2) fields = ['description'];
    
    const isValid = await trigger(fields);
    if (isValid) setStep(s => s + 1);
    else toast.error('Please fill required fields');
  };

  // --- IMPROVED PDF GENERATION ---
  // This function formats the Markdown result into a clean PDF
  const handleExportPDF = () => {
    if (!result) {
        toast.error("No analysis to export yet.");
        return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    let yPos = 20; 

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue Title
    doc.text("Advocat-Easy Case Report", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated by Advocat-Easy AI Legal Advisor", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 6;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // --- Case Info Block ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Case: ${getValues('caseTitle') || 'Untitled Case'}`, margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Client: ${getValues('plaintiffName')} | Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 10;

    // --- Parsing and Formatting the AI Response ---
    const splitText = result.split('\n');
    
    doc.setFontSize(11);
    
    splitText.forEach(line => {
        // Check for Page Break
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        // Clean up Markdown symbols
        const cleanLine = line.replace(/\*\*/g, '').replace(/###/g, '').trim();

        if (line.startsWith('###')) {
            // H3 Headers (e.g., "Legal Framework")
            yPos += 4;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80); // Dark Blue/Grey
            doc.text(cleanLine, margin, yPos);
            yPos += 2; // Underline space
            doc.setDrawColor(44, 62, 80);
            doc.setLineWidth(0.3);
            doc.line(margin, yPos, margin + 80, yPos); // Short underline
            yPos += 8;
        } else if (line.includes('**')) {
            // Bold bullet points (e.g., "**Step 1:** Do this")
            // Simple styling: Make the whole line bold-ish or darker
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0);
            
            // Handle long text wrapping
            const wrappedText = doc.splitTextToSize(cleanLine, maxLineWidth);
            doc.text(wrappedText, margin, yPos);
            yPos += (wrappedText.length * 6) + 2;

        } else if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
            // Standard Bullet points
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(50);
            const bulletText = `•  ${cleanLine.replace(/^[\*\-]\s*/, '')}`;
            const wrappedText = doc.splitTextToSize(bulletText, maxLineWidth);
            doc.text(wrappedText, margin + 2, yPos); // Indent slightly
            yPos += (wrappedText.length * 6) + 2;
        } else if (line.trim().length > 0) {
            // Normal Paragraph text
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(20);
            const wrappedText = doc.splitTextToSize(cleanLine, maxLineWidth);
            doc.text(wrappedText, margin, yPos);
            yPos += (wrappedText.length * 6) + 2;
        } else {
            // Empty line spacing
            yPos += 4;
        }
    });

    // --- Footer ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 290, { align: "right" });
        doc.text("Educational Use Only. Consult a Lawyer.", margin, 290);
    }

    doc.save(`${getValues('caseTitle') || 'Advocat_Case_Report'}.pdf`);
    toast.success("Formatted PDF Downloaded");
  };
  // --- END PDF GENERATION ---

  if (!isLoggedIn) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;

  return (
    <>
      <CaseResultStyling />
      <div className="min-h-screen w-full bg-gray-900 text-white py-24 pb-20">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <h1 className="text-4xl font-extrabold mb-6 text-white text-center">Civil Case Advisor</h1>
          
          {/* Progress Bar */}
          <div className="mb-8 flex justify-between text-sm text-white">
            {['Basics', 'Facts', 'Evidence', 'Analysis'].map((name, index) => (
               <div key={index} className={`flex-1 text-center ${step === index+1 ? 'text-blue-300 font-bold' : 'text-gray-500'}`}>Step {index+1}: {name}</div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-8"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(step/4)*100}%` }}></div></div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
            
            {/* STEP 1: Basics */}
            {step === 1 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <h3 className="text-2xl font-semibold border-b border-gray-600 pb-2">Step 1: Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm mb-1 block">Case Title</label>
                      <input {...register('caseTitle')} className={getInputClass('caseTitle', errors.caseTitle)} placeholder="e.g. Landlord Dispute" />
                    </div>
                    <div>
                      <label className="text-sm mb-1 block">Case Type</label>
                      <select {...register('caseType')} className={getInputClass('caseType', errors.caseType)}>
                        <option value="">Select Type</option>
                        <option value="contract">Contract</option>
                        <option value="property">Property</option>
                        <option value="family">Family</option>
                        <option value="consumer">Consumer</option>
                        <option value="tort">Tort/Civil Wrong</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm mb-1 block">Plaintiff Name</label>
                        <input {...register('plaintiffName')} placeholder="Your Name" className={getInputClass('plaintiffName', errors.plaintiffName)} />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Defendant Name</label>
                        <input {...register('defendantName')} placeholder="Opponent Name" className={getInputClass('defendantName', errors.defendantName)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select {...register('state')} className={getInputClass('state', errors.state)}>
                      <option value="">Select State</option>
                      {indianStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <input {...register('city')} placeholder="City" className={getInputClass('city', errors.city)} />
                </div>
                <button type="button" onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">Next: Facts <ArrowRight size={20}/></button>
              </div>
            )}

            {/* STEP 2: Facts */}
            {step === 2 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <h3 className="text-2xl font-semibold border-b border-gray-600 pb-2">Step 2: The Facts</h3>
                <div>
                    <label className="text-sm mb-1 block">Brief Description</label>
                    <textarea {...register('description')} rows={6} placeholder="What happened? Be specific." className={getInputClass('description', errors.description)} />
                </div>
                <div>
                    {/* REVERTED: Restored the explicit question about outcome */}
                    <label className="text-sm mb-1 block">What outcome do you want? (e.g. Compensation)</label>
                    <textarea {...register('reliefSought')} rows={2} placeholder="e.g. Recovery of 50,000 INR, Stop construction, Apology" className={getInputClass('reliefSought', errors.reliefSought)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="text-sm mb-1 block">Date of Cause (DD/MM/YYYY)</label>
                      <input type="date" lang="en-GB" {...register('causeDate')} className={getInputClass('causeDate', errors.causeDate)} />
                   </div>
                   <div>
                      <label className="text-sm mb-1 block">Suit Value (INR)</label>
                      <input value={displaySuitValue} onChange={handleSuitValueChange} placeholder="e.g. 50,000" className={getInputClass('suitValue', errors.suitValue)} />
                   </div>
                </div>
                <div>
                    <label className="text-sm mb-1 block">Prior Actions</label>
                    <textarea {...register('priorActions')} rows={2} placeholder="Did you send a legal notice?" className={getInputClass('priorActions', errors.priorActions)} />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-lg">Back</button>
                  <button type="button" onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold">Next: Evidence</button>
                </div>
              </div>
            )}

            {/* STEP 3: Evidence & Witnesses */}
            {step === 3 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-8">
                <h3 className="text-2xl font-semibold border-b border-gray-600 pb-2">Step 3: Evidence & Witnesses</h3>
                
                {/* 1. Evidence Section */}
                <div className="space-y-4">
                   <label className="block text-lg font-medium text-blue-300 border-b border-blue-900/50 pb-1">1. Physical & Electronic Evidence</label>
                   <p className="text-xs text-gray-400">
                     Upload relevant files (Photos, Videos, Contracts). 
                   </p>

                   {evidence.map((e, i) => (
                     <div key={i} className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3 relative">
                        <button type="button" onClick={() => removeEvidence(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300"><Trash2 size={18}/></button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <select {...register(`evidence.${i}.type`)} className={getInputClass(`evidence.${i}.type`, false)}>
                             <option value="documents">Document</option>
                             <option value="photos">Photo/Video</option>
                             <option value="testimony">Testimony</option>
                             <option value="other">Other</option>
                          </select>
                          
                          <div className="md:col-span-2 relative">
                             <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                   <UploadCloud size={20} />
                                   <span className="truncate max-w-[200px]">
                                     {watch(`evidence.${i}.fileName`) || "Click to attach file"}
                                   </span>
                                </div>
                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, i)} />
                             </label>
                          </div>
                        </div>

                        <textarea 
                          {...register(`evidence.${i}.description`)} 
                          placeholder="Description: What does this prove?"
                          className={getInputClass(`evidence.${i}.description`, errors.evidence?.[i]?.description)} 
                          rows={2}
                        />
                     </div>
                   ))}
                   <button type="button" onClick={addEvidence} className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-semibold">
                     <Plus size={16}/> Add Evidence Item
                   </button>
                </div>

                {/* 2. Witnesses Section */}
                <div className="space-y-4">
                   <label className="block text-lg font-medium text-blue-300 border-b border-blue-900/50 pb-1">2. Witnesses</label>
                   <p className="text-xs text-gray-400">People who can testify in court.</p>

                   {witnesses.map((w, i) => (
                     <div key={i} className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-4 relative">
                        <button type="button" onClick={() => removeWitness(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                        
                        {/* Row 1: Name */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Witness Name</label>
                            <input 
                                {...register(`witnesses.${i}.name`)} 
                                placeholder="Full Name of Witness" 
                                className={getInputClass(`witnesses.${i}.name`, errors.witnesses?.[i]?.name)} 
                            />
                        </div>

                        {/* Row 2: Connection */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Relation to You</label>
                            <input 
                                {...register(`witnesses.${i}.connection`)} 
                                placeholder="e.g. Neighbor, Colleague, Brother" 
                                className={getInputClass(`witnesses.${i}.connection`, errors.witnesses?.[i]?.connection)} 
                            />
                        </div>

                        {/* Row 3: Knowledge */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">What do they know?</label>
                            <textarea 
                                {...register(`witnesses.${i}.knowledge`)} 
                                placeholder="e.g. They saw the incident happen / They signed the contract as a witness" 
                                rows={2} 
                                className={getInputClass(`witnesses.${i}.knowledge`, errors.witnesses?.[i]?.knowledge)} 
                            />
                        </div>
                     </div>
                   ))}
                   <button type="button" onClick={addWitness} className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-semibold">
                     <Plus size={16}/> Add Witness
                   </button>
                </div>

                {/* 3. Section 65B Certificate */}
                <div className="p-5 bg-gray-800 border border-yellow-600/30 rounded-lg mt-6">
                   <div className="flex items-center gap-2 mb-2">
                      <FileText size={20} className="text-yellow-500"/>
                      <label className="font-medium text-yellow-500">Section 65B Certificate (For Electronic Evidence)</label>
                   </div>
                   
                   <div className="mb-4 text-sm text-gray-300 space-y-2">
                       <p>Under the Indian Evidence Act, electronic records (WhatsApp chats, CCTV, Emails) are <strong>inadmissible</strong> without a certificate.</p>
                       <ul className="list-disc pl-5 text-xs text-gray-400">
                           <li>If you own the device (phone/laptop), you can self-certify.</li>
                           <li>If it's from a 3rd party (Bank/Telecom), you must request it officially.</li>
                       </ul>
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Option A: Upload */}
                        <div className="w-full md:w-1/2">
                            <label className="text-xs text-gray-500 mb-1 block">Have the certificate? Upload PDF</label>
                            <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-yellow-500 hover:bg-gray-700 transition h-[50px]">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <UploadCloud size={20} />
                                    <span className="truncate max-w-[150px]">
                                        {watch('certificateFile')?.[0]?.name || "Upload Certificate (PDF)"}
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                    className="hidden" 
                                    onChange={handleCertFileChange}
                                />
                            </label>
                        </div>

                        {/* Option B: Text Input */}
                        <div className="w-full md:w-1/2">
                            <label className="text-xs text-gray-500 mb-1 block">Don't have it? Describe status.</label>
                            <input 
                                {...register('certificateStatus')} 
                                placeholder="e.g. 'I own the phone used for chats' or 'Need to apply to bank'" 
                                className={getInputClass('certificateStatus', false)} 
                            />
                        </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-lg font-semibold">Back</button>
                  <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-bold text-white shadow-lg shadow-orange-900/20">Submit & Analyze Case</button>
                </div>
              </div>
            )}

            {/* STEP 4: Result */}
            {step === 4 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                 <h3 className="text-2xl font-bold mb-4 text-white">Advocat Analysis</h3>
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 case-result-prose">
                       {isLoading ? <ChatSkeleton /> : <ReactMarkdown>{result}</ReactMarkdown>}
                    </div>
                    {/* Sidebar for Citations - WHITE BG for Contrast */}
                    <div className="w-full md:w-72 bg-white p-4 rounded-lg h-fit shadow-lg text-gray-900">
                       <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 text-lg text-gray-800">Relevant Law</h4>
                       {activeCitations.length === 0 && !isLoading && <p className="text-sm text-gray-500 italic">No specific acts cited.</p>}
                       <ul className="space-y-3 text-sm custom-scrollbar max-h-[400px] overflow-y-auto">
                         {activeCitations.map((c, i) => (
                           <li key={i} className="pb-2 border-b border-gray-100 last:border-0">
                             {c.type === 'link' ? 
                                <a href={c.href} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                    <LinkIcon size={14} className="mt-1 flex-shrink-0"/> <span>{c.title}</span>
                                </a> 
                                : 
                                <div className="flex items-start gap-2 text-gray-800">
                                    <Scale size={16} className="mt-0.5 flex-shrink-0 text-purple-600"/> 
                                    <span className="font-medium">{c.title}</span>
                                </div>
                             }
                           </li>
                         ))}
                       </ul>
                    </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
                    <button onClick={() => {setStep(1); methods.reset(); setWitnesses([]); setEvidence([]);}} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded font-semibold">Start New Analysis</button>
                    
                    {/* FIX: Use handleExportPDF which uses the already fetched 'result' string, preventing re-submission */}
                    <button onClick={handleExportPDF} disabled={!result} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded font-bold flex items-center gap-2 disabled:opacity-50"><Download size={18}/> Download PDF</button>
                 </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </>
  );
}