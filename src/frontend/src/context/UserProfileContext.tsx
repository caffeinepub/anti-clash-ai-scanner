import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface UserProfileContextValue {
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  userProfile: null,
  isLoadingProfile: false,
  refreshProfile: async () => {},
});

export function UserProfileProvider({
  children,
}: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isLoggedIn = identity && !identity.getPrincipal().isAnonymous();

  const refreshProfile = useCallback(async () => {
    if (!actor) return;
    try {
      setIsLoadingProfile(true);
      const profile = await actor.getCallerUserProfile();
      setUserProfile(profile);
    } catch {
      // ignore
    } finally {
      setIsLoadingProfile(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!isLoggedIn || isFetching || !actor) return;
    refreshProfile();
  }, [isLoggedIn, isFetching, actor, refreshProfile]);

  return (
    <UserProfileContext.Provider
      value={{ userProfile, isLoadingProfile, refreshProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
