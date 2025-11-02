'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown'; 

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
  const [selectedState, setSelectedState] = useState('');
  const [formData, setFormData] = useState({
    caseTitle: '',
    plaintiffName: '',
    defendantName: '',
    caseType: '',
    causeDate: '',
    description: '',
    reliefSought: '',
    suitValue: '',
    witnesses: '',
    evidence: '',
    state: '',
    city: ''
  });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setFormData({ ...formData, state: e.target.value });
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      const res = await fetch('/api/case-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), 
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.text);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err) {
      toast.error("Sorry, I'm having trouble connecting right now. Please try again later.");
      console.error('Case Advisor error:', err);
    }
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;
  }

  const inputClasses = "w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen my-24 pb-20 p-8 bg-cover bg-top-right bg-no-repeat relative" style={{
      backgroundImage: `url(${'/pic2.jpeg'})`
    }}>
      <div className="max-w-4xl mx-auto text-center rounded-xl p-8 relative z-10 
                      bg-black bg-opacity-50 backdrop-blur-md border border-gray-700 shadow-2xl">
        
        <h1 className="text-4xl font-extrabold mb-6 text-white">Civil Case Advisor</h1>
        <p className="mb-6 text-lg text-white">Welcome, {userEmail}. Enter details to get <span className='text-blue-200 font-semibold'>educational</span> legal advice via a personalized and dedicated AI-bot</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (all your form inputs) ... */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Case Title</label>
            <input type="text" name="caseTitle" value={formData.caseTitle} onChange={handleChange} className={inputClasses} required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">Plaintiff Name</label>
              <input type="text" name="plaintiffName" value={formData.plaintiffName} onChange={handleChange} className={inputClasses} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">Defendant Name</label>
              <input type="text" name="defendantName" value={formData.defendantName} onChange={handleChange} className={inputClasses} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">Case Type</label>
              <select name="caseType" value={formData.caseType} onChange={handleChange} className={`${inputClasses} text-black`} required>
                <option value="">Select Type</option>
                <option value="contract">Contract Dispute</option>
                <option value="tort">Tort/Negligence</option>
                <option value="property">Property Dispute</option>
                <option value="family">Family Matter</option>
                <option value="debt">Debt Recovery</option>
                <option value="cheque-bounce">Cheque Bounce</option>
                <option value="consumer">Consumer Dispute</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">Date of Cause of Action</label>
              <input 
                type="date" 
                name="causeDate" 
                value={formData.causeDate} 
                onChange={handleChange} 
                className={inputClasses} 
                max={today}
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Brief Description of Facts</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className={inputClasses} rows="4" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Relief Sought</label>
            <textarea name="reliefSought" value={formData.reliefSought} onChange={handleChange} className={inputClasses} rows="3" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">Jurisdiction - State/UT</label>
              <select value={selectedState} onChange={handleStateChange} className={`${inputClasses} text-black`} required>
                <option value="">Select State/UT</option>
                {indianStates.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name} ({state.capital})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white text-left">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClasses} placeholder="e.g., Mumbai" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Estimated Suit Value (INR)</label>
            <input type="number" name="suitValue" value={formData.suitValue} onChange={handleChange} className={inputClasses} min="0" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Key Witnesses</label>
            <textarea name="witnesses" value={formData.witnesses} onChange={handleChange} className={inputClasses} rows="2" placeholder="Names and brief roles" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white text-left">Evidence Available</label>
            <textarea name="evidence" value={formData.evidence} onChange={handleChange} className={inputClasses} rows="3" placeholder="List documents, photos, contracts, etc." />
          </div>


          <button 
            type="submit" 
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 cursor-pointer transition font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Submit for Educational Advice'}
          </button>
        </form>

        {isLoading && (
          <div className="mt-8 p-6 bg-gray-900 bg-opacity-70 backdrop-blur-md border border-gray-600 rounded-lg shadow-lg 
                          text-white text-base leading-relaxed">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Analyzing...
            </h2>
            <p className="text-gray-200 text-center">
              Please wait while I review your case details. This may take a moment.
            </p>
          </div>
        )}

        {result && (
          <div 
            className="mt-8 p-6 bg-gray-900 bg-opacity-70 backdrop-blur-md border border-gray-600 rounded-lg shadow-lg text-left 
                          text-gray-200 text-base leading-relaxed"
          >
            {/* --- THIS IS THE FIX --- */}
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>
                {result}
              </ReactMarkdown>
            </div>
            {/* --- END OF FIX --- */}
          </div>
        )}

      </div>
    </div>
  );
}