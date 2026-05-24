import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** Optional custom action node (e.g. a Button that opens a Dialog).
   *  When provided, overrides the default Link-based action. */
  actionNode?: React.ReactNode;
}

export default function PageHeader({ title, description, action, actionNode }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actionNode ? (
        actionNode
      ) : action ? (
        <Link href={action.href} className={buttonVariants({ size: "sm" }) + " gap-2"}>
          <Plus className="w-4 h-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
