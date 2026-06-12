import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FullReport, FreeReport, UserProfile } from "../types";

const initialProfile: UserProfile = {
  careerDirection: "",
  priority: "",
  longTermStudy: "",
  cityPreference: "",
  riskPreference: "",
  province: "",
  subjectType: "",
  score: "",
  rank: "",
};

interface ProfileState {
  profile: UserProfile;
  freeReport: FreeReport | null;
  fullReport: FullReport | null;
  profileId: string | null;
  reportId: string | null;
  orderId: string | null;
  chatSessionId: string | null;
  setField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  setFreeReport: (report: FreeReport) => void;
  setFullReport: (report: FullReport) => void;
  setProfileId: (profileId: string) => void;
  setReportId: (reportId: string) => void;
  setOrderId: (orderId: string) => void;
  setChatSessionId: (chatSessionId: string) => void;
  clearAnalysis: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      freeReport: null,
      fullReport: null,
      profileId: null,
      reportId: null,
      orderId: null,
      chatSessionId: null,
      setField: (key, value) =>
        set((state) => ({ profile: { ...state.profile, [key]: value } })),
      setProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),
      setFreeReport: (freeReport) => set({ freeReport }),
      setFullReport: (fullReport) => set({ fullReport }),
      setProfileId: (profileId) => set({ profileId }),
      setReportId: (reportId) => set({ reportId }),
      setOrderId: (orderId) => set({ orderId }),
      setChatSessionId: (chatSessionId) => set({ chatSessionId }),
      clearAnalysis: () =>
        set({
          freeReport: null,
          fullReport: null,
          profileId: null,
          reportId: null,
          orderId: null,
          chatSessionId: null,
        }),
      reset: () =>
        set({
          profile: initialProfile,
          freeReport: null,
          fullReport: null,
          profileId: null,
          reportId: null,
          orderId: null,
          chatSessionId: null,
        }),
    }),
    { name: "future-path-profile" },
  ),
);
