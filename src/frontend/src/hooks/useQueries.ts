import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FavoriteColor, HarmonyPalette, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetFavorites() {
  const { actor, isFetching } = useActor();
  return useQuery<FavoriteColor[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFavorites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetHarmonyAdvice(hexColor: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<HarmonyPalette>({
    queryKey: ["harmony", hexColor],
    queryFn: async () => {
      if (!actor || !hexColor) throw new Error("No color");
      return actor.getHarmonyAdvice(hexColor);
    },
    enabled: !!actor && !isFetching && !!hexColor,
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      hex,
      name,
      harmonyPalette,
    }: { hex: string; name: string; harmonyPalette: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.addFavoriteColor(hex, name, harmonyPalette);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useDeleteFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteFavoriteById(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
