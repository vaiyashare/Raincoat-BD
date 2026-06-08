import React, { useState, useEffect } from 'react';
import { 
  Lock, UserPlus, Trash2, Key, Users, AlertCircle, Save, 
  ShieldCheck, Shield, Eye, Edit3, Fingerprint, Crown, Check, X, Info
} from 'lucide-react';

interface TeamUser {
  id: string;
  username: string;
  passwordHash: string; // Plain password for ease of demo persistence
  role: 'Admin' | 'Editor' | 'ReadOnly';
  canEdit?: boolean;
  canDelete?: boolean;
}

interface UsersAdminProps {
  currentUser: string;
  onRefreshUsers: () => void;
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function UsersAdmin({ currentUser, onRefreshUsers, userRole }: UsersAdminProps) {
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  
  // User creator form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Editor' | 'ReadOnly'>('Editor');
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Main login password changes states
  const [adminUsername, setAdminUsername] = useState(() => {
    const stored = localStorage.getItem('admin_username');
    if (!stored || stored === 'admin') {
      localStorage.setItem('admin_username', 'sobpabe');
      return 'sobpabe';
    }
    return stored;
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    const stored = localStorage.getItem('admin_password');
    if (!stored || stored === '123456') {
      localStorage.setItem('admin_password', 'Ashik@@9');
      return 'Ashik@@9';
    }
    return stored;
  });
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [showRunningPwd, setShowRunningPwd] = useState(false);

  const loadTeamUsers = () => {
    const list = localStorage.getItem('raincoat_team_users');
    if (list) {
      try {
        let team = JSON.parse(list);
        let updated = false;
        team = team.map((u: any) => {
          if (u.id === '1' && u.username === 'admin' && u.passwordHash === '123456') {
            updated = true;
            return { ...u, username: 'sobpabe', passwordHash: 'Ashik@@9' };
          }
          return u;
        });
        if (updated) {
          localStorage.setItem('raincoat_team_users', JSON.stringify(team));
        }
        setTeamUsers(team);
      } catch (e) {
        setTeamUsers([]);
      }
    } else {
      // Seed default accounts
      const defaults: TeamUser[] = [
        { id: '1', username: 'sobpabe', passwordHash: 'Ashik@@9', role: 'Admin', canEdit: true, canDelete: true },
        { id: '2', username: 'editor', passwordHash: '123456', role: 'Editor', canEdit: true, canDelete: false },
        { id: '3', username: 'viewer', passwordHash: '123455', role: 'ReadOnly', canEdit: false, canDelete: false },
      ];
      localStorage.setItem('raincoat_team_users', JSON.stringify(defaults));
      setTeamUsers(defaults);
    }
  };

  useEffect(() => {
    loadTeamUsers();
  }, []);

  const handleUpdateAdminMain = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');

    if (userRole !== 'Admin') {
      return setPwdMsg('দুঃখিত! মূল এডমিন ব্যতিত পাসওয়ার্ড ও ইউজারনেম পরিবর্তনাধিকার নেই।');
    }

    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      return setPwdMsg('দয়া করে সঠিক ইউজারনেম ও স্ট্রং পাসওয়ার্ড টাইপ করুন!');
    }

    localStorage.setItem('admin_username', newAdminUser.trim());
    localStorage.setItem('admin_password', newAdminPass.trim());
    
    // Also update in the team users table if it matches id-1
    const list = localStorage.getItem('raincoat_team_users');
    if (list) {
      const parsed: TeamUser[] = JSON.parse(list);
      const updated = parsed.map(u => {
        if (u.username === adminUsername) {
          return { ...u, username: newAdminUser.trim(), passwordHash: newAdminPass.trim() };
        }
        return u;
      });
      localStorage.setItem('raincoat_team_users', JSON.stringify(updated));
      setTeamUsers(updated);
    }

    setAdminUsername(newAdminUser.trim());
    setAdminPassword(newAdminPass.trim());
    setNewAdminUser('');
    setNewAdminPass('');
    setPwdMsg('মূল অ্যাডমিন অ্যাকাউন্ট ইউজার ও পাসওয়ার্ড সফলভাবে হালনাগাদ হয়েছে!');
    onRefreshUsers();
    
    setTimeout(() => {
      setPwdMsg('');
    }, 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (userRole !== 'Admin') {
      return setError('শুধুমাত্র মূল অ্যাডমিন নতুন টিম মেম্বারদের রোল তৈরি কর‍তে পারেন!');
    }

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password.trim()) {
      return setError('ইউজারনেম ও পাসওয়ার্ড খালি রাখা যাবে না!');
    }

