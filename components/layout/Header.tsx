import { createClient } from "@/lib/supabase/server";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-60 right-0 z-40 h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>{user?.email ?? "—"}</span>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit" className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            Выход
          </Button>
        </form>
      </div>
    </header>
  );
}
