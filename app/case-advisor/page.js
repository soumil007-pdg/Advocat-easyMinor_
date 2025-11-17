'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf'; // For the "Plaint Kit" export
import { ChatSkeleton } from '@/app/components/SkeletonLoader';
// Updated icons
import { 
  Download, 
  BookCopy, 
  Link as LinkIcon, 
  ArrowRight, 
  Plus, 
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react';

// --- Styling component for the AI's report ---
const CaseResultStyling = () => (
  <style>{`
    .case-result-prose {
      color: #e5e7eb; /* Light gray text */
      font-size: 1rem;
      line-height: 1.7;
    }
    .case-result-prose h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #ffffff;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      padding-bottom: 0.25em;
      border-bottom: 1px solid #4b5563; /* Gray border */
    }
    .case-result-prose p {
      margin-bottom: 1em;
    }
    .case-result-prose ul {
      list-style-type: disc;
      padding-left: 1.5em;
      margin-bottom: 1em;
    }
    .case-result-prose li {
      margin-bottom: 0.5em;
    }
    .case-result-prose strong {
      font-weight: 600;
      color: #ffffff;
    }
    .case-result-prose a {
      color: #60a5fa; /* Light blue links */
      text-decoration: underline;
    }
    .case-result-prose a:hover {
      color: #93c5fd;
    }
  `}</style>
);
// --- End of styling component ---

// --- Citation Parsing Function ---
const parseCitations = (text) => {
  if (!text) return [];
  const citations = [];
  
  // Regex for links
  const linkRegex = /(https?:\/\/[^\s\)]+)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const precedingText = text.substring(Math.max(0, match.index - 10), match.index);
    if (!precedingText.endsWith('](')) {
      citations.push({ type: 'link', title: match[1], href: match[1] });
    }
  }

  // Regex for Markdown links [title](href)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    citations.push({ type: 'link', title: match[1], href: match[2] });
  }

  // Regex for legal acts (e.g., "The Copyright Act, 1957")
  const actRegex = /(The\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+Act(,\s+\d{4})?)/g;
  while ((match = actRegex.exec(text)) !== null) {
    citations.push({ type: 'act', title: match[1], href: null });
  }

  // De-duplicate
  const uniqueCitations = Array.from(new Map(citations.map(c => [c.title, c])).values());
  return uniqueCitations;
};
// --- End Citation Parsing ---

// --- ZOD SCHEMA (SHORTENED ERROR MESSAGES) ---
const schema = z.object({
  caseTitle: z.string().min(1, "Case title required"),
  plaintiffName: z.string().min(1, "Plaintiff name required"),
  defendantName: z.string().min(1, "Defendant name required"),
  caseType: z.string().min(1, "Case type required"),
  state: z.string().min(1, "State required"),
  city: z.string().min(1, "City required"),
  
  causeDate: z.string().optional(),
  description: z.string().min(10, "Description too short (min 10 chars)"),
  reliefSought: z.string().optional(), 
  suitValue: z.string().optional().refine(val => !val || /^\d+$/.test(val), "Suit value must be a number"),
  
  priorActions: z.string().optional(),
  digitalEvidence: z.string().optional(),
  urgency: z.string().optional(),
  
  witnesses: z.array(z.object({
    name: z.string().min(1, "Witness name required"),
    connection: z.string().min(1, "Connection required"),
    knowledge: z.string().min(1, "Knowledge required"),
  })).optional(),
  
  evidence: z.array(z.object({
    type: z.enum(['documents', 'photos', 'testimony', 'other']),
    description: z.string().min(1, "Description required"),
  })).optional(),
});

