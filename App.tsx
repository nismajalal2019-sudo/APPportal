
import React, { useState, useEffect } from 'react';
import { User, UserRole, Inquiry, InquiryStatus, InquiryItem } from './types';
import { MASTER_ITEMS, CUSTOMER_ACCOUNTS, ENGINEERS } from './constants';
import InquiryDetails from './components/InquiryDetails';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState("");
  const [isAuthLogin, setIsAuthLogin] = useState(true);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Inquiry Form State
  const [newInquiry, setNewInquiry] = useState<{
    custId: string;
    custName: string;
    engineer: string;
    items: InquiryItem[];
  }>({
    custId: "",
    custName: "",
    engineer: "",
    items: [{ code: "", desc: "", qty: 1, unit: "Pcs", landedCost: 0, unitPrice: 0, delivery: "TBA" }]
  });

  useEffect(() => {
    const savedInqs = localStorage.getItem('memf_inqs_v10');
    if (savedInqs) setInquiries(JSON.parse(savedInqs));
  }, []);

  const saveInqs = (newInqs: Inquiry[]) => {
    setInquiries(newInqs);
    localStorage.setItem('memf_inqs_v10', JSON.stringify(newInqs));
  };

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const pass = formData.get('pass') as string;
    const role = formData.get('role') as UserRole;

    if (isAuthLogin) {
      // Mock login check
      const users = JSON.parse(localStorage.getItem('memf_users_v10') || '[]');
      const u = users.find((x: any) => x.email === email && x.pass === pass);
      if (u) setUser(u);
      else alert("Invalid credentials");
    } else {
      const users = JSON.parse(localStorage.getItem('memf_users_v10') || '[]');
      const newUser = { name, email, pass, role };
      users.push(newUser);
      localStorage.setItem('memf_users_v10', JSON.stringify(users));
      alert("Registered successfully!");
      setIsAuthLogin(true);
    }
  };

  const handleCreateInquiry = () => {
    if (!newInquiry.custName || !newInquiry.engineer) return alert("Missing client or engineer information");
    const id = `03/INQ/26/${String(inquiries.length + 1).padStart(5, '0')}`;
    const entry: Inquiry = {
      id,
      custName: newInquiry.custName,
      custId: newInquiry.custId,
      items: newInquiry.items,
      status: InquiryStatus.Engineering,
      assignedEng: newInquiry.engineer,
      docs: [],
      ownerEmail: user!.email,
      timestamp: new Date().toISOString()
    };
    saveInqs([entry, ...inquiries]);
    setShowCreateModal(false);
    setNewInquiry({
      custId: "",
      custName: "",
      engineer: "",
      items: [{ code: "", desc: "", qty: 1, unit: "Pcs", landedCost: 0, unitPrice: 0, delivery: "TBA" }]
    });
  };

  const addItemRow = () => {
    setNewInquiry({
      ...newInquiry,
      items: [...newInquiry.items, { code: "", desc: "", qty: 1, unit: "Pcs", landedCost: 0, unitPrice: 0, delivery: "TBA" }]
    });
  };

  const updateItem = (idx: number, field: keyof InquiryItem, value: any) => {
    const nextItems = [...newInquiry.items];
    nextItems[idx] = { ...nextItems[idx], [field]: value };
    
    // Auto-fill description if code matches
    if (field === 'code') {
      const match = MASTER_ITEMS.find(m => m.code === value);
      if (match) nextItems[idx].desc = match.desc;
    }
    
    setNewInquiry({ ...newInquiry, items: nextItems });
  };

  const filteredInquiries = inquiries.filter(i => {
    if (user?.role === UserRole.Sales && i.ownerEmail !== user.email) return false;
    if (user?.role === UserRole.Engineering && i.assignedEng.toLowerCase() !== user.name.toLowerCase()) return false;
    const q = search.toLowerCase();
    return i.id.toLowerCase().includes(q) || i.custName.toLowerCase().includes(q);
  });

  const exportExcel = () => {
    const data = inquiries.map(i => ({ 
      Reference: i.id, 
      Client: i.custName, 
      Status: i.status,
      Engineer: i.assignedEng,
      Value: i.items.reduce((s, it) => s + (it.qty * (it.unitPrice || 0)), 0)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portal_Data");
    XLSX.writeFile(wb, `MEMF_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 w-full max-w-md">
          <div className="flex border-b mb-8 text-center text-sm">
            <button 
              onClick={() => setIsAuthLogin(true)} 
              className={`flex-1 pb-4 font-black uppercase transition ${isAuthLogin ? 'text-[#002e5d] border-b-4 border-[#002e5d]' : 'text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsAuthLogin(false)} 
              className={`flex-1 pb-4 font-black uppercase transition ${!isAuthLogin ? 'text-[#002e5d] border-b-4 border-[#002e5d]' : 'text-slate-300'}`}
            >
              Register
            </button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isAuthLogin && (
              <input name="name" type="text" placeholder="Full Name" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#002e5d]" />
            )}
            <input name="email" type="email" placeholder="Work Email" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#002e5d]" />
            <input name="pass" type="password" placeholder="Password" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#002e5d]" />
            {!isAuthLogin && (
              <select name="role" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold">
                <option value={UserRole.Sales}>Sales Team</option>
                <option value={UserRole.Engineering}>Product Engineering</option>
                <option value={UserRole.Planning}>Planning Team</option>
              </select>
            )}
            <button className="w-full bg-[#002e5d] text-white py-4 rounded-2xl font-black shadow-lg transform active:scale-95 transition">
              {isAuthLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeInquiry = inquiries.find(i => i.id === selectedInquiryId);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#002e5d] text-white p-4 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded">
              <span className="text-[#002e5d] font-black text-xl px-2">MEMF</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-widest leading-none">MEMF INDUSTRIES</h1>
              <span className="text-[9px] opacity-70 uppercase">Portal v10.0</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold border-r border-blue-400 pr-6 hidden sm:inline">
              {user.name} <span className="text-[10px] opacity-60 ml-1">[{user.role}]</span>
            </span>
            <button 
              onClick={() => setUser(null)} 
              className="text-[10px] bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-black uppercase tracking-wider transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 lg:p-8 flex-1">
        {/* Statistics Dashboard */}
        {user.role === UserRole.Planning && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-l-[12px] border-emerald-500">
              <p className="text-[10px] font-black text-slate-400 uppercase">Confirmed Revenue</p>
              <h3 className="text-3xl font-black">
                SAR {inquiries.filter(i => i.status === InquiryStatus.Accepted).reduce((acc, i) => acc + i.items.reduce((s, it) => s + (it.qty * (it.unitPrice || 0)), 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-l-[12px] border-orange-500">
              <p className="text-[10px] font-black text-slate-400 uppercase">In-Progress</p>
              <h3 className="text-3xl font-black">
                {inquiries.filter(i => i.status !== InquiryStatus.Accepted && i.status !== InquiryStatus.Rejected).length}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-l-[12px] border-slate-900">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Volume</p>
              <h3 className="text-3xl font-black">{inquiries.length}</h3>
            </div>
          </section>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <input 
              type="text" 
              placeholder="Search by Reference or Client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 p-4 border rounded-2xl shadow-sm outline-none bg-white focus:ring-2 focus:ring-[#002e5d]"
            />
            <button 
              onClick={exportExcel}
              className="bg-green-700 text-white px-6 py-4 rounded-2xl font-bold text-xs hover:bg-green-800 transition"
            >
              EXPORT
            </button>
          </div>
          {user.role === UserRole.Sales && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-[#002e5d] text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition"
            >
              + NEW INQUIRY
            </button>
          )}
        </div>

        {/* Inquiries Table */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black border-b">
                <tr>
                  <th className="p-5">Inquiry Ref</th>
                  <th className="p-5">Client</th>
                  <th className="p-5">Engineer</th>
                  <th className="p-5 text-center">Current Phase</th>
                  <th className="p-5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs font-medium">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">No inquiries found matching your criteria.</td>
                  </tr>
                ) : filteredInquiries.map(inq => (
                  <tr key={inq.id} className="hover:bg-slate-50 transition group">
                    <td className="p-5 font-mono font-black text-blue-900">{inq.id}</td>
                    <td className="p-5 font-bold text-slate-700">{inq.custName}</td>
                    <td className="p-5 text-orange-600 font-bold">{inq.assignedEng}</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        inq.status === InquiryStatus.Accepted ? 'bg-emerald-100 text-emerald-700' :
                        inq.status === InquiryStatus.Rejected ? 'bg-red-100 text-red-700' :
                        inq.status === InquiryStatus.Planning ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => setSelectedInquiryId(inq.id)} 
                        className="bg-[#002e5d] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase group-hover:scale-105 transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {activeInquiry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-50 w-full max-w-5xl rounded-[40px] p-6 lg:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <InquiryDetails 
              inquiry={activeInquiry} 
              user={user} 
              onClose={() => setSelectedInquiryId(null)}
              onUpdate={(updated) => {
                const next = inquiries.map(i => i.id === updated.id ? updated : i);
                saveInqs(next);
              }}
            />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col rounded-[40px] shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-[#002e5d] text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Inquiry Registration</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-5xl font-light hover:text-red-400 transition">&times;</button>
            </div>
            <div className="p-10 overflow-y-auto flex-1 bg-slate-50 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="text-xs font-black text-slate-400 block mb-2">CUSTOMER ACCOUNT</label>
                  <select 
                    value={newInquiry.custId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = CUSTOMER_ACCOUNTS.find(c => c.id === id)?.name || "";
                      setNewInquiry({ ...newInquiry, custId: id, custName: name === "OTHER (Add Manually)" ? "" : name });
                    }}
                    className="w-full p-4 border rounded-2xl font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Account --</option>
                    {CUSTOMER_ACCOUNTS.map(c => <option key={c.id} value={c.id}>{c.id} | {c.name.slice(0, 15)}...</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 block mb-2">FULL COMPANY NAME</label>
                  <input 
                    type="text" 
                    placeholder="Customer Name"
                    value={newInquiry.custName}
                    onChange={(e) => setNewInquiry({ ...newInquiry, custName: e.target.value })}
                    className="w-full p-4 border rounded-2xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-blue-600 block mb-2 uppercase tracking-widest">Assigned Engineer</label>
                  <select 
                    value={newInquiry.engineer}
                    onChange={(e) => setNewInquiry({ ...newInquiry, engineer: e.target.value })}
                    className="w-full p-4 border-2 border-blue-200 rounded-2xl font-bold bg-white text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Name --</option>
                    {ENGINEERS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-4 text-left">Item Code</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 w-28 text-center">Qty</th>
                      <th className="p-4 w-28">Unit</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {newInquiry.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-4">
                          <input 
                            list="master-items"
                            value={it.code}
                            onChange={(e) => updateItem(idx, 'code', e.target.value)}
                            className="w-full p-2 text-xs border rounded-lg font-mono uppercase" 
                            placeholder="Search code..." 
                          />
                          <datalist id="master-items">
                            {MASTER_ITEMS.map(m => <option key={m.code} value={m.code}>{m.desc}</option>)}
                          </datalist>
                        </td>
                        <td className="p-4">
                          <input 
                            value={it.desc}
                            onChange={(e) => updateItem(idx, 'desc', e.target.value)}
                            className="w-full p-2 text-xs border rounded-lg" 
                            placeholder="Item description" 
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" 
                            value={it.qty}
                            onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value))}
                            className="w-full p-2 text-xs text-center border rounded-lg" 
                          />
                        </td>
                        <td className="p-4">
                          <select 
                            value={it.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className="w-full p-2 text-xs border rounded-lg"
                          >
                            <option>Pcs</option>
                            <option>Set</option>
                            <option>Roll</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              const next = newInquiry.items.filter((_, i) => i !== idx);
                              setNewInquiry({ ...newInquiry, items: next });
                            }}
                            className="text-red-300 hover:text-red-500 text-2xl"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t">
                  <button onClick={addItemRow} className="text-blue-800 font-black text-xs uppercase tracking-widest">+ Add New Row</button>
                </div>
              </div>
            </div>
            <div className="p-8 border-t flex justify-end bg-white">
              <button 
                onClick={handleCreateInquiry}
                className="bg-[#002e5d] text-white px-20 py-5 rounded-3xl font-black shadow-2xl uppercase hover:bg-black transition"
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
