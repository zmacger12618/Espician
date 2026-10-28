import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  ApiService,
  DbStatusResponse,
  setSavedSessionToken
} from '../../services/apiService';
import { INITIAL_USER_TEAM } from '../../core/data/defaultData';
import { INITIAL_MARKET_LISTINGS, generateStarterSquad } from '../../core/data/defaultMarket';
import {
  ArrowRight,
  Lock,
  User,
  Mail,
  AlertCircle,
  Info,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number | string;
              text?: string;
              shape?: 'rectangular' | 'pill';
            }
          ) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_CLIENT_ID_KEY = 'espician_google_client_id';

export const LoginView: React.FC = () => {
  const { loginWithDatabaseSession } = useGameStore();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [staySignedIn, setStaySignedIn] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [showSystemDetailsModal, setShowSystemDetailsModal] = useState<boolean>(false);

  const envClientId =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID || '';
  const [googleClientId] = useState<string>(() => {
    return envClientId || localStorage.getItem(STORAGE_CLIENT_ID_KEY) || '';
  });

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiService.getDbStatus()
      .then((res) => setDbStatus(res))
      .catch(() => setDbStatus(null));

    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const authCode = params.get('code');
    const authErrorParam = params.get('auth_error') || params.get('error');

    if (authErrorParam) {
      setAuthError(authErrorParam);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (authToken) {
      setIsSubmitting(true);
      setSavedSessionToken(authToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      ApiService.fetchMe()
        .then(({ user, clubState }) => {
          loginWithDatabaseSession(user, clubState);
        })
        .catch((err) => {
          setAuthError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลบัญชีจากเซิร์ฟเวอร์ได้');
        })
        .finally(() => setIsSubmitting(false));
      return;
    }

    if (authCode) {
      setIsSubmitting(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      ApiService.exchangeGoogleCode({
        code: authCode,
        initialClubState: buildInitialClubStateForNewUser('GoogleCoach')
      })
        .then((res) => {
          loginWithDatabaseSession(res.user, res.clubState);
        })
        .catch((err) => {
          setAuthError(err instanceof Error ? err.message : 'การเข้าสู่ระบบด้วย Google ล้มเหลว');
        })
        .finally(() => setIsSubmitting(false));
    }
  }, []);

  const buildInitialClubStateForNewUser = (coachLabel: string) => {
    const cleanCoach = coachLabel || 'ProCoach';
    const cleanClub = `${cleanCoach} Esports`;
    const cleanShort =
      cleanCoach
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'ESP';

    return {
      currentDay: 1,
      myTeam: {
        ...INITIAL_USER_TEAM,
        name: cleanClub,
        shortName: cleanShort,
        coachName: cleanCoach
      },
      marketListings: INITIAL_MARKET_LISTINGS,
      championPvPStats: {},
      pendingStarterSquad: generateStarterSquad()
    };
  };

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId.trim(),
        callback: async (response) => {
          try {
            setIsSubmitting(true);
            setAuthError(null);
            const res = await ApiService.googleAuth({
              idToken: response.credential,
              initialClubState: buildInitialClubStateForNewUser('GoogleCoach')
            });
            loginWithDatabaseSession(res.user, res.clubState);
          } catch (err: unknown) {
            setAuthError(err instanceof Error ? err.message : 'การเข้าสู่ระบบด้วย Google ล้มเหลว');
          } finally {
            setIsSubmitting(false);
          }
        }
      });

      if (googleButtonContainerRef.current) {
        googleButtonContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 340,
          text: 'signin_with',
          shape: 'rectangular'
        });
      }
    } catch (err) {
      console.warn('Google GIS init warning:', err);
    }
  }, [googleClientId]);

  const handleRealGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);
    const activeClientId = googleClientId.trim();

    setIsSubmitting(true);
    try {
      const { url } = await ApiService.getGoogleAuthorizationUrl(
        activeClientId ? { clientId: activeClientId } : undefined
      );
      window.location.href = url;
    } catch (err: unknown) {
      setIsSubmitting(false);
      setAuthError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อบริการเข้าสู่ระบบด้วย Google ได้ในขณะนี้'
      );
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'signin') {
        const res = await ApiService.login({
          identifier: username.trim(),
          password
        });
        loginWithDatabaseSession(res.user, res.clubState);
      } else {
        const cleanUser = username.trim();
        const res = await ApiService.register({
          username: cleanUser,
          email: email.trim(),
          password,
          initialClubState: buildInitialClubStateForNewUser(cleanUser)
        });
        loginWithDatabaseSession(res.user, res.clubState);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-[#d13639] selection:text-white overflow-hidden">
      {/* LEFT PANEL: Minimalist Riot Client Sign-In Column */}
      <div className="w-full lg:w-[440px] min-h-screen bg-[#111114] border-r border-[#24242c] flex flex-col justify-between p-8 sm:p-10 relative z-10 shrink-0">
        {/* Top Brand & Utility Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#d13639] flex items-center justify-center font-black text-lg text-white tracking-tighter shadow-lg shadow-[#d13639]/30">
              R//E
            </div>
            <div>
              <span className="font-black text-base tracking-widest text-white block leading-none">
                ESPICIAN
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#ff4655]">
                ESPORTS MANAGER CLIENT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSystemDetailsModal(true)}
              className="p-2 rounded-lg bg-[#1a1a20] hover:bg-[#24242c] text-zinc-400 hover:text-white border border-[#2a2a34] transition"
              title="ข้อมูลภาพรวมเกมและระบบสโมสร"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Auth Form */}
        <div className="my-auto py-6 space-y-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#18181e] border border-[#272730]">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthMode('signin');
              }}
              className={`py-2 rounded-lg text-xs font-extrabold transition ${
                authMode === 'signin'
                  ? 'bg-[#d13639] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ลงชื่อเข้าใช้ (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthMode('signup');
              }}
              className={`py-2 rounded-lg text-xs font-extrabold transition ${
                authMode === 'signup'
                  ? 'bg-[#d13639] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              สมัครสมาชิก (Register)
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'signin' ? 'ลงชื่อเข้าใช้' : 'สร้างบัญชีผู้จัดการทีม'}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {authMode === 'signin'
                ? 'เข้าสู่ระบบเพื่อบริหารสโมสรอีสปอร์ตของคุณต่อจากเดิม'
                : 'ลงทะเบียนผู้จัดการทีมใหม่และเริ่มต้นเส้นทางสู่มืออาชีพ'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-[#d13639]/15 border border-[#d13639]/50 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#ff4655] shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                {authMode === 'signin' ? 'USERNAME หรือ EMAIL' : 'USERNAME (อย่างน้อย 3 ตัวอักษร)'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={authMode === 'signin' ? 'ชื่อผู้ใช้ หรือ อีเมล' : 'ตั้งชื่อผู้จัดการทีมของคุณ'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a20] border border-[#2a2a34] focus:border-[#d13639] text-white text-xs font-semibold focus:outline-none transition"
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  EMAIL (อีเมล)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a20] border border-[#2a2a34] focus:border-[#d13639] text-white text-xs font-semibold focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                PASSWORD {authMode === 'signup' && '(อย่างน้อย 6 ตัวอักษร)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a1a20] border border-[#2a2a34] focus:border-[#d13639] text-white text-xs font-semibold focus:outline-none transition"
                />
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => handleRealGoogleSignIn()}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 font-bold text-xs transition flex items-center justify-center gap-2.5 shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                ดำเนินการต่อด้วยบัญชี Google
              </button>

              {googleClientId && (
                <div ref={googleButtonContainerRef} className="flex justify-center pt-1" />
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#d13639]"
              />
              <span className="text-[11px] text-zinc-400">อยู่ในระบบต่อไป (Stay signed in)</span>
            </label>

            {/* Riot Arrow Submit */}
            <div className="pt-3 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-16 h-16 rounded-2xl bg-[#d13639] hover:bg-[#ff4655] disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-xl shadow-[#d13639]/30 group"
              >
                <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Server Status Pill */}
        <div className="border-t border-[#24242c] pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {dbStatus ? 'OFFICIAL SERVER ONLINE' : 'CONNECTING TO SERVER...'}
          </span>
          <span>V2026.14.8</span>
        </div>
      </div>

      {/* RIGHT PANEL: Clean Minimalist Riot Visual Showcase */}
      <div className="flex-1 relative bg-[#0a0a0c] flex flex-col justify-between p-8 sm:p-14 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            background:
              'radial-gradient(circle at 75% 25%, rgba(209, 54, 57, 0.35), transparent 55%), radial-gradient(circle at 25% 80%, rgba(153, 27, 27, 0.25), transparent 50%)'
          }}
        />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16161b] border border-[#2a2a34] text-[11px] font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SEASON 2026 // PATCH 14.8 LIVE
          </div>

          <button
            onClick={() => setShowSystemDetailsModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#16161b] hover:bg-[#22222a] border border-[#2a2a34] text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Info className="w-3.5 h-3.5 text-[#ff4655]" /> ข้อมูลระบบเกม
          </button>
        </div>

        {/* Minimalist Hero Title */}
        <div className="relative z-10 max-w-xl my-auto space-y-4">
          <div className="inline-block px-3 py-0.5 bg-[#d13639]/15 border-l-4 border-[#d13639] text-[#ff4655] text-[11px] font-extrabold tracking-widest uppercase">
            RIOT ESPORTS MANAGER
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]">
            COMMAND THE RIFT. <br />
            <span className="text-[#ff4655]">BUILD YOUR DYNASTY.</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            บริหารสโมสรอีสปอร์ต MOBA 5v5 วางแผนดราฟต์แชมเปี้ยน สั่งการข้างสนามแบบเรียลไทม์ และก้าวขึ้นเป็นแชมป์โลก
          </p>
        </div>

        {/* Minimalist Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-500 font-mono border-t border-[#1e1e26] pt-4">
          <span>ESPICIAN PRO MANAGER &copy; 2026</span>
          <span>PRO LEAGUE OFFICIAL LICENSE</span>
        </div>
      </div>

      {/* System Details Modal */}
      {showSystemDetailsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#2a2a34] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#24242c] pb-3">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#ff4655]" /> ภาพรวมระบบการบริหารสโมสร
              </h3>
              <button
                onClick={() => setShowSystemDetailsModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-[#1a1a22] border border-[#2a2a36]">
                <strong className="text-[#ff4655] block">⚔️ สนามจำลองการแข่งขัน Real-Time 5v5 Simulator</strong>
                <p className="text-zinc-400 mt-0.5">
                  รับชมการเคลื่อนที่และปะทะของฮีโร่ทั้ง 10 ตัวในสนามแบบสดๆ พร้อมสั่งปรับแผนการเล่นข้างสนามได้ตลอดการแข่งขัน
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#1a1a22] border border-[#2a2a36]">
                <strong className="text-amber-400 block">🔓 ระบบเลื่อนระดับผู้จัดการทีม (Manager License Lv.1 – Lv.4)</strong>
                <ul className="mt-1 space-y-1 text-zinc-400">
                  <li>• <strong className="text-white">Lv.1:</strong> สนามแข่ง 2D (Match Day) &amp; จัดการขุมกำลังนักแข่ง (Roster)</li>
                  <li>• <strong className="text-white">Lv.2:</strong> ศูนย์ฝึกซ้อม (Training) &amp; วางแผนดราฟต์แชมเปี้ยน (Tactics)</li>
                  <li>• <strong className="text-white">Lv.3:</strong> อัปเกรดเกมมิ่งเกียร์ +5 (Gear &amp; Staff) &amp; ฐานข้อมูล 40 แชมเปี้ยน</li>
                  <li>• <strong className="text-white">Lv.4:</strong> ตลาดซื้อขายนักแข่ง (Market) &amp; ห้องแข่งขันออนไลน์ (LAN Lobby)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