// --- Full list of Indian States & UTs ---
const indianStates = [
  { name: 'Andhra Pradesh', capital: 'Amaravati' },
  { name: 'Arunachal Pradesh', capital: 'Itanagar' },
  { name: 'Assam', capital: 'Dispur' },
  { name: 'Bihar', capital: 'Patna' },
  { name: 'Chhattisgarh', capital: 'Raipur' },
  { name: 'Goa', capital: 'Panaji' },
  { name: 'Gujarat', capital: 'Gandhinagar' },
  { name: 'Haryana', capital: 'Chandigarh' },
  { name: 'Himachal Pradesh', capital: 'Shimla (Summer), Dharamshala (Winter)' },
  { name: 'Jharkhand', capital: 'Ranchi' },
  { name: 'Karnataka', capital: 'Bengaluru' },
  { name: 'Kerala', capital: 'Thiruvananthapuram' },
  { name: 'Madhya Pradesh', capital: 'Bhopal' },
  { name: 'Maharashtra', capital: 'Mumbai (Summer), Nagpur (Winter)' },
  { name: 'Manipur', capital: 'Imphal' },
  { name: 'Meghalaya', capital: 'Shillong' },
  { name: 'Mizoram', capital: 'Aizawl' },
  { name: 'Nagaland', capital: 'Kohima' },
  { name: 'Odisha', capital: 'Bhubaneswar' },
  { name: 'Punjab', capital: 'Chandigarh' },
  { name: 'Rajasthan', capital: 'Jaipur' },
  { name: 'Sikkim', capital: 'Gangtok' },
  { name: 'Tamil Nadu', capital: 'Chennai' },
  { name: 'Telangana', capital: 'Hyderabad' },
  { name: 'Tripura', capital: 'Agartala' },
  { name: 'Uttar Pradesh', capital: 'Lucknow' },
  { name: 'Uttarakhand', capital: 'Bhararisain (Summer), Dehradun (Winter)' },
  { name: 'West Bengal', capital: 'Kolkata' },
  { name: 'Andaman and Nicobar Islands', capital: 'Port Blair' },
  { name: 'Chandigarh', capital: 'Chandigarh' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman' },
  { name: 'Delhi', capital: 'New Delhi' },
  { name: 'Jammu and Kashmir', capital: 'Srinagar (Summer), Jammu (Winter)' },
  { name: 'Lakshadweep', capital: 'Kavaratti' },
  { name: 'Puducherry', capital: 'Pondicherry' }
];

export default function CaseAdvisor() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState(1);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedTokens, setSavedTokens] = useState(0);
  const [witnesses, setWitnesses] = useState([]); 
  const [evidence, setEvidence] = useState([]);
  const router = useRouter();

  // --- Refs Sidebar State ---
  const [isRefsOpen, setIsRefsOpen] = useState(true);
  const [activeCitations, setActiveCitations] = useState([]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      caseTitle: '', plaintiffName: '', defendantName: '', caseType: '', state: '', city: '',
      causeDate: '', description: '', reliefSought: '', suitValue: '',
      priorActions: '', digitalEvidence: '', urgency: '',
      witnesses: [],
      evidence: [],
    },
  });
  
  // --- *** MODIFICATION #1: ADDED dirtyFields *** ---
  const { 
    register, 
    handleSubmit, 
    formState: { errors, dirtyFields }, // <-- Added dirtyFields
    watch, 
    getValues, 
    setValue, 
    trigger 
  } = methods;

  // --- SUIT VALUE FORMATTING ---
  const formatToIndian = (val) => {
    if (!val) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-IN').format(num);
  }
  const watchedSuitValue = watch('suitValue');
  const [displaySuitValue, setDisplaySuitValue] = useState(() => 
    formatToIndian(watchedSuitValue)
  );
  const handleSuitValueChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Get only numbers
    if (rawValue.length > 15) return; // Limit length
    setValue('suitValue', rawValue, { shouldValidate: true }); // Update RHF
    setDisplaySuitValue(formatToIndian(rawValue)); // Update visual state
  }
  // --- END SUIT VALUE FORMATTING ---

  // --- Dynamic Array Functions ---
  const addWitness = () => {
    const newWitness = { name: '', connection: '', knowledge: '' };
    const currentWitnesses = getValues('witnesses') || [];
    setValue('witnesses', [...currentWitnesses, newWitness]);
    setWitnesses([...currentWitnesses, newWitness]);
  };
  const removeWitness = (index) => {
    const currentWitnesses = getValues('witnesses') || [];
    const updated = currentWitnesses.filter((_, i) => i !== index);
    setValue('witnesses', updated);
    setWitnesses(updated);
  };
  const handleWitnessChange = (index, field, value) => {
    const currentWitnesses = getValues('witnesses') || [];
    const updated = [...currentWitnesses];
    updated[index][field] = value;
    setValue('witnesses', updated);
    setWitnesses(updated);
  };
  const addEvidence = () => {
    const newEvidence = { type: 'documents', description: '' };
    const currentEvidence = getValues('evidence') || [];
    setValue('evidence', [...currentEvidence, newEvidence]);
    setEvidence([...currentEvidence, newEvidence]);
  };
  const removeEvidence = (index) => {
    const currentEvidence = getValues('evidence') || [];
    const updated = currentEvidence.filter((_, i) => i !== index);
    setValue('evidence', updated);
    setEvidence(updated);
  };
  const handleEvidenceChange = (index, field, value) => {
    const currentEvidence = getValues('evidence') || [];
    const updated = [...currentEvidence];
    updated[index][field] = value;
    setValue('evidence', updated);
    setEvidence(updated);
  };
  // --- End Dynamic Array Functions ---

  // --- Session Validation (CLEANED - REMOVED DUPLICATE LOGIC) ---
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        router.push('/auth');
        return;
      }
      try {
        const res = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.isValid) {
          setIsLoggedIn(true);
          setUserEmail(data.email);
        } else {
          localStorage.removeItem('sessionToken');
          router.push('/auth');
        }
      } catch (err) {
        localStorage.removeItem('sessionToken');
        router.push('/auth');
      }
    };
    validateSession();
  }, [router]);
  // --- End Session Validation ---

  // --- onSubmit ---
  const onSubmit = async (data) => {
    setIsLoading(true);
    setResult('');
    setActiveCitations([]); 
    setStep(4); 
    
    try {
      const res = await fetch('/api/case-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), 
      });
      const apiData = await res.json();
      if (res.ok) {
        setResult(apiData.text);
        const citations = parseCitations(apiData.text);
        setActiveCitations(citations);
        const actsFound = citations.filter(c => c.type === 'act').length;
        
        if (actsFound > 0) {
          toast.success(`Analysis complete! Found ${actsFound} relevant legal acts.`);
        } else {
          toast.success(`Analysis complete!`);
        }
      } else {
        toast.error(apiData.message || 'Analysis failed. Please try again.');
        setStep(3); 
      }
    } catch (err) {
      toast.error('Connection issue. Please check your network and retry.');
      setStep(3);
    }
    setIsLoading(false);
  };
  // --- End onSubmit ---

  // --- Step Navigation (ADDED TOOLTIPS) ---
  const nextStep = async () => {
    let fieldsToValidate;
    if (step === 1) {
      fieldsToValidate = ['caseTitle', 'plaintiffName', 'defendantName', 'caseType', 'state', 'city'];
    } else if (step === 2) {
      fieldsToValidate = ['description'];
    } else {
      setStep(s => s + 1);
      return;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    } else {
      toast.error('Please fill in all required fields for this step.');
    }
  };

  const prevStep = () => {
    setStep(s => s - 1);
  };
  // --- End Step Navigation ---

  // --- PDF Export Function (RENAMED BUTTON TEXT) ---
  const handleExportPDF = () => {
    const formData = getValues();
    const aiResponse = result;
    
    try {
      const doc = new jsPDF();
      let yPos = 20; 

      doc.setFontSize(18);
      doc.text("Advocat-Easy: Your Rights Report", 105, yPos, { align: 'center' }); // UPDATED: More user-friendly title
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Analysis for Case: ${formData.caseTitle}`, 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(14);
      doc.text("Case Summary (Your Inputs)", 14, yPos);
      yPos += 8;

      const addRow = (title, value) => {
        if (!value) return; 
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${title}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(value, 150), 60, yPos); 
        const textHeight = doc.getTextDimensions(doc.splitTextToSize(value, 150)).h;
        yPos += Math.max(10, textHeight + 2); 
      };

      addRow("Case Title", formData.caseTitle);
      addRow("Plaintiff", formData.plaintiffName);
      addRow("Defendant", formData.defendantName);
      addRow("Case Type", formData.caseType);
      addRow("State", `${formData.state} (${formData.city})`);
      addRow("Suit Value (INR)", formData.suitValue);
      addRow("Date of Cause", formData.causeDate);
      addRow("Description", formData.description);
      addRow("Relief Sought", formData.reliefSought);
      addRow("Prior Actions", formData.priorActions);
      addRow("Urgency", formData.urgency);
      
      if (formData.witnesses && formData.witnesses.length > 0) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text("Witnesses:", 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        formData.witnesses.forEach((w, i) => {
          doc.text(`- Witness ${i+1}: ${w.name} (${w.connection})`, 25, yPos);
          yPos += 5;
          doc.text(`  Knowledge: ${doc.splitTextToSize(w.knowledge, 140)}`, 30, yPos);
          yPos += doc.getTextDimensions(doc.splitTextToSize(w.knowledge, 140)).h + 5;
        });
      }

      if (formData.evidence && formData.evidence.length > 0) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text("Evidence:", 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        formData.evidence.forEach((e, i) => {
          doc.text(`- Item ${i+1} (${e.type}): ${doc.splitTextToSize(e.description, 140)}`, 25, yPos);
          yPos += doc.getTextDimensions(doc.splitTextToSize(e.description, 140)).h + 5;
        });
      }

      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.text("AI Educational Analysis", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const aiTextLines = doc.splitTextToSize(aiResponse, 180);
      doc.text(aiTextLines, 14, yPos);
      
      const fileName = `${formData.caseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'advocat_rights_report'}.pdf`; // UPDATED: File name
      doc.save(fileName);
      
      toast.success("Rights Report PDF exported!");

    } catch (err) {
      console.error("PDF Export failed:", err);
      toast.error("PDF export failed. See console for details.");
    }
  };
  // --- End PDF Export ---

  // Refs Toggle
  const toggleRefs = () => {
    setIsRefsOpen(!isRefsOpen);
  };

  // --- *** MODIFICATION #2: UPDATED STYLES *** ---
  const inputClasses = "w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorInputClasses = "w-full p-3 border border-red-500 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500";
  // This is the new style for the "wow" effect
  const successInputClasses = "w-full p-3 border border-green-500 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500";
  // --- End UI/UX FIX ---

  if (!isLoggedIn) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;

  return (
    <>
      <CaseResultStyling />
      <div className="min-h-screen w-full bg-gray-900 text-white py-24 pb-20">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <h1 className="text-4xl font-extrabold mb-6 text-white text-center">Civil Case Advisor</h1>
          <p className="mb-6 text-lg text-gray-300 text-center">Welcome, {userEmail}. Let's build your case for a precise educational analysis.</p>

        {/* Progress Bar (ADDED TOOLTIPS) */}
        <div className="mb-8 flex justify-between text-sm text-white">
          {['Basics', 'Facts', 'Evidence', 'Analysis'].map((name, index) => {
             const s = index + 1;
             let stateClass = 'text-gray-400';
             if (step === s) stateClass = 'text-blue-300 font-semibold';
             if (step > s) stateClass = 'text-green-300';
             return (
              <div key={s} className={`flex-1 text-center ${stateClass} transition-colors`} title={`Step ${s}: ${name} - ${step === s ? 'Current' : step > s ? 'Completed' : 'Upcoming'}`}>
                Step {s}: {name}
              </div>
             );
          })}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(step / 4) * 100}%`, transition: 'width 0.3s' }}></div>
        </div>

        {/* --- *** ENTIRE STEP 1 BLOCK IS REPLACED *** --- */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-white">
          {/* --- STEP 1: Basic Details --- */}
          {step === 1 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
              <h3 className="text-white text-2xl font-semibold border-b border-gray-600 pb-2">Step 1: Basic Details</h3>
              
              {/* --- NEW: Fieldset for Case Details --- */}
              <fieldset className="border border-gray-700 rounded-lg p-4 pt-2 space-y-4">
                <legend className="text-sm font-medium text-gray-300 px-2">Case Details</legend>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Case Title</label>
                  <input 
                    {...register('caseTitle')} 
                    placeholder="e.g., 'Tenant Dispute for Unpaid Rent'" 
                    className={errors.caseTitle ? errorInputClasses : (dirtyFields.caseTitle ? successInputClasses : inputClasses)} 
                  />
                  {errors.caseTitle && <p className="text-red-400 text-sm mt-1">{errors.caseTitle.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Case Type</label>
                  <select 
                    {...register('caseType')} 
                    className={errors.caseType ? errorInputClasses : (dirtyFields.caseType ? successInputClasses : inputClasses)}
                  >
                    <option value="">Select Type</option>
                    <option value="contract">Contract Dispute</option>
                    <option value="tort">Tort/Negligence</option>
                    <option value="property">Property Dispute</option>
                    <option value="family">Family Matter</option>
                    <option value="debt">Debt Recovery</option>
                    <option value="cheque-bounce">Cheque Bounce (NI Act)</option>
                    <option value="consumer">Consumer Dispute</option>
                    <option value="other">Other Civil Matter</option>
                  </select>
                  {errors.caseType && <p className="text-red-400 text-sm mt-1">{errors.caseType.message}</p>}
                </div>
              </fieldset>

              {/* --- NEW: Fieldset for Participant Details --- */}
              <fieldset className="border border-gray-700 rounded-lg p-4 pt-2 space-y-4">
                <legend className="text-sm font-medium text-gray-300 px-2">Participant & Jurisdiction</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Plaintiff Name</label>
                    <input 
                      {...register('plaintiffName')} 
                      placeholder="Your Full Name"
                      className={errors.plaintiffName ? errorInputClasses : (dirtyFields.plaintiffName ? successInputClasses : inputClasses)} 
                    />
                    {errors.plaintiffName && <p className="text-red-400 text-sm mt-1">{errors.plaintiffName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Defendant Name</label>
                    <input 
                      {...register('defendantName')} 
                      placeholder="Opposing Party's Name"
                      className={errors.defendantName ? errorInputClasses : (dirtyFields.defendantName ? successInputClasses : inputClasses)} 
                    />
                    {errors.defendantName && <p className="text-red-400 text-sm mt-1">{errors.defendantName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">State / UT</label>
                    <select 
                      {...register('state')} 
                      className={errors.state ? errorInputClasses : (dirtyFields.state ? successInputClasses : inputClasses)}
                    >
                      <option value="">Select State/UT</option>
                      {indianStates.map(state => <option key={state.name} value={state.name}>{state.name}</option>)}
                    </select>
                    {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input 
                      {...register('city')} 
                      placeholder="e.g., New Delhi" 
                      className={errors.city ? errorInputClasses : (dirtyFields.city ? successInputClasses : inputClasses)} 
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>}
                  </div>
                </div>
              </fieldset>

              <button type="button" onClick={nextStep} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2" title="Proceed to Case Facts">
                Next: Case Facts <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* --- STEP 2: Case Facts (Applying "Wow" Effect) --- */}
          {step === 2 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
              <h3 className="text-white text-2xl font-semibold border-b border-gray-600 pb-2">Step 2: Case Facts</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Brief Description of Facts</label>
                <textarea 
                  {...register('description')} 
                  placeholder="Describe what happened, in order. Be clear and objective." 
                  rows={5} 
                  className={errors.description ? errorInputClasses : (dirtyFields.description ? successInputClasses : inputClasses)} 
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Relief Sought (What do you want the court to do?)</label>
                <textarea 
                  {...register('reliefSought')} 
                  placeholder="e.g., '1. Recovery of INR 50,000. 2. Compensation for mental harassment. 3. Injunction to stop the defendant from...'" 
                  rows={3} 
                  className={errors.reliefSought ? errorInputClasses : (dirtyFields.reliefSought ? successInputClasses : inputClasses)} 
                />
                <p className="text-gray-400 text-xs mt-1">Tip: Be as specific as possible. This is optional but helps the AI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Cause of Action (Optional)</label>
                  <input 
                    type="date" 
                    {...register('causeDate')} 
                    className={errors.causeDate ? errorInputClasses : (dirtyFields.causeDate ? successInputClasses : inputClasses)} 
                    max={new Date().toISOString().split('T')[0]} 
                  />
                  <p className="text-gray-400 text-xs mt-1">When did the main issue (e.g., non-payment) happen?</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Suit Value (INR) (Optional)</label>
                  <input 
                    value={displaySuitValue}
                    onChange={handleSuitValueChange}
                    placeholder="e.g., 50,000" 
                    className={errors.suitValue ? errorInputClasses : (dirtyFields.suitValue ? successInputClasses : inputClasses)} 
                    name="suitValue" 
                  />
                  {errors.suitValue && <p className="text-red-400 text-sm mt-1">{errors.suitValue.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prior Actions Taken (Optional)</label>
                <textarea 
                  {...register('priorActions')} 
                  placeholder="e.g., 'Sent a formal legal notice on [date]', 'Had multiple phone calls', 'Sent warning emails'" 
                  rows={2} 
                  className={errors.priorActions ? errorInputClasses : (dirtyFields.priorActions ? successInputClasses : inputClasses)} 
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition font-semibold" title="Go back to Basic Details">
                  Back
                </button>
                <button type="button" onClick={nextStep} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2" title="Proceed to Evidence">
                  Next: Evidence <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 3: Evidence & Witnesses (Applying "Wow" Effect) --- */}
          {step === 3 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
              <h3 className="text-white text-2xl font-semibold border-b border-gray-600 pb-2">Step 3: Evidence & Witnesses</h3>

              {/* Witnesses Dynamic Form */}
              <div>
                <label className="block text-sm font-medium mb-2">Key Witnesses (Optional)</label>
                {witnesses.map((w, i) => (
                  <div key={i} className="border border-gray-600 p-3 rounded-lg mb-3 bg-gray-900/50 space-y-2">
                    <input 
                      {...register(`witnesses.${i}.name`)}
                      placeholder="Witness Name" 
                      className={`${inputClasses} mb-1`} // Note: "wow" effect is harder on dynamic fields, keeping default
                    />
                    <input 
                      {...register(`witnesses.${i}.connection`)}
                      placeholder="Connection to case (e.g., neighbor, employee)" 
                      className={`${inputClasses} mb-1`} 
                    />
                    <textarea 
                      {...register(`witnesses.${i}.knowledge`)}
                      placeholder="What they know (e.g., 'Saw the incident', 'Was present during contract signing')" 
                      rows={2}
                      className={inputClasses} 
                    />
                    <button type="button" onClick={() => removeWitness(i)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm">
                      <Trash2 size={16} /> Remove Witness
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addWitness} className="flex items-center gap-2 text-blue-300 hover:text-blue-200 font-medium">
                  <Plus size={18} /> Add Witness
                </button>
              </div>

              {/* Evidence Dynamic Form */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Evidence Available (Optional)</label>
                {evidence.map((e, i) => (
                  <div key={i} className="border border-gray-600 p-3 rounded-lg mb-3 bg-gray-900/50 space-y-2">
                    <select 
                      {...register(`evidence.${i}.type`)}
                      className={`${inputClasses} mb-1`}
                    >
                      <option value="documents">Documents</option>
                      <option value="photos">Photos / Videos</option>
                      <option value="testimony">Testimony (self or other)</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea 
                      {...register(`evidence.${i}.description`)}
                      placeholder="Description (e.g., 'Signed rent agreement', 'Photos of the leaking roof')" 
                      rows={2} 
                      className={inputClasses} 
                    />
                    <button type="button" onClick={() => removeEvidence(i)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm">
                      <Trash2 size={16} /> Remove Evidence
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addEvidence} className="flex items-center gap-2 text-blue-300 hover:text-blue-200 font-medium">
                  <Plus size={18} /> Add Evidence
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Urgency/Timeline? (Optional)</label>
                  <input 
                    {...register('urgency')} 
                    placeholder="e.g., 'Eviction notice by Dec 1st'" 
                    className={errors.urgency ? errorInputClasses : (dirtyFields.urgency ? successInputClasses : inputClasses)} 
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium mb-2">Digital Evidence Status (Optional)</label>
                  <input 
                    {...register('digitalEvidence')} 
                    placeholder="e.g., 'All docs scanned as PDF'" 
                    className={errors.digitalEvidence ? errorInputClasses : (dirtyFields.digitalEvidence ? successInputClasses : inputClasses)} 
                  />
                  <p className="text-gray-400 text-xs mt-1">Helps AI check for IT Act, 2000 relevance.</p>
                </div>
              </div>


              <div className="flex gap-4 mt-6">
                <button type="button" onClick={prevStep} className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition font-semibold" title="Go back to Case Facts">
                  Back
                </button>
                <button type="submit" className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition font-semibold" disabled={isLoading} title="Submit for AI analysis">
                  {isLoading ? 'Analyzing...' : 'Submit & Analyze Case'}
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 4: Analysis & Result (NEW 2-Panel Layout) --- */}
          {step === 4 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                <h3 className="text-white text-2xl font-semibold">Step 4: Analysis</h3>
                <button
                  onClick={toggleRefs}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                  title={isRefsOpen ? "Hide references" : "Show references"}
                >
                  {isRefsOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row -mx-4">
                
                {/* --- Main Analysis Panel --- */}
                <div className="flex-1 px-4 overflow-y-auto" style={{maxHeight: '70vh'}}>
                  {/* Summary of Inputs */}
                  <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-3">Your Case Summary:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p><strong>Case Type:</strong> {watch('caseType')}</p>
                      <p><strong>Suit Value:</strong> {displaySuitValue ? `₹${displaySuitValue}` : 'N/A'}</p>
                      <p><strong>State:</strong> {watch('state')} ({watch('city')})</p>
                      <p><strong>Prior Actions:</strong> {watch('priorActions') || 'None listed'}</p>
                      <p><strong>Witnesses:</strong> {watch('witnesses')?.length || 0} added</p>
                      <p><strong>Evidence:</strong> {watch('evidence')?.length || 0} items</p>
                    </div>
                  </div>

                  {/* ====================================================
                    === THIS IS THE CORRECTED CODE FOR SKELETON      ===
                    ====================================================
                  */}
                  {isLoading && (
                    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
                      <AnalysisSkeleton />
                    </div>
                  )}

                  {result && !isLoading && (
                    <div className="case-result-prose max-w-none">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  )}
                  {/* === END OF CORRECTION === */}

                </div>

                {/* --- Refs Sidebar --- */}
                <div 
                  className={`w-full md:w-72 flex-shrink-0 px-4 space-y-4 overflow-y-auto border-l-0 md:border-l border-gray-700 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 ${
                    isRefsOpen ? 'block' : 'hidden'
                  }`}
                  style={{maxHeight: '70vh'}}
                >
                  <h4 className="text-lg font-semibold text-white">References & Citations</h4>
                  {activeCitations.length === 0 && !isLoading ? (
                    <p className="text-sm text-gray-400 italic">
                      {result ? "No specific legal acts or links were cited in this analysis." : "Citations will appear here after analysis."}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {activeCitations.map((ref, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div>
                            {ref.type === 'link' ? (
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
                                <LinkIcon size={14} />
                              </span>
                            ) : (
                              <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex-shrink-0">
                                <BookCopy size={14} />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {ref.href ? (
                              <a
                                href={ref.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline break-words"
                                title={ref.title}
                              >
                                {ref.title}
                              </a>
                            ) : (
                              <span className="text-sm font-medium text-gray-300 break-words" title={ref.title}>
                                {ref.title}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* --- Action Buttons (UPDATED BUTTON TEXT) --- */}
              <div className="flex flex-col md:flex-row gap-4 mt-8 border-t border-gray-700 pt-6">
                <button type="button" onClick={() => { 
                  methods.reset(); 
                  setStep(1); 
                  setWitnesses([]); 
                  setEvidence([]); 
                  setResult(''); 
                  setIsLoading(false); 
                  setActiveCitations([]);
                  setDisplaySuitValue(''); // Reset formatted value
                }} className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition font-semibold" title="Reset and start a new case analysis">
                  Start New Analysis
                </button>
                
                <button 
                  onClick={handleExportPDF}
                  disabled={!result || isLoading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50" title="Export analysis as PDF report"
                >
                  <Download size={18} />
                  Download Your Rights Report (PDF)
                </button>
              </div>
            </div>
          )}
        </form>
        </div>
      </div>
    </>
  );
}