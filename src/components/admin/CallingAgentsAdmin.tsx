import React, { useState, useEffect } from 'react';
import { 
  getCallingAgentsFromFirestore, 
  saveCallingAgentToFirestore, 
  deleteCallingAgentFromFirestore, 
  getCallingAgentLogsFromFirestore,
  getCallingConfigFromFirestore,
  saveCallingConfigToFirestore,
  getOrdersFromFirestore,
  CallingAgent, 
  CallingAgentLog,
  CallingConfig
} from '../../lib/firebase';
import { 
  Users, UserPlus, Trash2, Key, Calendar, Activity, RefreshCw, 
  Search, ShieldAlert, CheckCircle, Database, Settings, Check, Clock, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { RaincoatOrder } from '../../types';

export default function CallingAgentsAdmin() {
  const [agents, setAgents] = useState<CallingAgent[]>([]);
  const [logs, setLogs] = useState<CallingAgentLog[]>([]);
  const [orders, setOrders] = useState<RaincoatOrder[]>([]);
  
  // Load states
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // CallingConfig State
  const [callingConfig, setCallingConfig] = useState<CallingConfig>({
    id: 'calling_config',
    orderExpiryDays: 3,
    confirmExpiryMins: 60,
    cancelExpiryMins: 10,
    maxAttempts: 3
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editingAgent, setEditingAgent] = useState<CallingAgent | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Search filter
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // Load Database Data
  const loadAgents = async () => {
    setAgentsLoading(true);
    try {
      const data = await getCallingAgentsFromFirestore();
      setAgents(data);
    } catch (err) {
      console.error("Failed to fetch calling agents", err);
    } finally {
      setAgentsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getCallingAgentLogsFromFirestore();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch calling logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadOrdersAndConfig = async () => {
    setOrdersLoading(true);
    try {
      const data = await getOrdersFromFirestore();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders for agent admin", err);
    } finally {
      setOrdersLoading(false);
    }

    try {
      const config = await getCallingConfigFromFirestore();
      if (config) {
        setCallingConfig(config);
      }
    } catch (err) {
      console.error("Failed to load calling config in admin", err);
    }
  };

  useEffect(() => {
    loadAgents();
    loadLogs();
    loadOrdersAndConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSuccess(false);
    try {
      await saveCallingConfigToFirestore(callingConfig);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save calling options", err);
      alert("সেটিংস সেভ করতে কারিগরি ত্রুটি হয়েছে।");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন!");
      return;
    }

    const cleanedUsername = newUsername.trim().toLowerCase();
    const cleanName = newName.trim();
    const cleanPassword = newPassword.trim();

    // Check if duplicate
    if (agents.some(a => a.username.toLowerCase() === cleanedUsername)) {
      alert("এই ইউজারনেম ইতিমধ্যে বিদ্যমান! অন্য ইউজারনেম টাইপ করুন।");
      return;
    }

    try {
      const newAgent: CallingAgent = {
        id: cleanedUsername, // Let id be the username as request
        username: cleanedUsername,
        name: cleanName || undefined,
        password: cleanPassword,
        createdAt: new Date().toISOString()
      };

      await saveCallingAgentToFirestore(newAgent);
      setAgents(prev => [...prev, newAgent]);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      alert("এজেন্ট অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  const handleDeleteAgent = async (agentId: string, username: string) => {
    if (username === '1234') {
      alert("ডিফল্ট এডমিন এজেন্ট (1234) অ্যাকাউন্টটি সম্পূর্ণ ডিলিট করা নিষিদ্ধ!");
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিতভাবে এজেন্ট (${username}) অ্যাকাউন্টটি মুছতে চান?`)) {
      return;
    }

    try {
      await deleteCallingAgentFromFirestore(agentId);
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch (err) {
      console.error("Failed to delete agent:", err);
      alert("এজেন্ট মুছতে সমস্যা হয়েছে।");
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    const cleanUser = editUsername.trim().toLowerCase();
    const cleanName = editName.trim();
    const cleanPass = editPassword.trim();

    if (!cleanUser || !cleanPass) {
      alert("ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন!");
      return;
    }

    try {
      // If the username changed, we must delete the old document ID and create a new doc
      if (cleanUser !== editingAgent.username) {
        if (cleanUser !== '1234' && editingAgent.username === '1234') {
          alert("ডিফল্ট এডমিন এজেন্ট (1234) এর ইউজারনেম পরিবর্তন করা যাবে না!");
          return;
        }

        // Verify it doesn't already exist in the other agents
        if (agents.some(a => a.id === cleanUser && a.id !== editingAgent.id)) {
          alert("এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান!");
          return;
        }

        const newAgent: CallingAgent = {
          id: cleanUser,
          username: cleanUser,
          name: cleanName || undefined,
          password: cleanPass,
          active: editActive,
          createdAt: editingAgent.createdAt || new Date().toISOString()
        };

        // Create the new agent document
        await saveCallingAgentToFirestore(newAgent);
        // Delete the old agent document
        await deleteCallingAgentFromFirestore(editingAgent.id);

        setAgents(prev => prev.filter(a => a.id !== editingAgent.id).concat(newAgent));
      } else {
        const updated: CallingAgent = {
          ...editingAgent,
          username: cleanUser,
          name: cleanName || undefined,
          password: cleanPass,
          active: editActive
        };
        await saveCallingAgentToFirestore(updated);
        setAgents(prev => prev.map(a => a.id === editingAgent.id ? updated : a));
      }

      setEditingAgent(null);
      setEditUsername('');
      setEditName('');
      setEditPassword('');
      alert("এজেন্ট অ্যাকাউন্ট সফলভাবে আপডেট করা হয়েছে।");
    } catch (err) {
      console.error("Failed to update agent account:", err);
      alert("এজেন্ট অ্যাকাউন্ট আপডেট করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleRefresh = () => {
    loadAgents();
    loadLogs();
  };

  // Filter logs by agent name or order ID
  const filteredLogs = logs.filter(log => {
    return (
      log.agentUsername.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.orderId.toLowerCase().includes(searchLogQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 font-sans text-white">
      
      {/* Header and Sync panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>কলিং এজেন্ট এবং লিড লগার ওভারসাইট (Calling Agents Oversight)</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1 leading-relaxed">
            কলিং এজেন্টদের পাসওয়ার্ড ম্যানেজমেন্ট, নতুন অ্যাকাউন্ট ক্রিয়েশন এবং কল লিগের লাইভ রিয়েল-টাইম কাস্টমার ইন্টারঅ্যাকশন কার্যপ্রণালী অডিট করুন।
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>ডাটা রিফ্রেশ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create Agent Account Panel & Config Settings Card Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-black flex items-center gap-2 border-b border-slate-800 pb-3 text-cyan-405">
              <UserPlus className="h-4 w-4 text-cyan-400" />
              <span>নতুন এজেন্ট যোগ করুন</span>
            </h3>

            <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">ইউজারনেম (Username)</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="যেমন: kamil_call_agent"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-cyan-400 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">এজেন্ট নাম (Display Name / Name)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="যেমন: আবির হাসান"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-cyan-400 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="যেমন: key_pass_44"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-cyan-400 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white rounded-xl shadow-md uppercase tracking-wider text-[11px] active:scale-95 transition cursor-pointer"
              >
                তৈরি করুন
              </button>
            </form>

            <div className="pt-2">
              <p className="text-[10px] text-slate-500 bg-slate-950 p-3 rounded-lg border border-slate-850 leading-relaxed">
                💡 ডিফল্ট রেজিস্টার্ড ইউজারনেম ৫-১৫ অক্ষরের মধ্যে রাখুন। এজেন্টরা নির্ধারিত প্যানেল থেকে এই পাসওয়ার্ড দিয়ে লগইন করে কল দিতে পারবে।
              </p>
            </div>
          </div>

          {/* ⚙️ এজেন্ট কলিং রুলস সেটিংস প্যানেল (Calling Options) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-black flex items-center gap-1.5 border-b border-slate-800 pb-3 text-indigo-400">
              <Settings className="h-4 w-4" />
              <span>কলিং অপশন ও রিমুভাল পলিসি (Calling Options)</span>
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs font-semibold">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-normal">
                  ১. নতুন লিড দেখার মেয়াদ (Lead Expiry Days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={callingConfig.orderExpiryDays}
                    onChange={(e) => setCallingConfig(prev => ({ ...prev, orderExpiryDays: parseInt(e.target.value) || 3 }))}
                    className="w-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-black text-cyan-400 focus:outline-hidden"
                  />
                  <span className="text-slate-405 text-slate-400 text-[10px]">দিন পর মূল পুল ও ড্রাফট অদৃশ্য হবে।</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-normal">
                  ২. সফল কল অদৃশ্যকরণ সীমা (Confirmation Expiry)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    required
                    value={callingConfig.confirmExpiryMins}
                    onChange={(e) => setCallingConfig(prev => ({ ...prev, confirmExpiryMins: parseInt(e.target.value) || 60 }))}
                    className="w-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-black text-cyan-400 focus:outline-hidden"
                  />
                  <span className="text-slate-405 text-slate-400 text-[10px]">মিনিট পর এজেন্ট প্যানেল থেকে হাইড হবে।</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-normal">
                  ৩. বাতিল কল অদৃশ্যকরণ সীমা (Cancellation Expiry)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    required
                    value={callingConfig.cancelExpiryMins}
                    onChange={(e) => setCallingConfig(prev => ({ ...prev, cancelExpiryMins: parseInt(e.target.value) || 60 }))}
                    className="w-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-black text-cyan-400 focus:outline-hidden"
                  />
                  <span className="text-slate-405 text-slate-400 text-[10px]">মিনিট পর এজেন্ট প্যানেল থেকে হাইড হবে।</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-normal">
                  ৪. ফোন না ধরা নোটিশ সীমা (Max Attempts Limit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={callingConfig.maxAttempts}
                    onChange={(e) => setCallingConfig(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 3 }))}
                    className="w-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-black text-cyan-400 focus:outline-hidden"
                  />
                  <span className="text-slate-405 text-slate-400 text-[10px]">বার ট্রাই এরপর ওয়ার্নিং ব্যাজ আসবে।</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={configSaving}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-[10.5px] cursor-pointer"
                >
                  {configSaving ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>সেভিং...</span>
                    </>
                  ) : configSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>সফলভাবে সেভ হয়েছে!</span>
                    </>
                  ) : (
                    <span>কলিং অপশন সেভ করুন</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Agents Account List Management */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black flex items-center gap-2 border-b border-slate-800 pb-3 text-cyan-455">
            <Users className="h-4 w-4" />
            <span>এজেন্ট অ্যাকাউন্ট তালিকা</span>
          </h3>

          {agentsLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">এজেন্ট ডাটা রিট্রাইভ করা হচ্ছে...</p>
            </div>
          ) : agents.length === 0 ? (
            <p className="text-slate-500 text-xs py-8 text-center italic">কোনো এজেন্ট অ্যাকাউন্ট নেই!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-black border-b border-slate-850">
                    <th className="p-3 border-r border-slate-850">ইউজারনেম</th>
                    <th className="p-3 border-r border-slate-850">পাসওয়ার্ড</th>
                    <th className="p-3 border-r border-slate-850">তৈরির তারিখ</th>
                    <th className="p-3 text-center border-r border-slate-850">কনফার্মড লিড (Confirmed)</th>
                    <th className="p-3 text-center border-r border-slate-850">অ্যাক্টিভিটি (Logged)</th>
                    <th className="p-3 text-center border-r border-slate-850">অ্যাক্সেস সক্রিয়তা (Access)</th>
                    <th className="p-3 text-center">অ্যাকশন / এডিট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855 divide-slate-800">
                  {agents.map((agent) => {
                    const agentConfirmed = orders.filter(
                      o => o.calledBy === agent.username && o.callStatus === 'Confirmed'
                    ).length;
                    const agentTotalLogs = logs.filter(
                      l => l.agentUsername === agent.username
                    ).length;

                    return (
                      <tr key={agent.id} className="hover:bg-slate-950/20">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-cyan-400 font-bold font-mono">@{agent.username}</span>
                            {agent.name && (
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">{agent.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-300">
                          {agent.password}
                        </td>
                        <td className="p-3 text-slate-400 font-mono">
                          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            {agentConfirmed} টি
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block font-mono font-bold text-xs text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                            {agentTotalLogs} বার
                          </span>
                        </td>
                        <td className="p-3 text-center border-r border-slate-850 select-none">
                          <button
                            type="button"
                            onClick={async () => {
                              const newActive = agent.active === false ? true : false;
                              const updated = { ...agent, active: newActive };
                              try {
                                await saveCallingAgentToFirestore(updated);
                                setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
                              } catch (err) {
                                console.error("Failed to toggle access status:", err);
                              }
                            }}
                            className={`py-1 px-3 rounded-full text-[10px] font-black transition active:scale-95 border ${
                              agent.active !== false
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-450 border-rose-500/30 hover:bg-rose-500/25'
                            }`}
                            title={agent.active !== false ? "অ্যাক্সেস বন্ধ করুন" : "অ্যাক্সেস চালু করুন"}
                          >
                            {agent.active !== false ? '● অন (Active)' : '○ অফ (Blocked)'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAgent(agent);
                                setEditUsername(agent.username);
                                setEditName(agent.name || '');
                                setEditPassword(agent.password || '');
                                setEditActive(agent.active !== false);
                              }}
                              className="py-1 px-2.5 bg-slate-950 hover:bg-slate-805 border border-slate-800 rounded-md text-[10px] font-bold text-slate-350 active:scale-95 transition cursor-pointer"
                            >
                              এডিট করুন (Edit)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAgent(agent.id, agent.username)}
                              disabled={agent.username === '1234'}
                              className={`p-1.5 rounded-lg transition active:scale-95 ${
                                agent.username === '1234'
                                  ? 'text-slate-650 cursor-not-allowed opacity-30 bg-transparent'
                                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                              }`}
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Agents CRM Logging Activity Auditor Logs */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-sm font-black flex items-center gap-2 text-cyan-455">
            <Activity className="h-4.5 w-4.5" />
            <span>সিস্টেম লাইভ কলিং এজেন্ট ডাটা অ্যাক্টিভিটি রিপোর্টস (Caller Logs)</span>
          </h3>

          <div className="relative w-full sm:w-72 text-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              placeholder="এজেন্ট নাম বা অর্ডার আইডি সার্চ..."
              className="pl-9 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-cyan-400 animate-fadeIn"
            />
          </div>
        </div>

        {logsLoading ? (
          <div className="text-center py-10">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent id-spin mx-auto mb-2 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-550">লগ ট্র্যাকার লোড হচ্ছে...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-slate-950/50 p-8 border border-dashed border-slate-850 rounded-xl text-center text-slate-600">
            কোনো এজেন্ট কলিং লগ বা অ্যাক্টিভিটি পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-black border-b border-slate-850">
                  <th className="p-3 w-40">টাইমস্ট্যাম্প (Time)</th>
                  <th className="p-3 w-40">কলিং এজেন্ট</th>
                  <th className="p-3 w-32 font-mono">অর্ডার আইডি</th>
                  <th className="p-3">সম্পন্ন কাজ (Action)</th>
                  <th className="p-3">সংরক্ষিত এজেন্ট নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 scrollbar-thin">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/30">
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('bn-BD', {
                        timeZone: 'Asia/Dhaka'
                      })}
                    </td>
                    <td className="p-3 font-extrabold text-[#00e3cd] font-mono">
                      @{log.agentUsername}
                    </td>
                    <td className="p-3 font-mono text-cyan-450 font-bold">
                      #{log.orderId}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        log.action.includes('Confirm') 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-medium italic">
                      {log.notes ? `"${log.notes}"` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent Account Edit Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative space-y-4 font-sans">
            
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="h-4.5 w-4.5 text-cyan-400" />
              <span>এজেন্ট অ্যাকাউন্ট এডিট করুন</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">এজেন্ট ইউজারনেম (Username)</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white font-mono text-sm focus:outline-hidden"
                  disabled={editingAgent.username === '1234'}
                />
                {editingAgent.username === '1234' && (
                  <p className="text-[9px] text-slate-500 mt-0.5">ডিফল্ট এডমিন এজেন্ট এর ইউজারনেম পরিবর্তনযোগ্য নয়।</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">এজেন্ট নাম (Display Name / Name)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-sm focus:outline-hidden"
                  placeholder="যেমন: আবির হাসান"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">পাসওয়ার্ড (Password)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white font-mono text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">অ্যাক্সেস সক্রিয়তা (Access Link)</label>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition active:scale-95 cursor-pointer ${
                    editActive
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-455 border-rose-500/30'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${editActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-550'}`}></span>
                  <span>অ্যাক্সেস অবস্থা: {editActive ? 'অন (Active - Logged In)' : 'অফ (Blocked - Access Denied)'}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleUpdateAgent}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                আপডেট করুন
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