    if (teamUsers.some(u => u.username === cleanUser)) {
      return setError('এই নামের ইউজার ইতিমধ্যে তৈরি করা আছে!');
    }

    const newUser: TeamUser = {
      id: 'usr-' + Math.floor(Math.random() * 10000),
      username: cleanUser,
      passwordHash: password.trim(),
      role: role,
      canEdit: canEdit,
      canDelete: canDelete
    };

    const updated = [...teamUsers, newUser];
    localStorage.setItem('raincoat_team_users', JSON.stringify(updated));
    setTeamUsers(updated);

    setUsername('');
    setPassword('');
    setCanEdit(true);
    setCanDelete(false);
    setSuccess(`নতুন টিম ইউজার "${cleanUser}" (${role}) সফলভাবে নিবন্ধিত হয়েছে!`);
    onRefreshUsers();

    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (userRole !== 'Admin') {
      alert('টিম ইউজার ডিলিট করার ক্ষমতা শুধুমাত্র মূল অ্যাডমিনের রয়েছে!');
      return;
    }

    if (name === currentUser) {
      alert('আপনি নিজের রানিং একাউন্ট ডিলিট করতে পারবেন না!');
      return;
    }

    if (name === 'admin') {
      alert('মূল সুপার-অ্যাডমিন একাউন্ট ট্র্যাশ বিনে ফেলা যাবে না!');
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${name}" কে টিম থেকে রিমুভ করতে চান?`)) return;

    const updated = teamUsers.filter(u => u.id !== id);
    localStorage.setItem('raincoat_team_users', JSON.stringify(updated));
    setTeamUsers(updated);
    onRefreshUsers();
  };

