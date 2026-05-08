import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/galeria")({ component: Galeria });

function Galeria() {
  const { isAdmin } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => {
      setPhotos(data ?? []);
    });
  }, []);

  const url = (p: string) => supabase.storage.from("photos").getPublicUrl(p).data.publicUrl;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ImageIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Galeria</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        {isAdmin ? "Todas as fotos da Província." : "Fotos do seu agrupamento."}
      </p>

      {photos.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Sem fotos ainda.
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="aspect-square rounded-md overflow-hidden border bg-muted">
              <img src={url(p.file_path)} alt={p.caption ?? ""} className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
