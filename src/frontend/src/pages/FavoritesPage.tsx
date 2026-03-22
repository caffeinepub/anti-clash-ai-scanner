import { Button } from "@/components/ui/button";
import { Camera, Heart, Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { toast } from "sonner";
import type { FavoriteColor } from "../backend.d";
import { useDeleteFavorite, useGetFavorites } from "../hooks/useQueries";

interface FavoriteCardProps {
  item: FavoriteColor;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function FavoriteCard({
  item,
  index,
  onDelete,
  isDeleting,
}: FavoriteCardProps) {
  let palette: { complementary?: Array<{ hex: string; name: string }> } | null =
    null;
  try {
    palette = JSON.parse(item.harmonyPalette);
  } catch (_) {}

  const date = new Date(Number(item.timestamp) / 1_000_000);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      className="bg-card rounded-2xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`favorites.item.${index + 1}`}
    >
      <div className="flex gap-4 p-4">
        <div
          className="w-16 h-16 rounded-xl flex-shrink-0 border border-border shadow-card"
          style={{ backgroundColor: item.color.hex }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground">
            {item.color.name}
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            {item.color.hex}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
          {palette?.complementary && palette.complementary.length > 0 && (
            <div className="flex gap-1 mt-2">
              {palette.complementary.slice(0, 4).map((c) => (
                <div
                  key={c.hex}
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
          data-ocid={`favorites.delete_button.${index + 1}`}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

interface FavoritesPageProps {
  onNavigate: (tab: "scanner" | "favorites" | "style") => void;
}

export default function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const { data: favorites, isLoading, isError } = useGetFavorites();
  const deleteFavorite = useDeleteFavorite();

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteFavorite.mutateAsync(id);
      toast.success("Removed from favorites");
    },
    [deleteFavorite],
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-ocid="favorites.loading_state"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-20"
        data-ocid="favorites.error_state"
      >
        <p className="text-destructive">Failed to load favorites</p>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center gap-4 py-20 text-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-ocid="favorites.empty_state"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-foreground text-lg">
          No favorites yet
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Scan a color, get AI advice, and save your favorite palettes here.
        </p>
        <Button
          onClick={() => onNavigate("scanner")}
          className="gap-2 mt-2"
          data-ocid="favorites.primary_button"
        >
          <Camera className="w-4 h-4" /> Start Scanning
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-foreground">
          Saved Palettes
        </h2>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {favorites.length} saved
        </span>
      </div>
      <AnimatePresence>
        {favorites.map((item, i) => (
          <FavoriteCard
            key={item.id}
            item={item}
            index={i}
            onDelete={handleDelete}
            isDeleting={
              deleteFavorite.isPending && deleteFavorite.variables === item.id
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
