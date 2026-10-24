import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth as authApi, getToken, setToken, clearToken } from "../lib/api";

export type UserType = "student" | "elder";

export interface StudentProfile {
  id: string;
  age: number;
  gender: string;
  course: string;
  hobbies: string[];
  connectedMentorId?: string;
}

export interface ElderProfile {
  id: string;
  gender: string;
  passion: string;
  hobbies: string[];
}

export interface DiaryEntry {
  id: string;
  studentId: string;
  content: string;
  timestamp: Date;
  mood?: string;
}

export interface VerificationState {
  isVerified: boolean;
  phone: string | null;
  zkCommitment: string | null;   // SHA-256 hash — raw Aadhaar is never stored
  anonymousHandle: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType | null;
  studentProfile: StudentProfile | null;
  elderProfile: ElderProfile | null;
  verification: VerificationState;
  login: (type: UserType, profile: StudentProfile | ElderProfile) => void;
  loginWithToken: (token: string, user: any) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  updateStudentMentor: (mentorId: string) => void;
  verifyUser: (phone: string, zkCommitment: string, handle: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [elderProfile, setElderProfile] = useState<ElderProfile | null>(null);
  const [verification, setVerification] = useState<VerificationState>(() => {
    try {
      const saved = sessionStorage.getItem('mindmate_verification');
      if (saved) return JSON.parse(saved) as VerificationState;
    } catch {
      // Ignore malformed session state and start a fresh verification flow.
    }
    return {
      isVerified: false,
      phone: null,
      zkCommitment: null,
      anonymousHandle: null,
    };
  });

  // ─── Auto-login on mount: validate existing token ──────
  useEffect(() => {
    const validateToken = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          const user = response.data.user;
          setIsAuthenticated(true);
          setUserType(user.userType);
          setVerification({
            isVerified: true,
            phone: null, // Never stored
            zkCommitment: user.zkCommitment,
            anonymousHandle: user.anonymousHandle,
          });

           if (user.userType === "student") {
             setElderProfile(null);
             setStudentProfile({
              id: user._id,
              age: user.age,
              gender: user.gender,
              course: user.course,
              hobbies: user.hobbies || [],
              connectedMentorId: user.connectedMentorId,
            });
           } else {
             setStudentProfile(null);
             setElderProfile({
              id: user._id,
              gender: user.gender,
              passion: user.passion,
              hobbies: user.hobbies || [],
            });
          }
        }
      } catch {
        // Token invalid or expired — clear it
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const verifyUser = (phone: string, zkCommitment: string, handle: string) => {
    const nextVerification = {
      isVerified: true,
      phone,
      zkCommitment,
      anonymousHandle: handle,
    };
    setVerification(nextVerification);
    sessionStorage.setItem('mindmate_verification', JSON.stringify(nextVerification));
  };

  /**
   * Called after register/login API response with token + user data.
   */
  const loginWithToken = (token: string, user: any) => {
    setToken(token);
    sessionStorage.removeItem('mindmate_verification');
    setIsAuthenticated(true);
    setUserType(user.userType);
    setVerification({
      isVerified: true,
      phone: null,
      zkCommitment: user.zkCommitment,
      anonymousHandle: user.anonymousHandle,
    });

    if (user.userType === "student") {
      setElderProfile(null);
      setStudentProfile({
        id: user._id,
        age: user.age,
        gender: user.gender,
        course: user.course,
        hobbies: user.hobbies || [],
        connectedMentorId: user.connectedMentorId,
      });
    } else {
      setStudentProfile(null);
      setElderProfile({
        id: user._id,
        gender: user.gender,
        passion: user.passion,
        hobbies: user.hobbies || [],
      });
    }
  };

  /**
   * Legacy login (for backwards compat with existing pages until fully migrated).
   */
  const login = (type: UserType, profile: StudentProfile | ElderProfile) => {
    setIsAuthenticated(true);
    setUserType(type);
    if (type === "student") {
      setStudentProfile(profile as StudentProfile);
    } else {
      setElderProfile(profile as ElderProfile);
    }
  };

  const logout = () => {
    clearToken();
    sessionStorage.removeItem('mindmate_verification');
    setIsAuthenticated(false);
    setUserType(null);
    setStudentProfile(null);
    setElderProfile(null);
    setVerification({ isVerified: false, phone: null, zkCommitment: null, anonymousHandle: null });
  };

  const updateStudentMentor = (mentorId: string) => {
    if (studentProfile) {
      setStudentProfile({ ...studentProfile, connectedMentorId: mentorId });
    }
  };

  const refreshUser = async () => {
    const response = await authApi.getMe();
    if (!response.success || !response.data?.user) {
      throw new Error(response.message || 'Unable to refresh your profile');
    }

    const user = response.data.user;
    setIsAuthenticated(true);
    setUserType(user.userType);
    setVerification({
      isVerified: true,
      phone: null,
      zkCommitment: user.zkCommitment,
      anonymousHandle: user.anonymousHandle,
    });

    if (user.userType === 'student') {
      setStudentProfile({
        id: user._id,
        age: user.age,
        gender: user.gender,
        course: user.course,
        hobbies: user.hobbies || [],
        connectedMentorId: user.connectedMentorId,
      });
      setElderProfile(null);
    } else {
      setStudentProfile(null);
      setElderProfile({
        id: user._id,
        gender: user.gender,
        passion: user.passion,
        hobbies: user.hobbies || [],
      });
      setStudentProfile(null);
    }
  };

  // Show nothing while checking token (prevents flash of login page)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] animate-pulse" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userType,
        studentProfile,
        elderProfile,
        verification,
        login,
        loginWithToken,
        refreshUser,
        logout,
        updateStudentMentor,
        verifyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