  return (
    <div id="users-admin-container" className="space-y-8 font-sans text-slate-750">
      
      {/* Upper overview section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-indigo-900/40">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-y-[-20%] translate-x-[10%]">
          <Users className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Fingerprint className="h-3.5 w-3.5" /> সিকিউরিটি ও টিম মডারেটর কন্ট্রোল
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            অ্যাডমিন রোল এবং অ্যাক্সেস ম্যানেজমেন্ট
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            আপনার ই-কমার্স অপারেশনের সুরক্ষার জন্য প্রতিটি টিম কাস্টমারের অর্ডার, ইনভেন্টরি, পিক্সেল সেটিংস এবং কন্টেন্ট পরিবর্তনাধিকার সুনির্দিষ্ট সীমার মধ্যে রাখুন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Security Settings and Team registration */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main super-admin account credentials changer */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-5 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Key className="h-4 w-4" />
                </span>
                গ্লোবাল অ্যাডমিন শংসাপত্র
              </h3>
              <span className="text-[10px] font-mono bg-slate-150 text-slate-650 px-2.5 py-0.8 rounded-full font-bold">
                মাস্টার কি
              </span>
            </div>

            <p className="text-xs text-slate-505 text-slate-500 leading-relaxed">
              সিস্টেমের প্রধান ড্যাশবোর্ডে লগইন করার মূল নিরাপত্তা প্যারামিটার। অনুগ্রহ করে এটি নিয়মিত পরিবর্তন ও নিরাপদ রাখুন।
            </p>

            {pwdMsg && (
              <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-650 shrink-0" />
                <span>{pwdMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminMain} className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">রানিং অ্যাডমিন ক্রেডেনশিয়ালস</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono bg-slate-200/80 px-2 py-0.5 rounded-md font-extrabold text-slate-700">
                      User: {adminUsername}
                    </span>
                    <span className="font-mono bg-slate-200/80 px-2 py-0.5 rounded-md font-extrabold text-slate-700">
                      Password: {showRunningPwd ? adminPassword : '••••••'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="toggle-main-pwd-btn"
                  onClick={() => setShowRunningPwd(!showRunningPwd)}
                  className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-650 rounded-lg text-[10px] font-bold border border-slate-300/60 cursor-pointer transition select-none"
                >
                  {showRunningPwd ? 'লুকান' : 'দেখুন'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1.5 uppercase tracking-wider">নতুন ইউজারনেম</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input 
                      type="text" 
                      id="new-admin-user"
                      placeholder="যেমন: cloud_admin"
                      className="w-full pl-9 pr-3.5 py-2 hover:border-slate-350 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 transition-all placeholder:text-slate-400"
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1.5 uppercase tracking-wider">নতুন লগইন পাসওয়ার্ড</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Key className="h-4 w-4" />
                    </span>
                    <input 
                      type="password" 
                      id="new-admin-pass"
                      placeholder="নতুন পাসওয়ার্ড টাইপ করুন"
                      className="w-full pl-9 pr-3.5 py-2 hover:border-slate-350 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 transition-all placeholder:text-slate-400"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                id="update-admin-credentials-btn"
                disabled={userRole !== 'Admin'}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> ক্রেডেনশিয়াল হালনাগাদ করুন
              </button>
            </form>
          </div>

          {/* User registration / roles creation */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-5 transition-all hover:shadow-sm">
            <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserPlus className="h-4 w-4" />
              </span>
              নতুন টিম মেম্বার রোল যোগ
            </h3>
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-extrabold text-xs flex items-center gap-2">
                <X className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-805 text-emerald-800 font-extrabold text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1.5 uppercase tracking-wider">রুলার আইডি / ইউজারনেম (Username)</label>
                  <input 
                    type="text" 
                    id="team-username"
                    placeholder="যেমন- manager_sakib"
                    className="w-full px-3.5 py-2 bg-white hover:border-slate-350 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium text-slate-800 transition"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1.5 uppercase tracking-wider">আলাদা পাসওয়ার্ড (Password)</label>
                  <input 
                    type="text" 
                    id="team-password"
                    placeholder="ডিভাইস পাসওয়ার্ড দিন"
                    className="w-full px-3.5 py-2 bg-white hover:border-slate-350 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono font-bold text-slate-800 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold mb-1.5 uppercase tracking-wider">অ্যাক্সেস লেভেল নির্বাচন (Select Role)</label>
                  <select 
                    id="team-role-select"
                    value={role} 
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      setRole(newRole);
                      if (newRole === 'Admin') {
                        setCanEdit(true);
                        setCanDelete(true);
                      } else if (newRole === 'Editor') {
                        setCanEdit(true);
                        setCanDelete(false);
                      } else {
                        setCanEdit(false);
                        setCanDelete(false);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white hover:border-slate-350 border border-slate-300 rounded-xl text-xs focus:outline-none cursor-pointer font-bold text-slate-800 transition"
                  >
                    <option value="Editor">সহ-সম্পাদক (Editor - কন্টেন্ট ও রিভিউ এডিট করতে পারবেন)</option>
                    <option value="ReadOnly">সহ-পর্যবেক্ষক (ReadOnly - কেবল ভিউ করতে পারবেন)</option>
                    <option value="Admin">সহ-অ্যাডমিন (Admin - পূর্ণ প্রবেশাধিকার পাবেন)</option>
                  </select>
                </div>

                {/* Hand-tuned custom toggle overrides */}
                <div className="pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-150">
                  <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">কাস্টম অ্যাকশন পারমিশন:</span>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                    <input 
                      type="checkbox" 
                      id="perm-can-edit"
                      checked={canEdit} 
                      onChange={(e) => setCanEdit(e.target.checked)}
                      className="rounded-md text-emerald-600 focus:ring-emerald-400 border-slate-300 w-4.5 h-4.5 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                      <Edit3 className="h-3 w-3 text-emerald-600" />
                      <span>প্রোডাক্ট, স্টক ও রিভিউ এডিট অনুমোদন</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                    <input 
                      type="checkbox" 
                      id="perm-can-delete"
                      checked={canDelete} 
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="rounded-md text-rose-600 focus:ring-rose-400 border-slate-300 w-4.5 h-4.5 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                      <Trash2 className="h-3 w-3 text-rose-500" />
                      <span>আংশিক/চূড়ান্ত অর্ডার ডিলিট করার অনুমতি</span>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                id="create-team-user-btn"
                disabled={userRole !== 'Admin'}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 font-black text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="h-4 w-4" /> টিম মেম্বার নিবন্ধিত করুন
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: User accounts overview and directory */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">নিবন্ধিত মডারেটর দল ({teamUsers.length})</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">ডিভাইস ডাটাবেসে অনুমোদিত মডারেটর অ্যাকাউন্ট তালিকা</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> আপনার রোল: <span className="text-indigo-805 text-indigo-800 uppercase font-black font-sans ml-0.5">{userRole}</span>
            </div>
          </div>

          <div className="p-1.5 overflow-x-auto">
            <table className="w-full text-left text-slate-500">
              <thead className="bg-slate-50/50 text-[10px] text-slate-505 font-black uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">ইউজারনেম (Username)</th>
                  <th className="px-4 py-3 text-center">রোল টাইপ</th>
                  <th className="px-4 py-3 text-center">লগইন পাসওয়ার্ড</th>
                  <th className="px-4 py-3 text-center">অনুমতি ম্যাপ (Permissions)</th>
                  <th className="px-4 py-3 text-center">মুছে ফেলা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {teamUsers.map(user => {
                  const isAdmin = user.role === 'Admin';
                  const isEditor = user.role === 'Editor';
                  const isViewer = user.role === 'ReadOnly';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4.5 text-left">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-700 capitalize text-sm">
                              {user.username.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 font-sans text-sm">{user.username}</span>
                              {user.username === currentUser && (
                                <span className="text-[7px] tracking-wider uppercase bg-indigo-900 text-indigo-50 font-black rounded-md px-1.5 py-0.5">আপনি</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">id: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          isAdmin ? 'bg-rose-50 border-rose-150 text-rose-700' :
                          isEditor ? 'bg-indigo-50 border-indigo-150 text-indigo-700' :
                          'bg-amber-50 border-amber-150 text-amber-700'
                        }`}>
                          {isAdmin ? (
                            <>
                              <Crown className="h-3 w-3 text-rose-500 shrink-0" /> Administrator
                            </>
                          ) : isEditor ? (
                            <>
                              <Shield className="h-3 w-3 text-indigo-500 shrink-0" /> Editor
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 text-amber-500 shrink-0" /> View Only
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <span className="bg-slate-100 text-slate-800 font-extrabold px-2 mt-0.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200/50">
                          {user.passwordHash}
                        </span>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[130px]">
                          <span className={`inline-flex items-center gap-0.5 px-1.8 py-0.5 rounded text-[9px] font-extrabold border ${
                            user.canEdit !== false 
                              ? 'bg-emerald-50/70 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50/70 text-rose-700 border-rose-100'
                          }`}>
                            {user.canEdit !== false ? '• এডিট' : '• নো এডিট'}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 px-1.8 py-0.5 rounded text-[9px] font-extrabold border ${
                            user.canDelete === true 
                              ? 'bg-emerald-50/70 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50/70 text-rose-700 border-rose-100'
                          }`}>
                            {user.canDelete === true ? '• ডিলিট' : '• নো ডিলিট'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4.5 text-center">
                        {user.username !== 'admin' && user.username !== currentUser ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-rose-500 hover:text-rose-700 p-1.8 rounded-xl hover:bg-rose-50 transition border border-transparent hover:border-rose-150 inline-flex items-center justify-center cursor-pointer"
                            id={`delete-user-${user.username}`}
                            title="রিমুভ করুন"
                          >
                            <Trash2 className="h-3.8 w-3.8" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-350 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-5 bg-indigo-50/40 border-t border-indigo-100 flex items-start gap-3 rounded-b-3xl">
            <Info className="h-4.5 w-4.5 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-slate-650 text-xs font-medium leading-relaxed">
              <strong className="text-indigo-950 block font-black">💡 টিম মেম্বারদের রোল সিস্টেম নির্দেশিকা:</strong>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 mt-1">
                <div>
                  <span className="font-extrabold text-rose-800 block">👑 Administrator:</span>
                  সব ড্যাশবোর্ড সেটিংস, মূল ল্যান্ডিং পেজ মডিফায়ার, কাস্টমার অর্ডার এডিট এবং ফেসবুক মেটা পিক্সেল যুক্ত করতে পারবেন।
                </div>
                <div>
                  <span className="font-extrabold text-indigo-800 block">🛡️ Editor Account:</span>
                  স্টক ইনভেন্টরি হ্রাস-বৃদ্ধি, অর্ডার রিভিউ কাস্টমাইজেশন এবং প্রোডাক্ট ডেটাবেজ হালনাগাদ করতে পারলেও এডমিন পিক্সেল কাস্টমাইজ করতে পারবেন না।
                </div>
                <div>
                  <span className="font-extrabold text-amber-805 block">👁️ View Only Viewer:</span>
                  লাইভ ও আংশিক অর্ডারের রিয়েলটাইম লিষ্ট ও কাস্টমার ডেলিভারি স্লিপ সংগ্রহ করতে পারবেনных। অপ্রীতিকর ঝামেলা এড়াতে কোনো স্টক মেমো বা রিভিউ এডিটের অনুমতি নেই।
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
