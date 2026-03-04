
import React, { useState, useEffect } from 'react';
import { SocialGroup, GroupMember } from '../types';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { getGlobalLeaderboard } from '../services/supabase';

interface SocialProps {
  userPoints: number;
  userName: string;
  userId: string;
  userProgress: number;
  isAdmin: boolean;
}

const Social: React.FC<SocialProps> = ({ userPoints, userName, userId, userProgress, isAdmin }) => {
  const [activeTab, setActiveTab] = useState<'group' | 'community'>('community');
  const [group, setGroup] = useState<SocialGroup | null>(() => getFromStorage('ramadan_group', null));
  const [globalMembers, setGlobalMembers] = useState<GroupMember[]>(() => getFromStorage('ramadan_global_members', []));
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    if (!userId || isAdmin) return;
    
    const fetchGlobal = async () => {
      const members = await getGlobalLeaderboard();
      if (members && members.length > 0) {
        const formatted: GroupMember[] = members.map((m: any) => ({
          id: m.id,
          name: m.name,
          points: m.points,
          todayProgress: m.today_progress,
          avatar: m.avatar || '👤'
        }));
        setGlobalMembers(formatted);
        saveToStorage('ramadan_global_members', formatted);
      }
    };

    fetchGlobal();
    // Refresh every 30 seconds if tab is active
    const interval = setInterval(fetchGlobal, 30000);
    return () => clearInterval(interval);
  }, [userId, isAdmin]);

  useEffect(() => {
    if (group && userId && !isAdmin) {
      const memberIndex = group.members.findIndex(m => m.id === userId);
      let updatedMembers: GroupMember[];
      if (memberIndex > -1) {
        updatedMembers = group.members.map((m, idx) => 
          idx === memberIndex ? { ...m, name: userName, points: userPoints, todayProgress: userProgress } : m
        );
      } else {
        updatedMembers = [...group.members, { id: userId, name: userName, points: userPoints, todayProgress: userProgress, avatar: '👤' }];
      }
      const prevMember = group.members.find(m => m.id === userId);
      const hasChanged = !prevMember || prevMember.points !== userPoints || prevMember.todayProgress !== userProgress || prevMember.name !== userName;
      if (hasChanged) {
        const updatedGroup = { ...group, members: updatedMembers };
        setGroup(updatedGroup);
        saveToStorage('ramadan_group', updatedGroup);
        const allGroups = getFromStorage<SocialGroup[]>('ramadan_groups_registry', []);
        const registryIndex = allGroups.findIndex(g => g.code === group.code);
        if (registryIndex > -1) {
          const updatedRegistry = [...allGroups];
          updatedRegistry[registryIndex] = updatedGroup;
          saveToStorage('ramadan_groups_registry', updatedRegistry);
        }
      }
    }
  }, [userPoints, userProgress, userName, userId, group, isAdmin]);

  const createGroup = (name: string) => {
    if (isAdmin) return;
    const newGroup: SocialGroup = {
      id: Date.now().toString(),
      name: name,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      members: [{ id: userId, name: userName, points: userPoints, todayProgress: userProgress, avatar: '👤' }]
    };
    setGroup(newGroup);
    saveToStorage('ramadan_group', newGroup);
    const allGroups = getFromStorage<SocialGroup[]>('ramadan_groups_registry', []);
    saveToStorage('ramadan_groups_registry', [...allGroups, newGroup]);
    setIsCreating(false);
  };

  const handleJoinGroup = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const allGroups = getFromStorage<SocialGroup[]>('ramadan_groups_registry', []);
    const targetGroup = allGroups.find(g => g.code === code);
    if (targetGroup) {
      if (targetGroup.members.some(m => m.id === userId)) {
        setGroup(targetGroup);
        saveToStorage('ramadan_group', targetGroup);
        setIsJoining(false);
        setJoinCode('');
        return;
      }
      const updatedGroup = {
        ...targetGroup,
        members: [...targetGroup.members, { id: userId, name: userName, points: userPoints, todayProgress: userProgress, avatar: '👤' }]
      };
      setGroup(updatedGroup);
      saveToStorage('ramadan_group', updatedGroup);
      const updatedRegistry = allGroups.map(g => g.code === code ? updatedGroup : g);
      saveToStorage('ramadan_groups_registry', updatedRegistry);
      setIsJoining(false);
      setJoinCode('');
    } else {
      alert('ভুল কোড!');
    }
  };

  const addMemberManual = () => {
    if (!newMemberName.trim() || !group) return;
    const newMember: GroupMember = {
      id: `manual_${Date.now()}`,
      name: newMemberName,
      points: 0,
      todayProgress: 0,
      avatar: ['🧔', '🧕', '👨‍🎓', '👳'][Math.floor(Math.random() * 4)]
    };
    const updatedGroup = { ...group, members: [...group.members, newMember] };
    setGroup(updatedGroup);
    saveToStorage('ramadan_group', updatedGroup);
    const allGroups = getFromStorage<SocialGroup[]>('ramadan_groups_registry', []);
    const updatedRegistry = allGroups.map(g => g.code === group.code ? updatedGroup : g);
    saveToStorage('ramadan_groups_registry', updatedRegistry);
    setNewMemberName('');
  };

  const getLeaderboardData = () => {
    if (activeTab === 'community') {
      return [...globalMembers].sort((a, b) => b.points - a.points);
    }
    return group ? [...group.members].sort((a, b) => b.points - a.points) : [];
  };

  const getShortId = (id: string) => {
    if (id === 'admin') return 'ADMIN';
    if (id.startsWith('manual_')) return 'MANUAL';
    const parts = id.split('_');
    const lastPart = parts[parts.length - 1];
    return lastPart ? lastPart.toUpperCase() : id.substring(0, 4).toUpperCase();
  };

  const leaderboard = getLeaderboardData();

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <h2 className="text-2xl font-bold font-playfair text-amber-400 text-center mb-2">লিডারবোর্ড</h2>

      <div className="flex bg-emerald-900/30 p-1 rounded-2xl border border-emerald-800/50">
        <button onClick={() => setActiveTab('community')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'community' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'text-emerald-500 hover:text-emerald-300'}`}>🌍 ডিভাইস ইউজার</button>
        <button onClick={() => setActiveTab('group')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'group' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'text-emerald-500 hover:text-emerald-300'}`}>👥 আমার গ্রুপ</button>
      </div>

      {activeTab === 'group' && !group && !isCreating && !isJoining && (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn px-6">
          <div className="w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center text-2xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-amber-400 mb-1">গ্রুপ কম্পিটিশন</h3>
          <p className="text-emerald-500 text-xs mb-6 leading-relaxed">পরিবার বা বন্ধুদের সাথে প্রতিযোগিতা করতে গ্রুপে যোগ দিন বা নতুন খুলুন।</p>
          {!isAdmin && (
            <div className="flex flex-col w-full gap-3">
              <button onClick={() => setIsJoining(true)} className="bg-amber-500 text-emerald-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20">কোড দিয়ে গ্রুপে যোগ দিন</button>
              <button onClick={() => setIsCreating(true)} className="bg-emerald-800 text-amber-400 font-bold px-6 py-3 rounded-xl text-sm border border-emerald-700">নতুন গ্রুপ তৈরি করুন</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'group' && isJoining && (
        <div className="animate-fadeIn p-5 bg-emerald-900/30 rounded-3xl border border-emerald-800">
           <h3 className="text-sm font-bold text-amber-400 mb-4 uppercase">গ্রুপ কোড দিন</h3>
           <div className="space-y-4">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="যেমন: ABC123" maxLength={6} className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest focus:outline-none focus:border-amber-500 text-amber-500" />
              <div className="flex gap-2">
                <button onClick={() => setIsJoining(false)} className="flex-1 bg-emerald-800 text-emerald-400 font-bold py-3 rounded-xl text-sm">বাতিল</button>
                <button onClick={handleJoinGroup} className="flex-1 bg-amber-500 text-emerald-950 font-bold py-3 rounded-xl text-sm">JOIN</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'group' && isCreating && (
        <div className="animate-fadeIn p-5 bg-emerald-900/30 rounded-3xl border border-emerald-800">
           <h3 className="text-sm font-bold text-amber-400 mb-4 uppercase">গ্রুপের নাম দিন</h3>
           <div className="space-y-4">
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="যেমন: আমাদের পরিবার" className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
              <div className="flex gap-2">
                <button onClick={() => setIsCreating(false)} className="flex-1 bg-emerald-800 text-emerald-400 font-bold py-3 rounded-xl text-sm">বাতিল</button>
                <button onClick={() => groupName.trim() && createGroup(groupName)} className="flex-1 bg-amber-500 text-emerald-950 font-bold py-3 rounded-xl text-sm">তৈরি করুন</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'group' && group && (
        <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-800/50 flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">গ্রুপ: {group.name}</span>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-amber-400 font-mono tracking-widest">{group.code}</p>
              <button onClick={() => { navigator.clipboard.writeText(group.code); alert('কপি হয়েছে!'); }} className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-400">Copy</button>
            </div>
          </div>
          <button onClick={() => { if(confirm('লিভ নিতে চান?')) { setGroup(null); saveToStorage('ramadan_group', null); }}} className="text-xs bg-red-900/20 text-red-500 px-3 py-1.5 rounded-lg border border-red-900/30">Leave</button>
        </div>
      )}

      <div className="space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.map((member, index) => {
            const isMe = member.id === userId;
            const badge = getRankBadge(index);
            return (
              <div key={member.id} className={`relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border transition-all ${isMe ? 'bg-amber-500/15 border-amber-500' : 'bg-emerald-900/40 border-emerald-800'}`}>
                {index < 3 && <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full flex items-center justify-center"><span className="text-xs translate-x-1 -translate-y-1">{badge}</span></div>}
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-lg border border-emerald-700">{member.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-sm font-bold truncate ${isMe ? 'text-amber-400' : 'text-slate-100'}`}>{member.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-950 px-1 rounded">#{getShortId(member.id)}</span>
                        <div className="w-16 bg-emerald-950 h-1 rounded-full">
                          <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${member.todayProgress}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-amber-500">{member.points}</span>
                      <span className="text-[8px] text-emerald-600 font-bold uppercase">পয়েন্টস</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : <div className="text-center py-20 text-emerald-700"><p className="text-sm italic">খালি...</p></div>}
      </div>

      {activeTab === 'group' && group && (
        <div className="pt-6 border-t border-emerald-900/50">
           <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3">সদস্য অ্যাড করুন</h4>
           <div className="flex gap-2">
            <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="নাম..." className="flex-1 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
            <button onClick={addMemberManual} className="bg-emerald-800 text-amber-400 font-bold px-6 py-3 rounded-xl text-sm">ADD</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
