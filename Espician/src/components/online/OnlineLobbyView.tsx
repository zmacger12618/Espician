import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { onlineService } from '../../services/onlineService';
import { Wifi, Bot, Users, Copy, Check, Play, AlertCircle, Sparkles, Shield } from 'lucide-react';

export const OnlineLobbyView: React.FC = () => {
  const { myTeam, setEnemyTeam, setTab } = useGameStore();
  const [mode, setMode] = useState<'selection' | 'host' | 'join'>('selection');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinInputCode, setJoinInputCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [opponentTeam, setOpponentTeam] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const lanIp = window.location.hostname || '192.168.0.105';
  const shareableUrl = `http://${lanIp}:3000`;

  useEffect(() => {
    onlineService.connect().then((connected) => {
      setIsConnected(connected);
    });

    const unsubscribe = onlineService.subscribe((data) => {
      switch (data.type) {
        case 'ROOM_CREATED':
          setRoomCode(data.code);
          setStatusMessage('สร้างห้องสำเร็จ! กำลังรอให้เพื่อนเข้าร่วมห้อง...');
          break;

        case 'GUEST_JOINED':
          setOpponentTeam(data.enemyTeam);
          setEnemyTeam(data.enemyTeam);
          setStatusMessage(`เพื่อนของคุณ (${data.enemyTeam.name}) เข้าร่วมห้องแล้ว! พร้อมเริ่มแข่ง`);
          break;

        case 'ROOM_JOINED':
          setRoomCode(data.code);
          setOpponentTeam(data.enemyTeam);
          setEnemyTeam(data.enemyTeam);
          setStatusMessage(`เข้าร่วมห้อง ${data.code} สำเร็จ! เจ้าของห้องคือ (${data.enemyTeam.name})`);
          break;

        case 'MATCH_STARTED':
          setTab('match');
          break;

        case 'OPPONENT_DISCONNECTED':
          setOpponentTeam(null);
          setStatusMessage(data.message);
          break;

        case 'ERROR':
          setStatusMessage(`⚠️ ${data.message}`);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePlayVsBot = () => {
    // Reset to default bot team and go to match
    setTab('match');
  };

  const handleCreateRoom = () => {
    setMode('host');
    setStatusMessage('กำลังเชื่อมต่อเซิร์ฟเวอร์ LAN...');
    onlineService.connect().then(() => {
      onlineService.createRoom(myTeam);
    });
  };

  const handleJoinRoom = () => {
    if (!joinInputCode.trim()) return;
    setStatusMessage('กำลังค้นหาห้อง...');
    onlineService.connect().then(() => {
      onlineService.joinRoom(joinInputCode.trim(), myTeam);
    });
  };

  const handleStartOnlineMatch = () => {
    onlineService.startOnlineMatch();
    setTab('match');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Wifi className="w-6 h-6 text-indigo-400" /> โหมดการแข่งขัน (Matchmaking & LAN Lobby)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            เลือกระหว่างเล่นซ้อมกับบอท (Vs AI) หรือเปิดห้องดวลกับเพื่อนในวง Wi-Fi เดียวกันผ่านระบบ Room Code
          </p>
        </div>

        {/* LAN Share Link Pill */}
        <div className="bg-[#182032] border border-[#23304c] px-4 py-2 rounded-xl text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">ลิงก์แชร์ในวงเน็ต:</span>
          <strong className="text-indigo-400 font-mono">{shareableUrl}</strong>
        </div>
      </div>

      {/* Main Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Play vs Bot Card */}
        <div className="bg-[#141c2e] border border-[#202d47] hover:border-[#314468] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">ซ้อมแข่งกับ AI (Vs Bot)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ฝึกซ้อมทดสอบแผนกลยุทธ์กับทีม Viper Esports (AI) ทันทีโดยไม่ต้องรอผู้เล่นอื่น เหมาะสำหรับการทดสอบแผนและปั๊มงบประมาณสโมสร
            </p>
          </div>

          <button
            onClick={handlePlayVsBot}
            className="w-full py-3 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <Play className="w-4 h-4" /> เข้าสู่สนามแข่งทันที (Play vs AI)
          </button>
        </div>

        {/* Play vs Friend Card */}
        <div className="bg-[#141c2e] border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">แข่งกับเพื่อน (LAN / Online Room)</h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/40">
                LAN Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              เพื่อนในวง Wi-Fi หรือเน็ตเดียวกันเปิดเบราว์เซอร์ไปที่ <strong>{shareableUrl}</strong> จากนั้นคนหนึ่งกดสร้างห้อง อีกคนกรอกรหัสเข้าร่วม
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCreateRoom}
              className="py-3 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" /> สร้างห้องใหม่ (Host)
            </button>
            <button
              onClick={() => setMode('join')}
              className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" /> เข้าร่วมห้อง (Join)
            </button>
          </div>
        </div>
      </div>

      {/* Room Active Modal / Section */}
      {mode === 'host' && (
        <div className="bg-[#141c2e] border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> ห้องแข่งขันของคุณ
            </h4>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              สถานะ: {opponentTeam ? 'ผู้เล่นครบแล้ว' : 'กำลังรอเพื่อนเข้าร่วม'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Room Code Display */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-xs text-slate-400">รหัสห้อง (Room Code) ส่งให้เพื่อน:</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black text-indigo-400 font-mono tracking-wider">
                  {roomCode || 'กำลังสร้าง...'}
                </span>
                <button
                  onClick={handleCopyCode}
                  disabled={!roomCode}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                  title="คัดลอกรหัสห้อง"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Teams Matching */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ฝั่งสีน้ำเงิน (Host):</span>
                <strong className="text-cyan-400">{myTeam.name}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ฝั่งสีแดง (Guest):</span>
                <strong className={opponentTeam ? 'text-rose-400' : 'text-slate-500 italic'}>
                  {opponentTeam ? opponentTeam.name : 'กำลังรอ...'}
                </strong>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="text-xs text-indigo-300 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
              {statusMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              disabled={!opponentTeam}
              onClick={handleStartOnlineMatch}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> เริ่มการแข่งขันออนไลน์!
            </button>
            <button
              onClick={() => setMode('selection')}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="bg-[#141c2e] border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 max-w-md mx-auto">
          <h4 className="font-bold text-base text-white text-center">เข้าร่วมห้องแข่งขันของเพื่อน</h4>
          <p className="text-xs text-slate-400 text-center">กรอกรหัสห้อง 4 หลักที่เพื่อนแชร์ให้คุณ</p>

          <input
            type="text"
            placeholder="ตัวอย่าง: ESP-XXXX"
            value={joinInputCode}
            onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
            className="w-full text-center text-xl font-mono font-bold tracking-wider py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
          />

          {statusMessage && (
            <div className="text-xs text-indigo-300 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/50 text-center">
              {statusMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleJoinRoom}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2"
            >
              เข้าร่วมห้อง
            </button>
            <button
              onClick={() => setMode('selection')}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
